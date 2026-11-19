import os
import json
import math
import asyncio
import logging
from typing import Optional, Dict, Any, List, Tuple
import httpx
from pydantic import BaseModel, ConfigDict
from engine.llm_router import llm_router

logger = logging.getLogger("StreetAI.QueryCompiler")

NOMINATIM_LOCK = asyncio.Lock()
CITY_ANCHOR_CACHE: Dict[str, Tuple[float, float]] = {}
LOCATION_CACHE: Dict[str, Tuple[float, float, Optional[str]]] = {}

HEADERS = {
    "User-Agent": "StreetAI-QueryCompiler/9.4 (https://streetai.io; contact@streetai.io)",
    "Accept-Language": "en-US,en;q=0.9",
}


class SpatialDirective(BaseModel):
    model_config = ConfigDict(extra="allow")
    raw_location_query: str = ""
    inferred_subdistrict: Optional[str] = None
    inferred_city: Optional[str] = None
    country_hint_iso2: Optional[str] = None
    verified_lat: Optional[float] = None
    verified_lon: Optional[float] = None
    h3_resolution: int = 9
    search_radius_km: float = 1.5


class EconomicDirective(BaseModel):
    model_config = ConfigDict(extra="allow")
    primary_commodity: str = "general_merchandise"
    intent_type: str = "cashflow_location"
    target_sector: str = "general_commerce"


class ExecutionPlan(BaseModel):
    model_config = ConfigDict(extra="allow")
    raw_prompt: str = ""
    requires_disambiguation: bool = False
    spatial: SpatialDirective = SpatialDirective()
    economic: EconomicDirective = EconomicDirective()


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2.0) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2.0) ** 2
    return 2.0 * r * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))


async def _resolve_city_anchor(
    city_name: Optional[str], country_iso2: Optional[str]
) -> Optional[Tuple[float, float]]:
    if not city_name:
        return None
    key = f"city_anchor_v1:{city_name.strip().lower()}_{(country_iso2 or '').strip().lower()}"
    if key in CITY_ANCHOR_CACHE:
        return CITY_ANCHOR_CACHE[key]

    persisted = llm_router.get_cached(key)
    if isinstance(persisted, list) and len(persisted) == 2:
        anchor = (float(persisted[0]), float(persisted[1]))
        CITY_ANCHOR_CACHE[key] = anchor
        return anchor

    # Tier 1: Open-Meteo Global GeoNames City Anchor
    try:
        async with httpx.AsyncClient(timeout=6.0, headers=HEADERS) as client:
            r_om = await client.get(
                "https://geocoding-api.open-meteo.com/v1/search",
                params={"name": city_name, "count": 5, "language": "en", "format": "json"},
            )
            if r_om.status_code == 200:
                for item in r_om.json().get("results", []):
                    cc_item = (item.get("country_code") or "").upper()
                    if country_iso2 and len(country_iso2) == 2 and cc_item and cc_item != country_iso2.upper():
                        continue
                    anchor = (float(item["latitude"]), float(item["longitude"]))
                    CITY_ANCHOR_CACHE[key] = anchor
                    llm_router.set_cached(key, list(anchor), ttl_seconds=2592000)
                    return anchor
    except Exception:
        pass

    # Tier 2: Photon Komoot OSM
    try:
        q_str = f"{city_name}, {country_iso2}" if country_iso2 else city_name
        async with httpx.AsyncClient(timeout=6.0, headers=HEADERS) as client:
            r = await client.get("https://photon.komoot.io/api/", params={"q": q_str, "limit": 1})
            if r.status_code == 200:
                feats = r.json().get("features", [])
                if feats:
                    coords = feats[0].get("geometry", {}).get("coordinates", [])
                    if len(coords) >= 2:
                        anchor = (float(coords[1]), float(coords[0]))
                        CITY_ANCHOR_CACHE[key] = anchor
                        llm_router.set_cached(key, list(anchor), ttl_seconds=2592000)
                        return anchor
    except Exception:
        pass

    # Tier 3: Nominatim OSM
    async with NOMINATIM_LOCK:
        try:
            params: Dict[str, Any] = {"q": city_name, "format": "json", "addressdetails": 1, "limit": 1}
            if country_iso2 and len(country_iso2) == 2:
                params["countrycodes"] = country_iso2.lower()
            async with httpx.AsyncClient(timeout=6.5, headers=HEADERS) as client:
                r = await client.get("https://nominatim.openstreetmap.org/search", params=params)
                await asyncio.sleep(1.0)
                if r.status_code == 200 and r.json():
                    top = r.json()[0]
                    anchor = (float(top["lat"]), float(top["lon"]))
                    CITY_ANCHOR_CACHE[key] = anchor
                    llm_router.set_cached(key, list(anchor), ttl_seconds=2592000)
                    return anchor
        except Exception:
            pass
    return None


async def _pre_verify_physical_location(
    target_query: str,
    city_hint: Optional[str] = None,
    country_iso2: Optional[str] = None,
) -> Optional[Tuple[float, float, Optional[str]]]:
    """
    100% Zero-SerpAPI 4-Tier Live Physical Geocoder (30-day SQLite cached):
      Tier 1: Photon Komoot OSM
      Tier 2: Esri ArcGIS World GeocodeServer (immune to Photon 503 bursts)
      Tier 3: Open-Meteo Global GeoNames
      Tier 4: OpenStreetMap Nominatim
    """
    clean_q = (target_query or "").strip()
    if not clean_q:
        return None

    cache_key = f"geo_v2:{clean_q.lower()}_{(city_hint or '').lower()}_{(country_iso2 or '').lower()}"
    if cache_key in LOCATION_CACHE:
        return LOCATION_CACHE[cache_key]

    persisted = llm_router.get_cached(cache_key)
    if isinstance(persisted, list) and len(persisted) == 3:
        res_tuple = (float(persisted[0]), float(persisted[1]), persisted[2])
        LOCATION_CACHE[cache_key] = res_tuple
        return res_tuple

    city_anchor = await _resolve_city_anchor(city_hint or clean_q, country_iso2)

    def _within_city(lat_c: float, lon_c: float) -> bool:
        if not city_anchor:
            return True
        return _haversine_km(city_anchor[0], city_anchor[1], lat_c, lon_c) <= 65.0

    full_q = clean_q
    if city_hint and city_hint.lower() not in clean_q.lower():
        full_q = f"{clean_q}, {city_hint}"
    full_q_cc = f"{full_q}, {country_iso2.upper()}" if (country_iso2 and len(country_iso2) == 2) else full_q

    async with httpx.AsyncClient(timeout=6.5, headers=HEADERS) as client:
        # ------------------------------------------------------------------
        # TIER 1: Photon Komoot OpenStreetMap API
        # ------------------------------------------------------------------
        for variant in [full_q, clean_q, city_hint]:
            if not variant:
                continue
            try:
                r = await client.get("https://photon.komoot.io/api/", params={"q": variant, "limit": 5})
                if r.status_code == 200:
                    for feat in r.json().get("features", []):
                        coords = feat.get("geometry", {}).get("coordinates", [])
                        props = feat.get("properties", {})
                        if len(coords) >= 2:
                            lon_f, lat_f = float(coords[0]), float(coords[1])
                            cc_feat = (props.get("countrycode") or country_iso2 or "").upper() or None
                            if country_iso2 and len(country_iso2) == 2 and cc_feat and cc_feat != country_iso2.upper():
                                continue
                            if _within_city(lat_f, lon_f):
                                res_tuple = (round(lat_f, 6), round(lon_f, 6), cc_feat)
                                LOCATION_CACHE[cache_key] = res_tuple
                                llm_router.set_cached(cache_key, list(res_tuple), ttl_seconds=2592000)
                                logger.info(
                                    f"📍 Physical Reality Locked: '{clean_q}' -> ({lat_f:.4f}, {lon_f:.4f}) via Photon OSM"
                                )
                                return res_tuple
            except Exception as e:
                logger.debug(f"Photon geocode pivot ({variant}): {e}")

        # ------------------------------------------------------------------
        # TIER 2: Esri ArcGIS World GeocodeServer (Fixed UnboundLocalError!)
        # ------------------------------------------------------------------
        for variant in [full_q_cc, full_q, clean_q]:
            if not variant:
                continue
            try:
                arc_params: Dict[str, Any] = {
                    "SingleLine": variant,
                    "maxLocations": 5,
                    "outFields": "Country",
                    "f": "json",
                }
                if city_anchor:
                    arc_params["location"] = f"{city_anchor[1]},{city_anchor[0]}"
                r_arc = await client.get(
                    "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates",
                    params=arc_params,
                )
                if r_arc.status_code == 200:
                    for cand in r_arc.json().get("candidates", []):
                        loc = cand.get("location", {})
                        c_lat, c_lon = loc.get("y"), loc.get("x")
                        if c_lat is not None and c_lon is not None:
                            lat_f, lon_f = float(c_lat), float(c_lon)
                            if _within_city(lat_f, lon_f):
                                res_tuple = (round(lat_f, 6), round(lon_f, 6), country_iso2)
                                LOCATION_CACHE[cache_key] = res_tuple
                                llm_router.set_cached(cache_key, list(res_tuple), ttl_seconds=2592000)
                                logger.info(
                                    f"📍 Physical Reality Locked: '{clean_q}' -> ({lat_f:.4f}, {lon_f:.4f}) via Esri ArcGIS"
                                )
                                return res_tuple
            except Exception as e:
                logger.debug(f"ArcGIS geocode pivot ({variant}): {e}")

        # ------------------------------------------------------------------
        # TIER 3: Open-Meteo Global GeoNames Spatial Database
        # ------------------------------------------------------------------
        for variant in [clean_q, city_hint]:
            if not variant:
                continue
            try:
                r_om = await client.get(
                    "https://geocoding-api.open-meteo.com/v1/search",
                    params={"name": variant, "count": 5, "language": "en", "format": "json"},
                )
                if r_om.status_code == 200:
                    for item in r_om.json().get("results", []):
                        lat_f, lon_f = float(item["latitude"]), float(item["longitude"])
                        cc_item = (item.get("country_code") or country_iso2 or "").upper() or None
                        if country_iso2 and len(country_iso2) == 2 and cc_item and cc_item != country_iso2.upper():
                            continue
                        if _within_city(lat_f, lon_f):
                            res_tuple = (round(lat_f, 6), round(lon_f, 6), cc_item)
                            LOCATION_CACHE[cache_key] = res_tuple
                            llm_router.set_cached(cache_key, list(res_tuple), ttl_seconds=2592000)
                            logger.info(
                                f"📍 Physical Reality Locked: '{clean_q}' -> ({lat_f:.4f}, {lon_f:.4f}) via GeoNames OSINT"
                            )
                            return res_tuple
            except Exception:
                pass

    # ------------------------------------------------------------------
    # TIER 4: OpenStreetMap Nominatim API
    # ------------------------------------------------------------------
    async with NOMINATIM_LOCK:
        async with httpx.AsyncClient(timeout=7.0, headers=HEADERS) as client:
            for variant in [full_q, clean_q, city_hint]:
                if not variant:
                    continue
                try:
                    params: Dict[str, Any] = {"q": variant, "format": "json", "addressdetails": 1, "limit": 3}
                    if country_iso2 and len(country_iso2) == 2:
                        params["countrycodes"] = country_iso2.lower()
                    r = await client.get("https://nominatim.openstreetmap.org/search", params=params)
                    await asyncio.sleep(1.0)
                    if r.status_code == 200 and isinstance(r.json(), list):
                        for item in r.json():
                            lat_f, lon_f = float(item["lat"]), float(item["lon"])
                            cc_item = (item.get("address", {}).get("country_code") or country_iso2 or "").upper() or None
                            if _within_city(lat_f, lon_f):
                                res_tuple = (round(lat_f, 6), round(lon_f, 6), cc_item)
                                LOCATION_CACHE[cache_key] = res_tuple
                                llm_router.set_cached(cache_key, list(res_tuple), ttl_seconds=2592000)
                                logger.info(
                                    f"📍 Physical Reality Locked: '{clean_q}' -> ({lat_f:.4f}, {lon_f:.4f}) via Nominatim OSM"
                                )
                                return res_tuple
                except Exception:
                    pass

    logger.warning(f"📍 Physical Pre-Verification FAILED: '{clean_q}' could not be resolved across live OSINT tiers.")
    return None


async def compile_user_prompt(
    raw_prompt: str, groq_client: Any = None, active_model: str = "llama-3.3-70b-versatile"
) -> ExecutionPlan:
    """
    Compiles a user prompt into a physically verified ExecutionPlan via `llm_router`
    (cached 24h in SQLite, multi-provider free failover) + 4-tier zero-SerpAPI OSINT geocoding.
    """
    prompt = (
        "Extract the physical target location and economic commodity from the user prompt below.\n"
        f"User Prompt: {raw_prompt}\n\n"
        "Return strictly valid JSON with these exact keys:\n"
        "{\n"
        '  "raw_location_query": "Full market or street location string",\n'
        '  "inferred_subdistrict": "Specific market, neighborhood, or street name",\n'
        '  "inferred_city": "City name",\n'
        '  "country_hint_iso2": "2-letter ISO country code (e.g. TR, NG, AE, IT, IN, KE, EG, ID, ET, PE)",\n'
        '  "primary_commodity": "Specific product requested, or general_merchandise if broad market scan",\n'
        '  "intent_type": "cashflow_location or commodity_pricing"\n'
        "}"
    )

    parsed = await llm_router.complete_json(prompt, max_tokens=260, cache_ttl_seconds=86400)
    if not parsed or not (
        parsed.get("inferred_subdistrict")
        or parsed.get("raw_location_query")
        or parsed.get("inferred_city")
    ):
        raise RuntimeError(f"CRITICAL: All live LLM providers failed to parse prompt: '{raw_prompt}'")

    subdistrict = str(parsed.get("inferred_subdistrict") or parsed.get("raw_location_query") or raw_prompt).strip()
    city = str(parsed.get("inferred_city") or subdistrict).strip()
    cc_iso2 = str(parsed.get("country_hint_iso2") or "").strip().upper() or None
    if cc_iso2 and len(cc_iso2) != 2:
        cc_iso2 = None

    raw_comm = str(parsed.get("primary_commodity") or "general_merchandise").strip()
    if raw_comm.lower() in ("all", "all_sectors", "everything", "none", "null", "market", "cashflow", ""):
        raw_comm = "general_merchandise"

    verified = await _pre_verify_physical_location(subdistrict, city_hint=city, country_iso2=cc_iso2)

    lat_v: Optional[float] = None
    lon_v: Optional[float] = None
    if verified:
        lat_v, lon_v, detected_cc = verified
        if detected_cc and len(detected_cc) == 2:
            cc_iso2 = detected_cc.upper()

    return ExecutionPlan(
        raw_prompt=raw_prompt,
        requires_disambiguation=(lat_v is None or lon_v is None),
        spatial=SpatialDirective(
            raw_location_query=subdistrict,
            inferred_subdistrict=subdistrict,
            inferred_city=city,
            country_hint_iso2=cc_iso2,
            verified_lat=lat_v,
            verified_lon=lon_v,
        ),
        economic=EconomicDirective(
            primary_commodity=raw_comm,
            intent_type=str(parsed.get("intent_type") or "cashflow_location"),
        ),
    )