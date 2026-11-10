import os
import json
import math
import asyncio
import logging
from typing import Optional, Dict, Any, List, Tuple
import httpx
from pydantic import BaseModel, ConfigDict

logger = logging.getLogger("StreetAI.QueryCompiler")

SERPAPI_KEY = os.getenv("SERPAPI_API_KEY", "").strip()
NOMINATIM_LOCK = asyncio.Lock()
GROQ_SEMAPHORE = asyncio.Semaphore(3)
CITY_ANCHOR_CACHE: Dict[str, Tuple[float, float]] = {}
LOCATION_CACHE: Dict[str, Tuple[float, float, Optional[str]]] = {}

HEADERS = {
    "User-Agent": "StreetAI-QueryCompiler/7.0 (contact@streetai.io)",
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
    key = f"{city_name.strip().lower()}_{(country_iso2 or '').strip().lower()}"
    if key in CITY_ANCHOR_CACHE:
        return CITY_ANCHOR_CACHE[key]

    # Live Tier 1: Open-Meteo Global GeoNames City Anchor
    try:
        async with httpx.AsyncClient(timeout=8.0, headers=HEADERS) as client:
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
                    return anchor
    except Exception:
        pass

    # Live Tier 2: Photon Komoot OSM
    try:
        q_str = f"{city_name}, {country_iso2}" if country_iso2 else city_name
        async with httpx.AsyncClient(timeout=8.0, headers=HEADERS) as client:
            r = await client.get("https://photon.komoot.io/api/", params={"q": q_str, "limit": 1})
            if r.status_code == 200:
                feats = r.json().get("features", [])
                if feats:
                    coords = feats[0].get("geometry", {}).get("coordinates", [])
                    if len(coords) >= 2:
                        anchor = (float(coords[1]), float(coords[0]))
                        CITY_ANCHOR_CACHE[key] = anchor
                        return anchor
    except Exception:
        pass

    # Live Tier 3: Nominatim OSM
    async with NOMINATIM_LOCK:
        try:
            params: Dict[str, Any] = {"q": city_name, "format": "json", "addressdetails": 1, "limit": 1}
            if country_iso2 and len(country_iso2) == 2:
                params["countrycodes"] = country_iso2.lower()
            async with httpx.AsyncClient(timeout=8.0, headers=HEADERS) as client:
                r = await client.get("https://nominatim.openstreetmap.org/search", params=params)
                await asyncio.sleep(1.0)
                if r.status_code == 200 and r.json():
                    top = r.json()[0]
                    anchor = (float(top["lat"]), float(top["lon"]))
                    CITY_ANCHOR_CACHE[key] = anchor
                    return anchor
        except Exception:
            pass
    return None


async def _pre_verify_physical_location(
    target_query: str,
    city_hint: Optional[str] = None,
    country_iso2: Optional[str] = None,
) -> Optional[Tuple[float, float, Optional[str]]]:
    clean_q = (target_query or "").strip()
    if not clean_q:
        return None

    cache_key = f"{clean_q.lower()}_{(city_hint or '').lower()}_{(country_iso2 or '').lower()}"
    if cache_key in LOCATION_CACHE:
        return LOCATION_CACHE[cache_key]

    city_anchor = await _resolve_city_anchor(city_hint or clean_q, country_iso2)

    def _within_city(lat_c: float, lon_c: float) -> bool:
        if not city_anchor:
            return True
        return _haversine_km(city_anchor[0], city_anchor[1], lat_c, lon_c) <= 65.0

    full_q = clean_q
    if city_hint and city_hint.lower() not in clean_q.lower():
        full_q = f"{clean_q}, {city_hint}"
    full_q_cc = f"{full_q}, {country_iso2.upper()}" if (country_iso2 and len(country_iso2) == 2) else full_q

    # ------------------------------------------------------------------
    # LIVE TIER 0: SerpAPI Google Maps (place_results + local_results)
    # ------------------------------------------------------------------
    if SERPAPI_KEY:
        try:
            async with httpx.AsyncClient(timeout=12.0) as client:
                r = await client.get(
                    "https://serpapi.com/search",
                    params={
                        "engine": "google_maps",
                        "type": "search",
                        "q": full_q_cc,
                        "api_key": SERPAPI_KEY,
                    },
                )
                if r.status_code == 200:
                    data = r.json()
                    candidates: List[Dict[str, Any]] = []
                    if isinstance(data.get("place_results"), dict):
                        candidates.append(data["place_results"])
                    if isinstance(data.get("local_results"), list):
                        candidates.extend(data["local_results"])

                    for item in candidates:
                        gps = item.get("gps_coordinates") or {}
                        lat_v, lon_v = gps.get("latitude"), gps.get("longitude")
                        if lat_v is not None and lon_v is not None:
                            lat_f, lon_f = float(lat_v), float(lon_v)
                            if _within_city(lat_f, lon_f):
                                res_tuple = (lat_f, lon_f, country_iso2)
                                LOCATION_CACHE[cache_key] = res_tuple
                                logger.info(
                                    f"📍 Physical Reality Locked: '{clean_q}' -> ({lat_f:.4f}, {lon_f:.4f}) via Google Maps OSINT"
                                )
                                return res_tuple
        except Exception as e:
            logger.debug(f"SerpAPI Tier-0 pivot for '{clean_q}': {e}")

    # ------------------------------------------------------------------
    # LIVE TIER 1: Photon Komoot OpenStreetMap API
    # ------------------------------------------------------------------
    for variant in [full_q, clean_q, city_hint]:
        if not variant:
            continue
        try:
            async with httpx.AsyncClient(timeout=8.0, headers=HEADERS) as client:
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
                                res_tuple = (lat_f, lon_f, cc_feat)
                                LOCATION_CACHE[cache_key] = res_tuple
                                logger.info(
                                    f"📍 Physical Reality Locked: '{clean_q}' -> ({lat_f:.4f}, {lon_f:.4f}) via Photon OSM"
                                )
                                return res_tuple
        except Exception:
            pass

    # ------------------------------------------------------------------
    # LIVE TIER 2: Open-Meteo Global GeoNames Spatial Database
    # ------------------------------------------------------------------
    for variant in [clean_q, city_hint]:
        if not variant:
            continue
        try:
            async with httpx.AsyncClient(timeout=8.0, headers=HEADERS) as client:
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
                            res_tuple = (lat_f, lon_f, cc_item)
                            LOCATION_CACHE[cache_key] = res_tuple
                            logger.info(
                                f"📍 Physical Reality Locked: '{clean_q}' -> ({lat_f:.4f}, {lon_f:.4f}) via GeoNames OSINT"
                            )
                            return res_tuple
        except Exception:
            pass

    # ------------------------------------------------------------------
    # LIVE TIER 3: OpenStreetMap Nominatim API
    # ------------------------------------------------------------------
    async with NOMINATIM_LOCK:
        for variant in [full_q, clean_q, city_hint]:
            if not variant:
                continue
            try:
                params: Dict[str, Any] = {"q": variant, "format": "json", "addressdetails": 1, "limit": 3}
                if country_iso2 and len(country_iso2) == 2:
                    params["countrycodes"] = country_iso2.lower()
                async with httpx.AsyncClient(timeout=8.0, headers=HEADERS) as client:
                    r = await client.get("https://nominatim.openstreetmap.org/search", params=params)
                    await asyncio.sleep(1.0)
                    if r.status_code == 200 and isinstance(r.json(), list):
                        for item in r.json():
                            lat_f, lon_f = float(item["lat"]), float(item["lon"])
                            cc_item = (item.get("address", {}).get("country_code") or country_iso2 or "").upper() or None
                            if _within_city(lat_f, lon_f):
                                res_tuple = (lat_f, lon_f, cc_item)
                                LOCATION_CACHE[cache_key] = res_tuple
                                logger.info(
                                    f"📍 Physical Reality Locked: '{clean_q}' -> ({lat_f:.4f}, {lon_f:.4f}) via Nominatim OSM"
                                )
                                return res_tuple
            except Exception:
                pass

    logger.warning(f"📍 Physical Pre-Verification FAILED: '{clean_q}' could not be resolved across live OSINT tiers.")
    return None


def _sync_groq_call(client: Any, model_name: str, system_msg: str, user_msg: str) -> str:
    resp = client.chat.completions.create(
        model=model_name,
        messages=[
            {"role": "system", "content": system_msg},
            {"role": "user", "content": user_msg},
        ],
        temperature=0.0,
        response_format={"type": "json_object"},
    )
    return resp.choices[0].message.content or "{}"


async def compile_user_prompt(
    raw_prompt: str, groq_client: Any, active_model: str = "qwen/qwen3.8-27b"
) -> ExecutionPlan:
    """
    Compiles a user prompt into a physically verified ExecutionPlan via live Groq
    models and 4-tier live OSINT coordinate verification.
    """
    if groq_client is None:
        raise RuntimeError("CRITICAL: Groq client is uninitialized.")

    system_prompt = (
        "Extract the physical target location and economic commodity from the user prompt. "
        "Return strictly valid JSON with these keys:\n"
        "{\n"
        '  "raw_location_query": "Full market or street location string",\n'
        '  "inferred_subdistrict": "Specific market, neighborhood, or street name",\n'
        '  "inferred_city": "City name",\n'
        '  "country_hint_iso2": "2-letter ISO country code (e.g. MX, JP, TH, VN, KR, LK, MA, CN, BR, GB, NG)",\n'
        '  "primary_commodity": "Specific product requested, or general_merchandise if broad market scan",\n'
        '  "intent_type": "cashflow_location or commodity_pricing"\n'
        "}"
    )

    model_chain: List[str] = []
    for m in [active_model, "llama-3.3-70b-versatile", "openai/gpt-oss-120b", "llama-3.1-8b-instant"]:
        if m and m not in model_chain:
            model_chain.append(m)

    parsed: Dict[str, Any] = {}
    async with GROQ_SEMAPHORE:
        for model_id in model_chain:
            try:
                raw_json = await asyncio.to_thread(
                    _sync_groq_call, groq_client, model_id, system_prompt, raw_prompt
                )
                parsed = json.loads(raw_json)
                if isinstance(parsed, dict) and (
                    parsed.get("inferred_subdistrict")
                    or parsed.get("raw_location_query")
                    or parsed.get("inferred_city")
                ):
                    break
            except Exception as e:
                logger.warning(f"Compiler pivoted from '{model_id}': {e}")

    if not parsed:
        raise RuntimeError(f"CRITICAL: All live Groq models failed to parse prompt: '{raw_prompt}'")

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