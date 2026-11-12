import os
import math
import json
import logging
import asyncio
from typing import Dict, Any, List, Optional
from collections import Counter
from groq import Groq
from engine.overture_engine import LiveInfrastructureEngine

logger = logging.getLogger("StreetAI.ProductResolver")


class SpatialProductResolver:
    """
    100% Dynamic Multi-Sector Commercial Ecosystem Resolver.
    - If the user queried a SPECIFIC commodity (e.g., 'electronics', 'suya', 'auto_parts'),
      locks strictly onto that commodity vector (Weight = 1.0).
    - If the user queried a LOCATION'S total cashflow ('general_merchandise'),
      inspects all physical merchants mapped at (lat, lon) and decomposes the street
      into its top 3 real commercial sectors with exact storefront weights (w_i).
    """
    def __init__(self):
        self.groq_key = os.getenv("GROQ_API_KEY", "")
        self.groq_client = Groq(api_key=self.groq_key) if self.groq_key else None

    async def resolve_market_ground_truth(
        self,
        lat: float,
        lon: float,
        requested_commodity: str = "general_merchandise",
        spatial_snapshot: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        if not spatial_snapshot:
            from engine.overture_engine import LiveInfrastructureEngine
            spatial_snapshot = await LiveInfrastructureEngine.get_coalesced_spatial_snapshot(lat, lon)

        loc_meta = spatial_snapshot.get("location_meta", {})
        loc_label = loc_meta.get("label") or loc_meta.get("display_name") or f"{lat:.4f},{lon:.4f}"
        pois = spatial_snapshot.get("gmaps_pois", [])
        osm_names = spatial_snapshot.get("osm_venue_names", [])

        # Calculate empirical review-weighted gravity for every physical merchant type on the ground
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

        # Sort empirical physical categories by measured ground gravity
        sorted_empirical_types = sorted(type_gravity.items(), key=lambda x: x[1], reverse=True)
        total_gravity = sum(v for _, v in sorted_empirical_types) or 1.0
        empirical_distribution_str = ", ".join(
            f"{t}: {round((g / total_gravity) * 100, 1)}% gravity"
            for t, g in sorted_empirical_types[:8]
        )

        if not is_ecosystem:
            # SPECIFIC COMMODITY SCOPE: Stratify into Retail Unit SKU vs. Wholesale/Commercial Pack SKU
            prompt = (
                f"Physical Location: {loc_label} ({lat}, {lon})\n"
                f"Verified Ground Merchants: {'; '.join(poi_evidence[:15])}\n"
                f"Target Commodity: '{clean_req}'\n\n"
                "Decompose this specific commodity at this exact market into 2 concrete, searchable physical SKUs:\n"
                "1. High-frequency standard retail/street unit transaction SKU.\n"
                "2. Bulk/wholesale or commercial lot transaction SKU traded at this hub.\n"
                "Return strictly valid JSON:\n"
                "{\n"
                '  "resolved_sku": "Specific localized commodity name",\n'
                '  "sectors": [\n'
                '    {"sector_name": "Standard Unit Trade", "search_item": "exact searchable item with unit", "weight": 0.65, "trade_band": "RETAIL_UNIT"},\n'
                '    {"sector_name": "Bulk/Wholesale Lot Trade", "search_item": "exact searchable wholesale pack item", "weight": 0.35, "trade_band": "WHOLESALE_LOT"}\n'
                "  ]\n"
                "}"
            )
            scope_mode = "SPECIFIC_COMMODITY"
        else:
            # MULTI-SECTOR ECOSYSTEM SCOPE: Anchored to empirical POI & review-volume distribution (4 to 5 sub-sectors)
            prompt = (
                f"Physical Location: {loc_label} ({lat}, {lon})\n"
                f"Verified Ground Merchants & Review Traffic: {'; '.join(poi_evidence[:22])}\n"
                f"Measured Empirical Category Gravity on Ground: {empirical_distribution_str}\n\n"
                "Decompose this physical commercial ecosystem into 4 to 5 distinct, granular commercial sub-sectors "
                "that reflect the EXACT measured empirical merchant distribution above (including both primary anchor trade, "
                "secondary specialty trade, and high-frequency street food/consumables or services present on the ground).\n"
                "For each sub-sector, provide a highly specific, concrete physical benchmark product ('search_item') "
                "commonly bought and sold in that sub-sector at this location, and set 'weight' proportional to its empirical gravity (weights must sum to 1.0).\n"
                "Return strictly valid JSON:\n"
                "{\n"
                '  "resolved_sku": "Descriptive name of the multi-sector hub",\n'
                '  "sectors": [\n'
                '    {"sector_name": "Specific Sub-Sector Name", "search_item": "Concrete physical item & unit", "weight": 0.35, "trade_band": "ANCHOR_TRADE"}\n'
                "  ]\n"
                "}"
            )
            scope_mode = "LOCATION_ECOSYSTEM"

        parsed_sectors: List[Dict[str, Any]] = []
        resolved_title = clean_req

        if self.groq_client:
            for model_id in ["qwen/qwen3.8-27b", "llama-3.3-70b-versatile", "llama-3.1-8b-instant"]:
                try:
                    res = await asyncio.to_thread(
                        self.groq_client.chat.completions.create,
                        model=model_id,
                        messages=[{"role": "user", "content": prompt}],
                        response_format={"type": "json_object"},
                        temperature=0.0,
                    )
                    data = json.loads(res.choices[0].message.content or "{}")
                    resolved_title = str(data.get("resolved_sku") or clean_req).strip()
                    raw_list = data.get("sectors", [])
                    if isinstance(raw_list, list) and len(raw_list) > 0:
                        w_sum = sum(float(s.get("weight", 0.0) or 0.0) for s in raw_list) or 1.0
                        for s in raw_list[:5]:
                            s_name = str(s.get("sector_name") or "").strip()
                            s_item = str(s.get("search_item") or "").strip()
                            if s_name and s_item:
                                parsed_sectors.append({
                                    "sector_name": s_name,
                                    "search_item": s_item,
                                    "weight": round(float(s.get("weight", 0.2)) / w_sum, 3),
                                    "trade_band": str(s.get("trade_band") or "COMMERCIAL"),
                                })
                        if parsed_sectors:
                            break
                except Exception as e:
                    logger.debug(f"ProductResolver LLM pivot ({model_id}): {e}")

        # Empirical physical POI fallback if LLM is unreachable
        if not parsed_sectors:
            if sorted_empirical_types and is_ecosystem:
                top_types = sorted_empirical_types[:4]
                sub_g = sum(g for _, g in top_types) or 1.0
                for t_name, g_val in top_types:
                    clean_t = t_name.replace("_", " ").title()
                    parsed_sectors.append({
                        "sector_name": clean_t,
                        "search_item": f"{clean_t} standard retail unit",
                        "weight": round(g_val / sub_g, 3),
                        "trade_band": "EMPIRICAL_POI",
                    })
            else:
                parsed_sectors = [{
                    "sector_name": clean_req.title(),
                    "search_item": clean_req,
                    "weight": 1.0,
                    "trade_band": "SPECIFIC",
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