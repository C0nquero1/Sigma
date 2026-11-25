import os
import re
import time
import math
import httpx
import logging
import asyncio
from typing import Dict, Any, List, Tuple, Optional
from engine.llm_router import llm_router, locationiq_pool, overpass_ch_pool, nextgis_pool

logger = logging.getLogger("StreetAI.OvertureMultiplexer")

GOOGLE_CONSENT_COOKIES = {
    "SOCS": "CAESEwgDEgk0ODE3Nzk3MjQaAmVuIAEaBgiA_LyaBg",
    "CONSENT": "PENDING+987",
}


def _haversine_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371000.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2.0) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2.0) ** 2
    return 2.0 * r * math.asin(min(1.0, math.sqrt(a)))


def _query_overture_pyarrow_sync(
    lat: float, lon: float, d_deg: float = 0.0020
) -> Dict[str, Any]:
    """
    Zero-API-Key Overture Maps GeoParquet reader via official `overturemaps` (PyArrow S3).
    - Zero DuckDB DLLs (immune to Windows 0xc000001d illegal-instruction crashes).
    - Automatically queries the latest Overture STAC release with GeoParquet bbox pruning.
    """
    try:
        import overturemaps
    except ImportError:
        logger.warning("⚠️ `overturemaps` package not installed (`pip install overturemaps`).")
        return {}

    try:
        from shapely import wkb as shapely_wkb
    except ImportError:
        shapely_wkb = None

    bbox = (
        round(lon - d_deg, 6),
        round(lat - d_deg, 6),
        round(lon + d_deg, 6),
        round(lat + d_deg, 6),
    )
    m_per_deg_lat = 111139.0
    m_per_deg_lon = 111139.0 * math.cos(math.radians(lat))

    bldg_count = 0
    levels_tagged = 0
    total_2d = 0.0
    total_3d = 0.0
    polygons: List[Dict[str, float]] = []
    overture_places: List[Dict[str, Any]] = []
    overture_names: List[str] = []

    # 1. Real 3D Building Polygons (`num_floors`, `height`, exact area)
    try:
        b_reader = overturemaps.record_batch_reader("building", bbox)
        if b_reader is not None:
            b_table = b_reader.read_all()
            cols = set(b_table.column_names)
            pick = [c for c in ("bbox", "num_floors", "height", "geometry") if c in cols]
            rows = b_table.select(pick).slice(0, 220).to_pylist()
            for r in rows:
                bb = r.get("bbox") or {}
                bx1, bx2 = bb.get("xmin"), bb.get("xmax")
                by1, by2 = bb.get("ymin"), bb.get("ymax")
                if None in (bx1, bx2, by1, by2):
                    continue

                area_sqm = 0.0
                geom_bytes = r.get("geometry")
                if shapely_wkb is not None and geom_bytes:
                    try:
                        geom_obj = shapely_wkb.loads(geom_bytes)
                        area_sqm = round(float(geom_obj.area) * m_per_deg_lat * m_per_deg_lon, 2)
                    except Exception:
                        area_sqm = 0.0
                if area_sqm <= 0.0:
                    area_sqm = round(
                        abs(float(bx2) - float(bx1)) * m_per_deg_lon * abs(float(by2) - float(by1)) * m_per_deg_lat,
                        2,
                    )
                if not (15.0 <= area_sqm <= 180_000.0):
                    continue

                n_floors = r.get("num_floors")
                height_m = r.get("height")
                if n_floors is not None and int(n_floors) >= 1:
                    floors = min(80, int(n_floors))
                    levels_tagged += 1
                elif height_m is not None and float(height_m) >= 3.2:
                    floors = max(1, min(80, int(round(float(height_m) / 3.4))))
                    levels_tagged += 1
                else:
                    floors = 1

                bldg_count += 1
                total_2d += area_sqm
                total_3d += area_sqm * floors
                polygons.append({
                    "lat": round((float(by1) + float(by2)) / 2.0, 6),
                    "lon": round((float(bx1) + float(bx2)) / 2.0, 6),
                    "area_sqm": area_sqm,
                })
    except Exception as e:
        logger.warning(f"⚠️ Overture PyArrow buildings query error: {e}")

    # 2. Informal & Formal Places (supports both 2026 `taxonomy.primary` and legacy `categories.primary`)
    try:
        p_reader = overturemaps.record_batch_reader("place", bbox)
        if p_reader is not None:
            p_table = p_reader.read_all()
            cols = set(p_table.column_names)
            pick = [c for c in ("names", "taxonomy", "categories", "basic_category", "bbox") if c in cols]
            rows = p_table.select(pick).slice(0, 140).to_pylist()
            for r in rows:
                names_obj = r.get("names") or {}
                title = str(names_obj.get("primary") or "").strip() if isinstance(names_obj, dict) else ""
                if not title:
                    continue
                tax_obj = r.get("taxonomy") or r.get("categories") or {}
                cat = (
                    str(tax_obj.get("primary") or r.get("basic_category") or "commercial").strip().lower()
                    if isinstance(tax_obj, dict)
                    else str(r.get("basic_category") or "commercial").strip().lower()
                )
                bb = r.get("bbox") or {}
                bx1, bx2 = bb.get("xmin"), bb.get("xmax")
                by1, by2 = bb.get("ymin"), bb.get("ymax")
                if None in (bx1, bx2, by1, by2):
                    continue
                plat = round((float(by1) + float(by2)) / 2.0, 6)
                plon = round((float(bx1) + float(bx2)) / 2.0, 6)
                overture_places.append({
                    "title": title,
                    "type": cat,
                    "lat": plat,
                    "lon": plon,
                    "reviews": 0,
                })
                if title not in overture_names and len(overture_names) < 25:
                    overture_names.append(title)
    except Exception as e:
        logger.warning(f"⚠️ Overture PyArrow places query error: {e}")

    return {
        "overture_release": "STAC_LATEST_PYARROW",
        "osm_buildings_count": bldg_count,
        "osm_levels_tagged_count": levels_tagged,
        "total_osm_footprint_sqm": round(total_2d, 2),
        "total_osm_3d_gross_floor_sqm": round(total_3d, 2),
        "polygons": polygons[:80],
        "overture_places": overture_places,
        "overture_venue_names": overture_names,
    }


class LiveInfrastructureEngine:
    """
    100% Empirical Coalesced Spatial Multiplexer (Zero Fabricated Counts/Ratings).
    Divides spatial workload so each source runs only what it executes fastest and most reliably:
      1. Overture Maps Official PyArrow Reader: 3D Building Polygons (`num_floors`, `height`, area) + Informal Places.
      2. LocationIQ Nearby API (4-Key Rotating Pool = 20,000 req/day): Reliable OSM shops, markets, banks/ATMs & transit.
      3. Lightweight Overpass (`out center tags`, zero heavy polygon `out geom`): `opening_hours`, cameras, crossings.
      4. Esri ArcGIS World GeocodeServer + Photon Komoot + Nominatim Reverse (with automatic retry).
      5. Google Maps Direct PB-Stream (SOCS consent cookies) + Wikimedia Geosearch.
    """
    _cache: Dict[str, Tuple[float, Dict[str, Any]]] = {}
    _locks: Dict[str, asyncio.Lock] = {}
    _serpapi_exhausted: bool = True
    _wigle_exhausted: bool = False

    OVERPASS_MIRRORS = [
        "https://overpass.maprva.org/api/interpreter",
        "https://overpass-api.de/api/interpreter",
        "https://overpass.private.coffee/api/interpreter",
    ]

    def __init__(self):
        self.headers = {
            "User-Agent": "StreetAI-OvertureMultiplexer/9.6 (https://streetai.io; contact@streetai.io) httpx/0.27"
        }
        self.browser_headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9",
        }

    @staticmethod
    def _is_valid_merchant_title(title: str) -> bool:
        t = (title or "").strip()
        if len(t) < 3 or len(t) > 55:
            return False
        if any(ch in t for ch in ("·", "⋅", "•", "[", "]", "{", "}", "=", ";", "\\", "<", ">", "+")):
            return False
        low = t.lower()
        if re.search(
            r"\b(\d+\s*reviews?|open\s*now|open\s*24|closes\s+|opens\s+|reopens|shop\s*no|no[:.]?\s*\d|badagry\s*express|cantonment|university|bus\s*stop|station)\b",
            low,
        ):
            return False
        if re.match(r"^\d{1,6}\b", t):
            return False
        alpha_cnt = sum(1 for c in t if c.isalpha())
        digit_cnt = sum(1 for c in t if c.isdigit())
        if alpha_cnt < 3 or digit_cnt > 3:
            return False
        return True

    _overture_sem: Optional[asyncio.Semaphore] = None

    async def _fetch_overture_geoparquet(self, lat: float, lon: float) -> Dict[str, Any]:
        ov_cache_key = f"ov_pyarrow_v1:{round(lat, 4)}:{round(lon, 4)}"
        cached_ov = llm_router.get_cached(ov_cache_key)
        if isinstance(cached_ov, dict) and (
            cached_ov.get("osm_buildings_count", 0) > 0 or len(cached_ov.get("overture_places", [])) > 0
        ):
            return cached_ov

        # Prevents concurrent S3 parquet footer scans from choking local bandwidth and starving FX/Weather APIs
        if os.getenv("ENABLE_OVERTURE_S3", "false").lower() != "true":
            return {}

        if LiveInfrastructureEngine._overture_sem is None:
            LiveInfrastructureEngine._overture_sem = asyncio.Semaphore(1)

        async with LiveInfrastructureEngine._overture_sem:
            try:
                res = await asyncio.wait_for(
                    asyncio.to_thread(_query_overture_pyarrow_sync, lat, lon, 0.0020),
                    timeout=20.0,
                )
                if isinstance(res, dict) and (
                    res.get("osm_buildings_count", 0) > 0 or len(res.get("overture_places", [])) > 0
                ):
                    llm_router.set_cached(ov_cache_key, res, ttl_seconds=604800)
                    logger.info(
                        f"🗺️ Overture PyArrow Locked: {res.get('osm_buildings_count', 0)} 3D buildings "
                        f"({res.get('total_osm_3d_gross_floor_sqm', 0.0):,.1f} sqm) + "
                        f"{len(res.get('overture_places', []))} places."
                    )
                    return res
            except asyncio.TimeoutError:
                logger.warning(f"⚠️ Overture PyArrow timed out after 20s for ({lat:.4f},{lon:.4f}).")
            except Exception as e:
                logger.warning(f"⚠️ Overture PyArrow failed: {repr(e)}")
        return {}

    async def _fetch_locationiq_nearby_pois(
        self, lat: float, lon: float
    ) -> Dict[str, Any]:
        """
        Queries LocationIQ Nearby Places API (`us1.locationiq.com/v1/nearby.php`) across your 4 rotating keys
        (20,000 req/day combined) for real OSM shops, markets, banks/ATMs, and transit hubs. Cached 7 days.
        """
        empty = {"shops": [], "cico": [], "transit_count": 0, "venue_names": []}
        ck = f"liq_nearby_v1:{round(lat, 4)}:{round(lon, 4)}"
        cached = llm_router.get_cached(ck)
        if isinstance(cached, dict) and (
            cached.get("shops") or cached.get("cico") or cached.get("transit_count", 0) > 0
        ):
            return cached

        if locationiq_pool.count == 0:
            return empty

        shops: List[Dict[str, Any]] = []
        cico: List[Dict[str, Any]] = []
        venue_names: List[str] = []
        transit_count = 0

        try:
            async with httpx.AsyncClient(timeout=8.0, headers=self.headers) as client:
                res = None
                for _ in range(min(3, locationiq_pool.count)):
                    liq_key = locationiq_pool.next_key()
                    if not liq_key:
                        break
                    r_try = await client.get(
                        "https://us1.locationiq.com/v1/nearby.php",
                        params={
                            "key": liq_key,
                            "lat": round(lat, 6),
                            "lon": round(lon, 6),
                            "radius": 650,
                            "limit": 50,
                            "tag": "shop:*,amenity:marketplace,amenity:bank,amenity:atm,amenity:bus_station,railway:station,amenity:restaurant,amenity:cafe",
                            "format": "json",
                        },
                    )
                    if r_try.status_code == 429:
                        locationiq_pool.mark_cooldown(liq_key, 15.0)
                        continue
                    res = r_try
                    break

                if res is not None and res.status_code == 200 and isinstance(res.json(), list):
                    for item in res.json():
                        cls_t = str(item.get("class") or "").lower()
                        typ_t = str(item.get("type") or "").lower()
                        name = str(item.get("name") or "").strip()
                        p_lat = item.get("lat")
                        p_lon = item.get("lon")
                        if p_lat is None or p_lon is None:
                            continue

                        if typ_t in ("bus_station", "station", "subway_entrance", "tram_stop"):
                            transit_count += 1
                            continue

                        if typ_t in ("bank", "atm", "bureau_de_change", "money_transfer"):
                            cico.append({
                                "title": name or typ_t.upper(),
                                "type": typ_t,
                                "url": "",
                                "lat": float(p_lat),
                                "lon": float(p_lon),
                            })
                        elif cls_t == "shop" or typ_t in ("marketplace", "supermarket", "restaurant", "cafe"):
                            if name and self._is_valid_merchant_title(name):
                                shops.append({
                                    "title": name,
                                    "type": typ_t or "shop",
                                    "address": str(item.get("display_name") or ""),
                                    "lat": float(p_lat),
                                    "lon": float(p_lon),
                                    "reviews": 0,
                                })
                                if name not in venue_names:
                                    venue_names.append(name)
        except Exception as e:
            logger.debug(f"LocationIQ Nearby POI pivot: {e}")

        out = {"shops": shops, "cico": cico, "transit_count": transit_count, "venue_names": venue_names[:25]}
        if shops or cico or transit_count > 0:
            llm_router.set_cached(ck, out, ttl_seconds=604800)  # 7 days
            logger.info(
                f"📍 LocationIQ Nearby Locked ({lat:.4f},{lon:.4f}): "
                f"{len(shops)} shops, {len(cico)} banks/ATMs, {transit_count} transit hubs."
            )
        return out

    def _build_overpass_endpoints(self) -> List[Tuple[str, str]]:
        """Returns ordered `(display_name, url)` list without ever logging secret API keys."""
        endpoints: List[Tuple[str, str]] = []
        ovp_key = overpass_ch_pool.next_key()
        if ovp_key:
            endpoints.append(("overpass.ch", f"https://api.overpass.ch/v1/{ovp_key}/cpp/interpreter"))
        ng_key = nextgis_pool.next_key()
        if ng_key:
            endpoints.append(("overpass.nextgis.com", f"https://overpass.nextgis.com/{ng_key}/api/interpreter"))
        for m in self.OVERPASS_MIRRORS:
            endpoints.append((m, m))
        return endpoints

    async def _fetch_coalesced_overpass(self, lat: float, lon: float) -> Dict[str, Any]:
        osm_cache_key = f"osm_meta_v4:{round(lat, 4)}:{round(lon, 4)}"
        cached_osm = llm_router.get_cached(osm_cache_key)
        if isinstance(cached_osm, dict) and (
            cached_osm.get("osm_shops_count", 0) > 0
            or cached_osm.get("osm_transit_hubs_count", 0) > 0
            or len(cached_osm.get("osm_opening_hours_observed", [])) > 0
        ):
            return cached_osm

        d = 0.0025
        bbox = f"{lat - d:.5f},{lon - d:.5f},{lat + d:.5f},{lon + d:.5f}"
        q_light = (
            f"[out:json][timeout:10];("
            f'nwr["amenity"~"marketplace|bank|atm|bureau_de_change|money_transfer|pharmacy|restaurant|cafe"]({bbox});'
            f'node["man_made"="surveillance"]({bbox});'
            f'node["contact:webcam"]({bbox});'
            f'node["highway"~"crossing|bus_stop"]({bbox});'
            f'node["railway"~"subway_entrance|station|tram_stop"]({bbox});'
            f'node["public_transport"~"platform|stop_position"]({bbox});'
            f");out center tags qt 180;"
        )

        els: Optional[List[Dict[str, Any]]] = None
        async with llm_router.get_overpass_semaphore():
            async with httpx.AsyncClient(timeout=12.0, headers=self.headers) as client:
                for label, mirror_url in self._build_overpass_endpoints():
                    try:
                        res = await client.post(mirror_url, data={"data": q_light})
                        if res.status_code == 200:
                            cand = res.json().get("elements", [])
                            if isinstance(cand, list):
                                els = cand
                                break
                        elif res.status_code == 429:
                            logger.warning(f"⚡ Overpass mirror {label} rate-limited (429); pivoting.")
                        else:
                            logger.warning(f"⚡ Overpass mirror {label} returned HTTP {res.status_code}")
                    except Exception as e:
                        logger.warning(f"⚡ Overpass mirror {label} error: {type(e).__name__}")
                await asyncio.sleep(0.35)

        parsed = self._parse_overpass_elements(els or [])
        if (
            parsed["osm_shops_count"] > 0
            or parsed["osm_transit_hubs_count"] > 0
            or len(parsed["osm_opening_hours_observed"]) > 0
        ):
            llm_router.set_cached(osm_cache_key, parsed, ttl_seconds=604800)
        return parsed

    @staticmethod
    def _parse_overpass_elements(elements: List[Dict[str, Any]]) -> Dict[str, Any]:
        shops_count = 0
        indoor_units_count = 0
        cico_count = 0
        surveillance_count = 0
        transit_count = 0
        crossing_count = 0

        webcam_urls: List[str] = []
        opening_hours_list: List[str] = []
        venue_names: List[str] = []
        cico_domains: List[str] = []
        merchant_coords: List[Dict[str, Any]] = []

        for el in elements:
            tags = el.get("tags", {})
            name = str(tags.get("name") or tags.get("name:en") or "").strip()
            amenity = str(tags.get("amenity") or "").lower()
            shop = str(tags.get("shop") or "").lower()
            indoor = str(tags.get("indoor") or "").lower()
            highway = str(tags.get("highway") or "").lower()
            railway = str(tags.get("railway") or "").lower()
            pub_tr = str(tags.get("public_transport") or "").lower()
            man_made = str(tags.get("man_made") or "").lower()

            center = el.get("center") or {}
            el_lat = el.get("lat") if el.get("lat") is not None else center.get("lat")
            el_lon = el.get("lon") if el.get("lon") is not None else center.get("lon")

            oh = str(tags.get("opening_hours") or "").strip()
            if oh and len(oh) <= 80 and oh not in opening_hours_list:
                opening_hours_list.append(oh)

            webcam = str(tags.get("contact:webcam") or tags.get("url:webcam") or "").strip()
            if webcam and webcam.startswith("http") and webcam not in webcam_urls:
                webcam_urls.append(webcam)

            if man_made == "surveillance":
                surveillance_count += 1
            if highway == "crossing":
                crossing_count += 1
            if (
                highway == "bus_stop"
                or railway in ("subway_entrance", "station", "tram_stop")
                or pub_tr in ("platform", "stop_position")
            ):
                transit_count += 1

            if indoor in ("room", "area") or tags.get("addr:unit"):
                indoor_units_count += 1

            if shop or amenity in ("marketplace", "pharmacy", "restaurant", "cafe"):
                shops_count += 1
                if name and len(name) >= 3 and name not in venue_names:
                    venue_names.append(name)
                if el_lat is not None and el_lon is not None:
                    merchant_coords.append({
                        "title": name or shop or amenity,
                        "type": shop or amenity,
                        "lat": float(el_lat),
                        "lon": float(el_lon),
                        "opening_hours": oh or None,
                    })

            if amenity in ("bank", "atm", "bureau_de_change", "money_transfer"):
                cico_count += 1
                website = str(tags.get("website") or tags.get("contact:website") or "").strip()
                if website and website not in cico_domains:
                    cico_domains.append(website)
                brand = str(tags.get("brand") or tags.get("operator") or name).strip()
                if brand and len(brand) >= 3 and brand not in venue_names:
                    venue_names.append(brand)

        return {
            "osm_shops_count": shops_count,
            "osm_indoor_units_count": indoor_units_count,
            "osm_cico_count": cico_count,
            "osm_surveillance_nodes_count": surveillance_count,
            "osm_webcam_urls": webcam_urls[:10],
            "osm_transit_hubs_count": transit_count,
            "osm_pedestrian_crossings_count": crossing_count,
            "osm_opening_hours_observed": opening_hours_list[:15],
            "osm_venue_names": venue_names[:25],
            "cico_domains": cico_domains[:10],
            "osm_merchant_coords": merchant_coords[:80],
        }

    async def _fetch_wikimedia_geosearch(self, lat: float, lon: float) -> List[Dict[str, Any]]:
        entities: List[Dict[str, Any]] = []
        try:
            async with httpx.AsyncClient(timeout=4.5, headers=self.headers) as client:
                res = await client.get(
                    "https://en.wikipedia.org/w/api.php",
                    params={
                        "action": "query",
                        "list": "geosearch",
                        "gscoord": f"{lat:.5f}|{lon:.5f}",
                        "gsradius": 500,
                        "gslimit": 8,
                        "format": "json",
                    },
                )
                if res.status_code == 200:
                    for item in res.json().get("query", {}).get("geosearch", []):
                        entities.append({
                            "title": str(item.get("title") or ""),
                            "dist_m": round(float(item.get("dist", 0.0)), 1),
                            "lat": float(item.get("lat", lat)),
                            "lon": float(item.get("lon", lon)),
                            "pageid": item.get("pageid"),
                        })
        except Exception as e:
            logger.debug(f"Wikimedia geosearch pivot: {e}")
        return entities

    async def _fetch_google_maps_direct_pb(
        self, lat: float, lon: float, query_str: str, default_type: str
    ) -> List[Dict[str, Any]]:
        from urllib.parse import quote_plus
        pb_param = (
            f"!4m12!1m3!1d2200.0!2d{lon:.6f}!3d{lat:.6f}"
            f"!2m3!1f0!2f0!3f0!3m2!1i1280!2i800!4f13.1!7i20!10b1"
        )
        raw_url = (
            f"https://www.google.com/search?tbm=map&authuser=0&hl=en&gl=us&ucbcb=1"
            f"&q={quote_plus(query_str)}&pb={pb_param}"
        )
        pois: List[Dict[str, Any]] = []
        seen_titles = set()

        try:
            async with httpx.AsyncClient(
                timeout=6.0,
                follow_redirects=True,
                headers=self.browser_headers,
                cookies=GOOGLE_CONSENT_COOKIES,
            ) as client:
                res = await client.get(raw_url)
                if res.status_code == 200 and res.text and "consent.google.com" not in str(res.url):
                    raw_text = res.text
                    coord_matches = list(
                        re.finditer(r"\[null,null,(-?\d+\.\d{4,8}),(-?\d+\.\d{4,8})\]", raw_text)
                    )
                    for m in coord_matches:
                        p_lat, p_lon = float(m.group(1)), float(m.group(2))
                        if abs(p_lat - lat) > 0.025 or abs(p_lon - lon) > 0.025:
                            continue
                        start_idx = max(0, m.start() - 650)
                        end_idx = min(len(raw_text), m.end() + 650)
                        window = raw_text[start_idx:end_idx]

                        candidates = re.findall(r'(?:\\"|")([A-Za-z0-9\u00C0-\u024F][^"\\]{2,48})(?:\\"|")', window)
                        chosen_title = ""
                        for cand in candidates:
                            if self._is_valid_merchant_title(cand) and not cand.startswith(("http", "0x", "ChIJ", "AF1Qip")):
                                chosen_title = cand.strip()
                                break

                        if chosen_title and chosen_title.lower() not in seen_titles:
                            seen_titles.add(chosen_title.lower())
                            rev_m = re.search(r"\b(\d{1,6})\s+reviews?\b", window, flags=re.IGNORECASE)
                            reviews_cnt = int(rev_m.group(1)) if rev_m else 0

                            rat_m = re.search(r",([1-5]\.\d),(\d{1,6})\]", window)
                            observed_rating = float(rat_m.group(1)) if rat_m else None
                            if not reviews_cnt and rat_m:
                                reviews_cnt = int(rat_m.group(2))

                            hr_m = re.search(
                                r"\b((?:Open|Opens|Closes|Closed)[^\"\\]{0,28}(?:am|pm|24 hours))\b",
                                window,
                                flags=re.IGNORECASE,
                            )
                            observed_hours_text = hr_m.group(1).strip() if hr_m else None

                            win_low = window.lower()
                            explicit_open = bool(re.search(r"\b(open now|open 24 hours|closes soon)\b", win_low))
                            explicit_closed = bool(re.search(r"\b(closed|opens at|opens soon|temporarily closed)\b", win_low))
                            is_busy_surge = bool(re.search(r"\b(busier than usual|as busy as it gets)\b", win_low))

                            pois.append({
                                "title": chosen_title,
                                "type": default_type,
                                "reviews": reviews_cnt,
                                "rating": observed_rating,
                                "lat": p_lat,
                                "lon": p_lon,
                                "observed_hours_text": observed_hours_text,
                                "is_open_now": True if explicit_open else (False if explicit_closed else None),
                                "is_busy_surge": is_busy_surge,
                            })
                            if len(pois) >= 20:
                                break
        except Exception as e:
            logger.debug(f"Direct Google Maps PB-Stream pivot ({query_str}): {e}")

        return pois

    async def _fetch_arcgis_and_photon_pois(
        self, lat: float, lon: float
    ) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], Dict[str, Any]]:
        shop_pois: List[Dict[str, Any]] = []
        cico_pois: List[Dict[str, Any]] = []
        loc_meta: Dict[str, Any] = {"lat": lat, "lon": lon}

        async with httpx.AsyncClient(timeout=12.0, headers=self.headers) as client:
            async def _run_batch():
                return await asyncio.gather(
                    client.get(
                        "https://nominatim.openstreetmap.org/reverse",
                        params={"format": "json", "lat": lat, "lon": lon, "zoom": 16, "accept-language": "en"},
                    ),
                    client.get(
                        "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates",
                        params={
                            "SingleLine": "",
                            "category": "Market,Shopping Center,Shop,Food Store",
                            "location": f"{lon},{lat}",
                            "distance": 850,
                            "maxLocations": 25,
                            "outFields": "PlaceName,Place_addr,Type,URL",
                            "f": "json",
                        },
                    ),
                    client.get(
                        "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates",
                        params={
                            "SingleLine": "",
                            "category": "Bank,ATM",
                            "location": f"{lon},{lat}",
                            "distance": 1000,
                            "maxLocations": 25,
                            "outFields": "PlaceName,Place_addr,Type,URL",
                            "f": "json",
                        },
                    ),
                    client.get(
                        "https://photon.komoot.io/api/",
                        params={"q": "market", "lat": lat, "lon": lon, "limit": 15},
                    ),
                    return_exceptions=True,
                )

            res_list = await _run_batch()

            r_nom = res_list[0]
            if isinstance(r_nom, httpx.Response) and r_nom.status_code == 200:
                nom_data = r_nom.json()
                addr = nom_data.get("address", {})
                city_str = (
                    addr.get("city")
                    or addr.get("town")
                    or addr.get("municipality")
                    or addr.get("county")
                    or addr.get("state")
                    or ""
                )
                suburb_str = addr.get("suburb") or addr.get("neighbourhood") or addr.get("quarter") or ""
                road_str = addr.get("road") or addr.get("pedestrian") or ""
                country_str = addr.get("country") or ""
                cc_str = (addr.get("country_code") or "").upper()
                label_parts = [p for p in (road_str, suburb_str, city_str, country_str) if p]
                loc_meta = {
                    "city": city_str,
                    "suburb": suburb_str,
                    "country": country_str,
                    "country_code": cc_str,
                    "label": ", ".join(dict.fromkeys(label_parts)) or nom_data.get("display_name", f"{lat:.4f},{lon:.4f}"),
                    "display_name": nom_data.get("display_name", ""),
                }

            # Fallback reverse geocode via LocationIQ if Nominatim timed out
            if not loc_meta.get("city"):
                liq_key = locationiq_pool.next_key()
                if liq_key:
                    try:
                        r_lrev = await client.get(
                            "https://us1.locationiq.com/v1/reverse",
                            params={"key": liq_key, "lat": lat, "lon": lon, "format": "json"},
                        )
                        if r_lrev.status_code == 200:
                            ld = r_lrev.json()
                            addr = ld.get("address", {})
                            city_str = addr.get("city") or addr.get("town") or addr.get("state") or ""
                            country_str = addr.get("country") or ""
                            cc_str = (addr.get("country_code") or "").upper()
                            loc_meta = {
                                "city": city_str,
                                "suburb": addr.get("suburb") or addr.get("neighbourhood") or "",
                                "country": country_str,
                                "country_code": cc_str,
                                "label": ld.get("display_name", f"{lat:.4f},{lon:.4f}"),
                                "display_name": ld.get("display_name", ""),
                            }
                    except Exception:
                        pass

            r_arc_shop = res_list[1]
            if isinstance(r_arc_shop, httpx.Response) and r_arc_shop.status_code == 200:
                for cand in r_arc_shop.json().get("candidates", []):
                    attrs = cand.get("attributes", {})
                    loc = cand.get("location", {})
                    p_name = str(attrs.get("PlaceName") or "").strip()
                    if self._is_valid_merchant_title(p_name) and "x" in loc and "y" in loc:
                        shop_pois.append({
                            "title": p_name,
                            "type": str(attrs.get("Type") or "shop").lower(),
                            "address": str(attrs.get("Place_addr") or ""),
                            "lat": float(loc["y"]),
                            "lon": float(loc["x"]),
                            "reviews": 0,
                        })

            r_arc_bank = res_list[2]
            if isinstance(r_arc_bank, httpx.Response) and r_arc_bank.status_code == 200:
                for cand in r_arc_bank.json().get("candidates", []):
                    attrs = cand.get("attributes", {})
                    loc = cand.get("location", {})
                    p_name = str(attrs.get("PlaceName") or "").strip()
                    if self._is_valid_merchant_title(p_name) and "x" in loc and "y" in loc:
                        cico_pois.append({
                            "title": p_name,
                            "type": "bank",
                            "url": str(attrs.get("URL") or "").strip(),
                            "lat": float(loc["y"]),
                            "lon": float(loc["x"]),
                        })

            r_phot = res_list[3]
            if isinstance(r_phot, httpx.Response) and r_phot.status_code == 200:
                for feat in r_phot.json().get("features", []):
                    props = feat.get("properties", {})
                    geom = feat.get("geometry", {})
                    coords = geom.get("coordinates", [])
                    p_name = str(props.get("name") or "").strip()
                    if len(coords) >= 2 and self._is_valid_merchant_title(p_name):
                        p_lon, p_lat = float(coords[0]), float(coords[1])
                        if _haversine_meters(lat, lon, p_lat, p_lon) <= 750.0:
                            shop_pois.append({
                                "title": p_name,
                                "type": str(props.get("osm_value") or "market").lower(),
                                "lat": p_lat,
                                "lon": p_lon,
                                "reviews": 0,
                            })

        return shop_pois, cico_pois, loc_meta

    @staticmethod
    def _cluster_spatial_sub_blocks(
        merchant_nodes: List[Dict[str, Any]], cluster_radius_m: float = 140.0
    ) -> List[Dict[str, Any]]:
        clusters: List[List[Dict[str, Any]]] = []
        for node in merchant_nodes:
            n_lat, n_lon = node.get("lat"), node.get("lon")
            if n_lat is None or n_lon is None:
                continue
            placed = False
            for cl in clusters:
                c_lat = sum(x["lat"] for x in cl) / len(cl)
                c_lon = sum(x["lon"] for x in cl) / len(cl)
                if _haversine_meters(c_lat, c_lon, n_lat, n_lon) <= cluster_radius_m:
                    cl.append(node)
                    placed = True
                    break
            if not placed:
                clusters.append([node])

        clusters.sort(key=len, reverse=True)
        sub_blocks: List[Dict[str, Any]] = []
        for idx, cl in enumerate(clusters[:6]):
            c_lat = round(sum(x["lat"] for x in cl) / len(cl), 6)
            c_lon = round(sum(x["lon"] for x in cl) / len(cl), 6)
            sample_names = [str(x.get("title") or "") for x in cl if x.get("title")][:4]
            sub_blocks.append({
                "sub_block_id": idx + 1,
                "centroid_lat": c_lat,
                "centroid_lon": c_lon,
                "verified_nodes_count": len(cl),
                "anchor_merchants": sample_names,
            })
        return sub_blocks

    @classmethod
    async def get_coalesced_spatial_snapshot(cls, lat: float, lon: float) -> Dict[str, Any]:
        key = f"{round(lat, 4)}:{round(lon, 4)}"
        now = time.time()
        if key in cls._cache and (now - cls._cache[key][0]) < 900:
            return cls._cache[key][1]

        lock = cls._locks.setdefault(key, asyncio.Lock())
        async with lock:
            if key in cls._cache and (time.time() - cls._cache[key][0]) < 900:
                return cls._cache[key][1]

            inst = cls()
            (
                overture_data,
                liq_data,
                overpass_data,
                (arc_shops, arc_cico, loc_meta),
                gmaps_shops,
                gmaps_banks,
                wiki_geo,
            ) = await asyncio.gather(
                inst._fetch_overture_geoparquet(lat, lon),
                inst._fetch_locationiq_nearby_pois(lat, lon),
                inst._fetch_coalesced_overpass(lat, lon),
                inst._fetch_arcgis_and_photon_pois(lat, lon),
                inst._fetch_google_maps_direct_pb(lat, lon, "market wholesale shop store", "shop"),
                inst._fetch_google_maps_direct_pb(lat, lon, "bank atm exchange", "bank"),
                inst._fetch_wikimedia_geosearch(lat, lon),
            )

            bldg_count = int(overture_data.get("osm_buildings_count", 0) or 0)
            levels_tagged = int(overture_data.get("osm_levels_tagged_count", 0) or 0)
            footprint_2d = float(overture_data.get("total_osm_footprint_sqm", 0.0) or 0.0)
            footprint_3d = float(overture_data.get("total_osm_3d_gross_floor_sqm", 0.0) or 0.0)
            polygons = list(overture_data.get("polygons", []))
            geometry_source = (
                f"OVERTURE_{overture_data.get('overture_release', 'PYARROW')}"
                if bldg_count > 0
                else "POI_ONLY_NO_POLYGON"
            )

            overture_places = list(overture_data.get("overture_places", []))
            liq_shops = list(liq_data.get("shops", []))
            liq_cico = list(liq_data.get("cico", []))
            all_gmaps = gmaps_shops + gmaps_banks
            all_cico_pois = liq_cico + arc_cico + gmaps_banks

            cico_domains = list(overpass_data.get("cico_domains", []))
            for c_item in arc_cico:
                if c_item.get("url") and c_item["url"] not in cico_domains:
                    cico_domains.append(c_item["url"])

            combined_merchants = (
                gmaps_shops
                + liq_shops
                + arc_shops
                + overture_places
                + overpass_data.get("osm_merchant_coords", [])
            )
            sub_blocks = inst._cluster_spatial_sub_blocks(combined_merchants, cluster_radius_m=140.0)

            venue_names = list(
                dict.fromkeys(
                    liq_data.get("venue_names", [])
                    + overpass_data.get("osm_venue_names", [])
                    + overture_data.get("overture_venue_names", [])
                )
            )[:35]

            total_merchants = (
                len(gmaps_shops)
                + len(liq_shops)
                + len(arc_shops)
                + len(overture_places)
                + int(overpass_data.get("osm_shops_count", 0))
            )
            total_cico = (
                len(gmaps_banks)
                + len(liq_cico)
                + len(arc_cico)
                + int(overpass_data.get("osm_cico_count", 0))
            )
            total_transit = int(overpass_data.get("osm_transit_hubs_count", 0)) + int(
                liq_data.get("transit_count", 0)
            )

            snapshot = {
                "lat": lat,
                "lon": lon,
                "location_meta": loc_meta,
                "geometry_source": geometry_source,
                "osm_buildings_count": bldg_count,
                "osm_levels_tagged_count": levels_tagged,
                "total_osm_footprint_sqm": footprint_2d,
                "total_osm_3d_gross_floor_sqm": footprint_3d,
                "polygons": polygons,
                "osm_shops_count": int(overpass_data.get("osm_shops_count", 0)) + len(liq_shops) + len(arc_shops) + len(overture_places),
                "osm_indoor_units_count": int(overpass_data.get("osm_indoor_units_count", 0)),
                "osm_cico_count": total_cico,
                "osm_surveillance_nodes_count": int(overpass_data.get("osm_surveillance_nodes_count", 0)),
                "osm_webcam_urls": overpass_data.get("osm_webcam_urls", []),
                "osm_transit_hubs_count": total_transit,
                "osm_pedestrian_crossings_count": int(overpass_data.get("osm_pedestrian_crossings_count", 0)),
                "osm_opening_hours_observed": overpass_data.get("osm_opening_hours_observed", []),
                "osm_venue_names": venue_names,
                "osm_merchant_coords": overpass_data.get("osm_merchant_coords", []) + liq_shops[:40] + overture_places[:40],
                "overture_places_count": len(overture_places),
                "locationiq_shops_count": len(liq_shops),
                "gmaps_pois": all_gmaps,
                "photon_pois": arc_shops + liq_shops,
                "cico_pois": all_cico_pois,
                "cico_domains": cico_domains,
                "spatial_sub_blocks": sub_blocks,
                "wikidata_geo_entities": wiki_geo,
                "verified_merchants_total": total_merchants,
                "data_integrity_audit": {
                    "synthetic_reviews_injected": False,
                    "synthetic_ratings_injected": False,
                    "geometry_source": geometry_source,
                    "levels_explicitly_observed": levels_tagged,
                    "sub_blocks_detected": len(sub_blocks),
                },
            }

            logger.info(
                f"🛰️ Coalesced Spatial Multiplexer Locked ({lat:.4f},{lon:.4f}) [{geometry_source}] | "
                f"3D Polygons: {bldg_count} (2D: {footprint_2d:,.1f} sqm | 3D Gross: {footprint_3d:,.1f} sqm | "
                f"Indoor Units: {snapshot['osm_indoor_units_count']}) | "
                f"Merchants: {len(all_gmaps)} GMaps + {len(liq_shops)} LocationIQ + {len(arc_shops)} ArcGIS/Photon + "
                f"{len(overture_places)} Overture + {overpass_data.get('osm_shops_count', 0)} OSM | "
                f"Transit: {total_transit} | Crossings: {snapshot['osm_pedestrian_crossings_count']} | "
                f"Cameras: {snapshot['osm_surveillance_nodes_count']} | Schedules: {len(snapshot['osm_opening_hours_observed'])} | "
                f"Sub-Blocks: {len(sub_blocks)}"
            )

            cls._cache[key] = (time.time(), snapshot)
            return snapshot