import os
import re
import math
import html
import json
import httpx
import logging
import asyncio
from typing import Dict, Any, List, Optional
from groq import Groq
from engine.overture_engine import LiveInfrastructureEngine

logger = logging.getLogger("StreetAI.ProductResolver")


def _load_groq_clients() -> List[Groq]:
    raw_keys: List[str] = []
    multi = os.getenv("GROQ_API_KEYS", "")
    if multi:
        raw_keys.extend([k.strip() for k in multi.split(",") if k.strip()])
    primary = os.getenv("GROQ_API_KEY", "").strip()
    if primary and primary not in raw_keys:
        raw_keys.append(primary)
    for i in range(2, 10):
        k_i = os.getenv(f"GROQ_API_KEY_{i}", "").strip()
        if k_i and k_i not in raw_keys:
            raw_keys.append(k_i)
    return [Groq(api_key=k, max_retries=0, timeout=10.0) for k in raw_keys]


class SpatialProductResolver:
    """
    100% Universal Multi-Sector Ecosystem & Native SKU Resolver (Zero Hardcoded Test-Market Hints).
    - Uses Batch 1 `wikidata_geo_entities`, observed OSM/Google Maps merchant names, and live open-web
      reconnaissance to discover the true physical goods traded at ANY coordinate on Earth.
    - Generates both concise English ('search_item') and native local language ('search_item_native')
      queries so Batch 1 `pricing_scraper.py` matches real local merchant listings.
    """
    _key_idx: int = 0

    def __init__(self):
        self.groq_clients = _load_groq_clients()
        self.browser_headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9",
        }

    async def _fetch_live_market_specialty_context(self, target_label: str) -> str:
        clean_q = re.sub(r"^-?\d+\.\d+,-?\d+\.\d+$", "", target_label).strip()
        if not clean_q:
            return ""
        q = f"{clean_q} market famous for selling main products goods shops"
        try:
            async with httpx.AsyncClient(timeout=4.0, follow_redirects=True, headers=self.browser_headers) as client:
                res = await client.get("https://www.bing.com/search", params={"q": q, "format": "rss", "count": "10"})
                if res.status_code == 200 and res.text:
                    items = re.findall(r"<item>.*?</item>", res.text, flags=re.DOTALL)[:8]
                    no_tags = re.sub(r"<[^>]+>", " ", " ".join(items))
                    return html.unescape(re.sub(r"\s+", " ", no_tags)).strip()[:2200]
        except Exception:
            pass
        return ""

    async def resolve_market_ground_truth(
        self,
        lat: float,
        lon: float,
        requested_commodity: str = "general_merchandise",
        spatial_snapshot: Optional[Dict[str, Any]] = None,
        local_currency: str = "USD",
        fx_rate_per_usd: float = 1.0,
        target_name: str = "",
    ) -> Dict[str, Any]:
        if not spatial_snapshot:
            spatial_snapshot = await LiveInfrastructureEngine.get_coalesced_spatial_snapshot(lat, lon)

        loc_meta = spatial_snapshot.get("location_meta", {})
        loc_label = loc_meta.get("label") or loc_meta.get("display_name") or f"{lat:.4f},{lon:.4f}"
        country_code = str(loc_meta.get("country_code") or "US").upper()
        pois = spatial_snapshot.get("gmaps_pois", [])
        osm_names = spatial_snapshot.get("osm_venue_names", [])
        wiki_geo = spatial_snapshot.get("wikidata_geo_entities", [])

        effective_target = target_name
        if (not effective_target or re.match(r"^-?\d+\.\d+", effective_target.strip())) and wiki_geo:
            effective_target = wiki_geo[0]["title"]

        hub_search_name = f"{effective_target}, {loc_label}".strip(", ") if effective_target else loc_label
        market_specialty_context = await self._fetch_live_market_specialty_context(hub_search_name)

        type_gravity: Dict[str, float] = {}
        poi_evidence: List[str] = []
        for p in pois:
            title = str(p.get("title") or "").strip()
            p_type = str(p.get("type") or "merchant").strip()
            reviews = int(p.get("reviews") or 0)
            gravity = 1.0 + (math.log1p(reviews) if reviews > 0 else 0.0)
            type_gravity[p_type] = round(type_gravity.get(p_type, 0.0) + gravity, 2)
            if title:
                rev_tag = f", {reviews} reviews" if reviews > 0 else ""
                poi_evidence.append(f"{title} [{p_type}{rev_tag}]")

        for name in osm_names[:15]:
            if name not in poi_evidence:
                poi_evidence.append(f"{name} [OSM Verified Node]")

        for wg in wiki_geo[:4]:
            wg_title = str(wg.get("title") or "").strip()
            if wg_title:
                poi_evidence.append(f"{wg_title} [Wikimedia Landmark {wg.get('dist_m')}m]")

        clean_req = (requested_commodity or "general_merchandise").replace("_", " ").strip()
        is_ecosystem = clean_req.lower() in (
            "general merchandise", "general", "all", "all sectors", "everything", "market", "cashflow"
        )

        sorted_empirical_types = sorted(type_gravity.items(), key=lambda x: x[1], reverse=True)
        curr_str = (local_currency or "USD").upper()
        fx_str = f"1 USD = {fx_rate_per_usd:,.2f} {curr_str}"

        if not is_ecosystem:
            prompt = (
                f"Target Market: {hub_search_name} ({lat}, {lon}) | Country: {country_code} | Currency: {curr_str} ({fx_str})\n"
                f"Live Web Reconnaissance on Market Specialty: {market_specialty_context[:1500]}\n"
                f"Verified Ground Merchants & Landmarks: {'; '.join(poi_evidence[:16])}\n"
                f"Target Commodity Vertical: '{clean_req}'\n\n"
                "Decompose this specific commodity at this exact market into 2 concrete physical SKUs:\n"
                "1. Standard walk-in retail/street unit SKU.\n"
                "2. Commercial bulk/wholesale lot SKU traded at this market.\n"
                "CRITICAL:\n"
                "- 'search_item': 2-3 word concise English product name (no weights/units like '0.5kg' or '2.5m').\n"
                "- 'search_item_native': 2-3 word product name in the NATIVE language used by shoppers in this country.\n"
                f"- 'sector_clearing_ticket_local': realistic street transaction price in {curr_str} at {fx_str} (or 0.0 if unknown).\n"
                "Return strictly valid JSON:\n"
                "{\n"
                '  "resolved_sku": "Specific localized commodity name",\n'
                '  "sectors": [\n'
                '    {"sector_name": "Standard Unit Trade", "search_item": "2-3 word English item", "search_item_native": "2-3 word native item", "weight": 0.65, "trade_band": "RETAIL_UNIT", "sector_clearing_ticket_local": 0.0},\n'
                '    {"sector_name": "Bulk/Wholesale Lot Trade", "search_item": "2-3 word wholesale item", "search_item_native": "2-3 word native wholesale item", "weight": 0.35, "trade_band": "WHOLESALE_LOT", "sector_clearing_ticket_local": 0.0}\n'
                "  ]\n"
                "}"
            )
            scope_mode = "SPECIFIC_COMMODITY"
        else:
            prompt = (
                f"Target Market: {hub_search_name} ({lat}, {lon}) | Country: {country_code} | Currency: {curr_str} ({fx_str})\n"
                f"Live Web Reconnaissance on Market Specialty: {market_specialty_context[:1700]}\n"
                f"Verified Ground Merchants & Landmarks: {'; '.join(poi_evidence[:18])}\n\n"
                "Decompose this market into its 4 TRUE dominant real-world product sectors strictly based on the "
                "Live Web Reconnaissance and Verified Ground Merchants above.\n"
                "CRITICAL:\n"
                "- Name each sector by the real-world goods traded there (NOT generic labels like 'Shopping Center' or 'Commercial Merchant').\n"
                "- 'search_item': 2-3 word concrete English product sold in that sector.\n"
                "- 'search_item_native': 2-3 word concrete product name in the NATIVE local language used on local e-commerce/classifieds in this country.\n"
                f"- 'sector_clearing_ticket_local': realistic local street clearing price in {curr_str} at {fx_str} (or 0.0 if unknown).\n"
                "Return strictly valid JSON:\n"
                "{\n"
                '  "resolved_sku": "Descriptive name of the market ecosystem",\n'
                '  "sectors": [\n'
                '    {"sector_name": "Specific Product Sector Name", "search_item": "2-3 word English item", "search_item_native": "2-3 word native item", "weight": 0.35, "trade_band": "ANCHOR_TRADE", "sector_clearing_ticket_local": 0.0}\n'
                "  ]\n"
                "}"
            )
            scope_mode = "LOCATION_ECOSYSTEM"

        parsed_sectors: List[Dict[str, Any]] = []
        resolved_title = clean_req

        if self.groq_clients:
            for attempt_idx, model_id in enumerate(["qwen/qwen3.8-27b", "openai/gpt-oss-120b"]):
                client = self.groq_clients[(SpatialProductResolver._key_idx + attempt_idx) % len(self.groq_clients)]
                try:
                    res = await asyncio.to_thread(
                        client.chat.completions.create,
                        model=model_id,
                        messages=[{"role": "user", "content": prompt}],
                        response_format={"type": "json_object"},
                        max_tokens=550,
                        temperature=0.0,
                    )
                    SpatialProductResolver._key_idx += 1
                    data = json.loads(res.choices[0].message.content or "{}")
                    resolved_title = str(data.get("resolved_sku") or clean_req).strip()
                    raw_list = data.get("sectors", [])
                    if isinstance(raw_list, list) and len(raw_list) > 0:
                        w_sum = sum(float(s.get("weight", 0.0) or 0.0) for s in raw_list) or 1.0
                        for s in raw_list[:4]:
                            s_name = str(s.get("sector_name") or "").strip()
                            s_item = str(s.get("search_item") or "").strip()
                            s_native = str(s.get("search_item_native") or s_item).strip()
                            s_ticket = float(s.get("sector_clearing_ticket_local", 0.0) or 0.0)
                            if s_name and s_item:
                                parsed_sectors.append({
                                    "sector_name": s_name,
                                    "search_item": s_item,
                                    "search_item_native": s_native,
                                    "weight": round(float(s.get("weight", 0.25)) / w_sum, 3),
                                    "trade_band": str(s.get("trade_band") or "COMMERCIAL"),
                                    "sector_clearing_ticket_local": round(max(0.0, s_ticket), 2),
                                })
                        if parsed_sectors:
                            break
                except Exception as e:
                    logger.debug(f"ProductResolver LLM pivot ({model_id}): {e}")

        if not parsed_sectors:
            parsed_sectors = [{
                "sector_name": clean_req.title(),
                "search_item": clean_req,
                "search_item_native": clean_req,
                "weight": 1.0,
                "trade_band": "SPECIFIC",
                "sector_clearing_ticket_local": 0.0,
            }]

        logger.info(
            f"🌐 Multi-Sector Ecosystem Locked at {loc_label}: {resolved_title} | "
            f"Sectors: {[(s['sector_name'], s['weight']) for s in parsed_sectors]}"
        )

        return {
            "scope_mode": scope_mode,
            "resolved_sku": resolved_title,
            "location_label": loc_label,
            "empirical_poi_gravity": dict(sorted_empirical_types[:8]),
            "sector_portfolio": parsed_sectors,
        }