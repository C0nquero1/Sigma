import re
import math
import logging
from typing import Dict, Any, List, Optional
from engine.overture_engine import LiveInfrastructureEngine
from engine.llm_router import llm_router

logger = logging.getLogger("StreetAI.ProductResolver")


def _clean_admin_city(raw_city: str) -> str:
    c = re.sub(
        r"^(?:Special Capital Region of|Metropolitan City of|Federal Capital Territory|Province of|State of|Governorate of)\s+",
        "",
        (raw_city or "").strip(),
        flags=re.IGNORECASE,
    )
    return c.split(",")[0].strip()


class SpatialProductResolver:
    """
    100% Universal Multi-Sector Ecosystem & Native SKU Resolver (Zero Hardcoded Test-Market Hints).
    - Uses `llm_router.fast_ddgs_text` (kills Bing RSS!) + multi-provider `llm_router.complete_json` (3 Groq + 2 Gemini + 2 OpenRouter).
    - Anchors on `{target_name}, {city}, {country}` (omitting hyper-local Nominatim street names like
      `Takkeciler Sokağı` when `target_name` is a named market complex so Grand Bazaar resolves to
      Gold, Carpets, Leather & Ceramics instead of hats/gloves!).
    """

    async def _fetch_live_market_specialty_context(self, market_query: str) -> str:
        clean_q = re.sub(r"^-?\d+\.\d+,-?\d+\.\d+$", "", market_query).strip()
        if not clean_q:
            return ""
        q = f'"{clean_q}" famous for selling main products goods shops'
        rows = await llm_router.fast_ddgs_text(q, max_results=8)
        chunks = [f"{r.get('title', '')}: {r.get('body', '')}" for r in rows if r.get("title") or r.get("body")]
        return " | ".join(chunks)[:2400]

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
        city_clean = _clean_admin_city(str(loc_meta.get("city") or ""))
        country_str = str(loc_meta.get("country") or "").strip()
        country_code = str(loc_meta.get("country_code") or "US").upper()
        full_loc_label = loc_meta.get("label") or loc_meta.get("display_name") or f"{lat:.4f},{lon:.4f}"

        pois = spatial_snapshot.get("gmaps_pois", [])
        osm_names = spatial_snapshot.get("osm_venue_names", [])
        wiki_geo = spatial_snapshot.get("wikidata_geo_entities", [])

        effective_target = (target_name or "").strip()
        if (not effective_target or re.match(r"^-?\d+\.\d+", effective_target)) and wiki_geo:
            effective_target = wiki_geo[0]["title"]

        # CRITICAL: When a named market complex is queried (e.g. "Grand Bazaar"), use `{target}, {city}, {country}`
        # instead of Nominatim's tiny micro-street (`Takkeciler Sokağı`), preventing sector narrowing!
        if effective_target and not re.match(r"^-?\d+\.\d+", effective_target):
            hub_parts = [p for p in (effective_target, city_clean, country_str) if p]
            hub_search_name = ", ".join(dict.fromkeys(hub_parts))
            display_label = hub_search_name
        else:
            hub_search_name = full_loc_label
            display_label = full_loc_label

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
                poi_evidence.append(f"{name} [OSM/LocationIQ/Overture Node]")

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
                f"Target Market Complex: {hub_search_name} ({lat}, {lon}) | Country: {country_code} | Currency: {curr_str} ({fx_str})\n"
                f"Live Web Reconnaissance on Market Specialty: {market_specialty_context[:1600]}\n"
                f"Verified Ground Merchants & Landmarks: {'; '.join(poi_evidence[:16])}\n"
                f"Target Commodity Vertical: '{clean_req}'\n\n"
                "Decompose this specific commodity at this exact market into 2 concrete physical SKUs:\n"
                "1. Standard walk-in retail finished product SKU (NOT raw per-gram bullion rate).\n"
                "2. Commercial bulk/wholesale multi-unit lot SKU (always higher total value than a single retail unit).\n"
                "CRITICAL:\n"
                "- 'search_item': 2-3 word concise English product name (no weights/units like '0.5kg' or '2.5m').\n"
                "- 'search_item_native': 2-3 word product name in the NATIVE language used by shoppers in this country.\n"
                f"- 'sector_clearing_ticket_local': realistic street transaction price in {curr_str} at {fx_str} (or 0.0 if unknown).\n"
                "Return strictly valid JSON:\n"
                "{\n"
                '  "resolved_sku": "Specific localized commodity name",\n'
                '  "sectors": [\n'
                '    {"sector_name": "Standard Unit Trade", "search_item": "2-3 word English item", "search_item_native": "2-3 word native item", "weight": 0.65, "trade_band": "RETAIL_UNIT", "sector_clearing_ticket_local": 0.0},\n'
                '    {"sector_name": "Bulk/Wholesale Lot Trade", "search_item": "2-3 word wholesale lot", "search_item_native": "2-3 word native wholesale lot", "weight": 0.35, "trade_band": "WHOLESALE_LOT", "sector_clearing_ticket_local": 0.0}\n'
                "  ]\n"
                "}"
            )
            scope_mode = "SPECIFIC_COMMODITY"
        else:
            prompt = (
                f"Target Market Complex: {hub_search_name} ({lat}, {lon}) | Country: {country_code} | Currency: {curr_str} ({fx_str})\n"
                f"Live Web Reconnaissance on Market Specialty: {market_specialty_context[:1800]}\n"
                f"Verified Ground Merchants & Landmarks: {'; '.join(poi_evidence[:18])}\n\n"
                "Decompose the ENTIRE named market complex into its 4 TRUE dominant real-world product sectors "
                "(do NOT narrow a giant market down to a single side alley).\n"
                "CRITICAL:\n"
                "- Name each sector by the real-world goods traded there (NOT generic labels like 'Shopping Center').\n"
                "- 'search_item': 2-3 word concrete English product sold in that sector.\n"
                "- 'search_item_native': 2-3 word concrete product name in the NATIVE local language used on local e-commerce/classifieds.\n"
                f"- 'sector_clearing_ticket_local': realistic local street clearing price in {curr_str} at {fx_str} (or 0.0 if unknown).\n"
                "Return strictly valid JSON:\n"
                "{\n"
                '  "resolved_sku": "Descriptive name of the full market ecosystem",\n'
                '  "sectors": [\n'
                '    {"sector_name": "Specific Product Sector Name", "search_item": "2-3 word English item", "search_item_native": "2-3 word native item", "weight": 0.35, "trade_band": "ANCHOR_TRADE", "sector_clearing_ticket_local": 0.0}\n'
                "  ]\n"
                "}"
            )
            scope_mode = "LOCATION_ECOSYSTEM"

        parsed_sectors: List[Dict[str, Any]] = []
        resolved_title = clean_req

        data = await llm_router.complete_json(prompt, max_tokens=600, cache_ttl_seconds=86400)
        if data:
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
            f"🌐 Multi-Sector Ecosystem Locked at {display_label}: {resolved_title} | "
            f"Sectors: {[(s['sector_name'], s['weight']) for s in parsed_sectors]}"
        )

        return {
            "scope_mode": scope_mode,
            "resolved_sku": resolved_title,
            "location_label": display_label,
            "empirical_poi_gravity": dict(sorted_empirical_types[:8]),
            "sector_portfolio": parsed_sectors,
        }