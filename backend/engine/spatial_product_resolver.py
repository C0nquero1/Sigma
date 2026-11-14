import os
import math
import json
import logging
import asyncio
from typing import Dict, Any, List, Optional
from groq import Groq
from engine.overture_engine import LiveInfrastructureEngine

logger = logging.getLogger("StreetAI.ProductResolver")


class SpatialProductResolver:
    """
    100% Physical Reality Multi-Sector Ecosystem & Commodity Resolver.
    Weights every physical merchant category mapped on the ground by
    Storefront Count x ln(1 + Verified Customer Reviews) and decomposes
    the hub into distinct sub-sectors, each with its own category-specific clearing ticket.
    """
    def __init__(self):
        self.groq_key = os.getenv("GROQ_API_KEY", "")
        self.groq_client = Groq(api_key=self.groq_key, max_retries=0, timeout=12.0) if self.groq_key else None

    async def resolve_market_ground_truth(
        self,
        lat: float,
        lon: float,
        requested_commodity: str = "general_merchandise",
        spatial_snapshot: Optional[Dict[str, Any]] = None,
        local_currency: str = "USD",
        fx_rate_per_usd: float = 1.0,
    ) -> Dict[str, Any]:
        if not spatial_snapshot:
            spatial_snapshot = await LiveInfrastructureEngine.get_coalesced_spatial_snapshot(lat, lon)

        loc_meta = spatial_snapshot.get("location_meta", {})
        loc_label = loc_meta.get("label") or loc_meta.get("display_name") or f"{lat:.4f},{lon:.4f}"
        pois = spatial_snapshot.get("gmaps_pois", [])
        osm_names = spatial_snapshot.get("osm_venue_names", [])

        type_gravity: Dict[str, float] = {}
        poi_evidence: List[str] = []
        for p in pois:
            title = str(p.get("title") or "").strip()
            p_type = str(p.get("type") or "merchant").strip()
            reviews = max(1, int(p.get("reviews") or 1))
            gravity = 1.0 + math.log1p(reviews)
            type_gravity[p_type] = round(type_gravity.get(p_type, 0.0) + gravity, 2)
            if title:
                poi_evidence.append(f"{title} [{p_type}, {reviews} reviews]")

        for name in osm_names[:15]:
            if name not in poi_evidence:
                poi_evidence.append(f"{name} [OSM Verified Stall]")

        clean_req = (requested_commodity or "general_merchandise").replace("_", " ").strip()
        is_ecosystem = clean_req.lower() in (
            "general merchandise", "general", "all", "all sectors", "everything", "market", "cashflow"
        )

        sorted_empirical_types = sorted(type_gravity.items(), key=lambda x: x[1], reverse=True)
        total_gravity = sum(v for _, v in sorted_empirical_types) or 1.0
        empirical_distribution_str = ", ".join(
            f"{t}: {round((g / total_gravity) * 100, 1)}% gravity"
            for t, g in sorted_empirical_types[:8]
        )

        curr_str = (local_currency or "USD").upper()
        fx_str = f"1 USD = {fx_rate_per_usd:,.2f} {curr_str}"

        if not is_ecosystem:
            prompt = (
                f"Physical Location: {loc_label} ({lat}, {lon}) | Currency: {curr_str} ({fx_str})\n"
                f"Verified Ground Merchants: {'; '.join(poi_evidence[:15])}\n"
                f"Target Commodity: '{clean_req}'\n\n"
                "Decompose this specific commodity at this exact market into 2 concrete physical SKUs:\n"
                "1. High-frequency standard walk-in retail/street unit transaction SKU.\n"
                "2. Bulk/wholesale commercial lot transaction SKU traded at this hub.\n"
                f"For each SKU, provide its realistic physical street clearing price in {curr_str} ('sector_clearing_ticket_local') at {fx_str}.\n"
                "Return strictly valid JSON:\n"
                "{\n"
                '  "resolved_sku": "Specific localized commodity name",\n'
                '  "sectors": [\n'
                '    {"sector_name": "Standard Unit Trade", "search_item": "2-3 word searchable item", "weight": 0.65, "trade_band": "RETAIL_UNIT", "sector_clearing_ticket_local": 0.0},\n'
                '    {"sector_name": "Bulk/Wholesale Lot Trade", "search_item": "2-3 word wholesale pack item", "weight": 0.35, "trade_band": "WHOLESALE_LOT", "sector_clearing_ticket_local": 0.0}\n'
                "  ]\n"
                "}"
            )
            scope_mode = "SPECIFIC_COMMODITY"
        else:
            prompt = (
                f"Physical Location: {loc_label} ({lat}, {lon}) | Currency: {curr_str} ({fx_str})\n"
                f"Verified Ground Merchants & Review Traffic: {'; '.join(poi_evidence[:20])}\n"
                f"Measured Empirical Category Gravity on Ground: {empirical_distribution_str}\n\n"
                "Decompose this physical commercial ecosystem into 4 distinct commercial sub-sectors "
                "reflecting the measured merchant distribution above.\n"
                "For each sub-sector:\n"
                "- Provide a concise 2-to-3 word physical benchmark product ('search_item') commonly sold in that sector.\n"
                "- Set 'weight' proportional to its empirical gravity (weights must sum to 1.0).\n"
                f"- Set 'sector_clearing_ticket_local' to the realistic local street transaction price in {curr_str} ({fx_str}) for that specific sub-sector (each sector MUST have its own realistic price—e.g. electronics/jewelry costs much more than street food/beverages!).\n"
                "Return strictly valid JSON:\n"
                "{\n"
                '  "resolved_sku": "Descriptive name of the multi-sector hub",\n'
                '  "sectors": [\n'
                '    {"sector_name": "Specific Sub-Sector Name", "search_item": "2-3 word physical item", "weight": 0.35, "trade_band": "ANCHOR_TRADE", "sector_clearing_ticket_local": 0.0}\n'
                "  ]\n"
                "}"
            )
            scope_mode = "LOCATION_ECOSYSTEM"

        parsed_sectors: List[Dict[str, Any]] = []
        resolved_title = clean_req

        if self.groq_client:
            for model_id in ["qwen/qwen3.8-27b", "openai/gpt-oss-120b"]:
                try:
                    res = await asyncio.to_thread(
                        self.groq_client.chat.completions.create,
                        model=model_id,
                        messages=[{"role": "user", "content": prompt}],
                        response_format={"type": "json_object"},
                        max_tokens=500,
                        temperature=0.0,
                    )
                    data = json.loads(res.choices[0].message.content or "{}")
                    resolved_title = str(data.get("resolved_sku") or clean_req).strip()
                    raw_list = data.get("sectors", [])
                    if isinstance(raw_list, list) and len(raw_list) > 0:
                        w_sum = sum(float(s.get("weight", 0.0) or 0.0) for s in raw_list) or 1.0
                        for s in raw_list[:4]:
                            s_name = str(s.get("sector_name") or "").strip()
                            s_item = str(s.get("search_item") or "").strip()
                            s_ticket = float(s.get("sector_clearing_ticket_local", 0.0) or 0.0)
                            if s_name and s_item:
                                parsed_sectors.append({
                                    "sector_name": s_name,
                                    "search_item": s_item,
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