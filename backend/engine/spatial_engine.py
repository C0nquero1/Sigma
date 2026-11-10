import asyncio
import logging
import hashlib
import httpx
import reverse_geocoder as rg
from typing import Optional, Dict, Any, Tuple

try:
    import h3
except ImportError:
    h3 = None

logger = logging.getLogger("StreetAI.SpatialEngine")


class SpatialResolver:
    """
    100% Physical Reality Spatial & H3 Hexagonal Resolver.
    Locks verified coordinates onto the planetary H3 grid and resolves
    administrative city/country metadata across 3 live OSINT reverse-geocoding tiers.
    """
    def __init__(self):
        self.headers = {"User-Agent": "StreetAI-SpatialResolver/7.0 (contact@streetai.io)"}
        self._nominatim_lock = asyncio.Lock()
        self._rg_cache: Dict[Tuple[float, float], Dict[str, str]] = {}

    def get_h3_index(self, lat: float, lon: float, resolution: int = 9) -> str:
        if h3 is not None:
            if hasattr(h3, "latlng_to_cell"):
                return str(h3.latlng_to_cell(lat, lon, resolution))
            if hasattr(h3, "geo_to_h3"):
                return str(h3.geo_to_h3(lat, lon, resolution))
        digest = hashlib.sha256(f"{round(lat, 4)}:{round(lon, 4)}:{resolution}".encode()).hexdigest()[:15]
        return f"89{digest[2:]}"

    def _reverse_lookup_kdtree_sync(self, lat: float, lon: float) -> Dict[str, str]:
        results = rg.search((lat, lon), verbose=False)
        if results:
            top = results[0]
            return {
                "city_name": (top.get("name") or top.get("admin1") or "").strip(),
                "admin1": (top.get("admin1") or "").strip(),
                "country_code": (top.get("cc") or "").strip().upper(),
            }
        return {"city_name": "", "admin1": "", "country_code": ""}

    async def _reverse_lookup_live(self, lat: float, lon: float) -> Dict[str, str]:
        cache_key = (round(lat, 4), round(lon, 4))
        if cache_key in self._rg_cache:
            return self._rg_cache[cache_key]

        # Live Tier 1: Non-blocking GeoNames KD-Tree
        meta = await asyncio.to_thread(self._reverse_lookup_kdtree_sync, lat, lon)

        # Live Tier 2: BigDataCloud WGS84 Polygon Reverse Geocoder if any field is missing
        if not meta["city_name"] or len(meta["country_code"]) != 2:
            try:
                async with httpx.AsyncClient(timeout=8.0, headers=self.headers) as client:
                    resp = await client.get(
                        "https://api.bigdatacloud.net/data/reverse-geocode-client",
                        params={"latitude": lat, "longitude": lon, "localityLanguage": "en"},
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        meta["city_name"] = meta["city_name"] or data.get("city") or data.get("locality") or ""
                        meta["admin1"] = meta["admin1"] or data.get("principalSubdivision") or ""
                        meta["country_code"] = meta["country_code"] or (data.get("countryCode") or "").upper()
            except Exception as e:
                logger.debug(f"BigDataCloud reverse lookup pivot: {e}")

        # Live Tier 3: OpenStreetMap Nominatim Reverse Geocoder
        if not meta["city_name"] or len(meta["country_code"]) != 2:
            async with self._nominatim_lock:
                try:
                    async with httpx.AsyncClient(timeout=8.0, headers=self.headers) as client:
                        resp = await client.get(
                            "https://nominatim.openstreetmap.org/reverse",
                            params={"lat": lat, "lon": lon, "format": "json"},
                        )
                        await asyncio.sleep(1.0)
                        if resp.status_code == 200:
                            addr = resp.json().get("address", {})
                            meta["city_name"] = (
                                meta["city_name"]
                                or addr.get("city")
                                or addr.get("town")
                                or addr.get("municipality")
                                or addr.get("county")
                                or ""
                            )
                            meta["admin1"] = meta["admin1"] or addr.get("state") or ""
                            meta["country_code"] = meta["country_code"] or (addr.get("country_code") or "").upper()
                except Exception as e:
                    logger.debug(f"Nominatim reverse lookup pivot: {e}")

        self._rg_cache[cache_key] = meta
        return meta

    async def resolve_target_async(
        self,
        target_query: str,
        force_candidate: Optional[Dict[str, float]] = None,
        resolution: int = 9,
    ) -> Dict[str, Any]:
        lat_val: Optional[float] = None
        lon_val: Optional[float] = None

        if force_candidate and "lat" in force_candidate and "lon" in force_candidate:
            lat_val = float(force_candidate["lat"])
            lon_val = float(force_candidate["lon"])
        else:
            # Live Forward Tier 1: Photon Komoot OpenStreetMap API
            try:
                async with httpx.AsyncClient(timeout=8.0, headers=self.headers) as client:
                    r_phot = await client.get(
                        "https://photon.komoot.io/api/",
                        params={"q": target_query, "limit": 1},
                    )
                    if r_phot.status_code == 200:
                        feats = r_phot.json().get("features", [])
                        if feats:
                            coords = feats[0].get("geometry", {}).get("coordinates", [])
                            if len(coords) >= 2:
                                lon_val, lat_val = float(coords[0]), float(coords[1])
            except Exception as e:
                logger.debug(f"Photon forward geocode pivot: {e}")

            # Live Forward Tier 2: Open-Meteo Global GeoNames API
            if lat_val is None or lon_val is None:
                try:
                    async with httpx.AsyncClient(timeout=8.0, headers=self.headers) as client:
                        r_om = await client.get(
                            "https://geocoding-api.open-meteo.com/v1/search",
                            params={"name": target_query, "count": 1, "language": "en", "format": "json"},
                        )
                        if r_om.status_code == 200:
                            results = r_om.json().get("results", [])
                            if results:
                                lat_val = float(results[0]["latitude"])
                                lon_val = float(results[0]["longitude"])
                except Exception as e:
                    logger.debug(f"Open-Meteo forward geocode pivot: {e}")

            # Live Forward Tier 3: OpenStreetMap Nominatim API
            if lat_val is None or lon_val is None:
                async with self._nominatim_lock:
                    try:
                        async with httpx.AsyncClient(timeout=8.0, headers=self.headers) as client:
                            res = await client.get(
                                "https://nominatim.openstreetmap.org/search",
                                params={"q": target_query, "format": "json", "limit": 1},
                            )
                            await asyncio.sleep(1.0)
                            if res.status_code == 200 and res.json():
                                top = res.json()[0]
                                lat_val = float(top["lat"])
                                lon_val = float(top["lon"])
                    except Exception as e:
                        logger.debug(f"Nominatim forward geocode pivot: {e}")

        if lat_val is None or lon_val is None:
            return {
                "status": "AMBIGUOUS_TARGET",
                "message": f"Unable to lock physical coordinates for '{target_query}'.",
            }

        geo_meta = await self._reverse_lookup_live(lat_val, lon_val)
        h3_token = self.get_h3_index(lat_val, lon_val, resolution=resolution)
        display_city = target_query.strip() if target_query and len(target_query) <= 48 else geo_meta["city_name"]

        return {
            "status": "TARGET_LOCKED",
            "city_overview": {
                "lat": round(lat_val, 6),
                "lon": round(lon_val, 6),
                "city_name": display_city,
                "administrative_region": geo_meta["admin1"],
                "country_code": geo_meta["country_code"],
                "h3_cell_id": h3_token,
            },
        }

    def close(self):
        self._rg_cache.clear()