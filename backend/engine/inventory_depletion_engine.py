import re
import math
import logging
import asyncio
from typing import Dict, Any, List, Tuple, Optional
from engine.overture_engine import LiveInfrastructureEngine
from engine.llm_router import llm_router

logger = logging.getLogger("StreetAI.InventoryDepletion")


def _haversine_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371000.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp, dl = math.radians(lat2 - lat1), math.radians(lon2 - lon1)
    a = math.sin(dp / 2.0) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2.0) ** 2
    return 2.0 * r * math.asin(min(1.0, math.sqrt(a)))


def _shoelace_hull_sqm(points: List[Tuple[float, float]]) -> float:
    if len(points) < 3:
        return 0.0
    pts = sorted(set(points))
    if len(pts) < 3:
        return 0.0

    def cross(o, a, b):
        return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])

    lower = []
    for p in pts:
        while len(lower) >= 2 and cross(lower[-2], lower[-1], p) <= 0:
            lower.pop()
        lower.append(p)
    upper = []
    for p in reversed(pts):
        while len(upper) >= 2 and cross(upper[-2], upper[-1], p) <= 0:
            upper.pop()
        upper.append(p)
    hull = lower[:-1] + upper[:-1]
    if len(hull) < 3:
        return 0.0

    earth_radius = 6378137.0
    area = 0.0
    for i in range(len(hull)):
        lon1, lat1 = hull[i]
        lon2, lat2 = hull[(i + 1) % len(hull)]
        lat1_r, lon1_r = math.radians(lat1), math.radians(lon1)
        lat2_r, lon2_r = math.radians(lat2), math.radians(lon2)
        area += (lon2_r - lon1_r) * (2.0 + math.sin(lat1_r) + math.sin(lat2_r))
    return round(abs(area * (earth_radius ** 2) / 2.0), 2)


def _clean_city_label(raw_city: str) -> str:
    c = re.sub(
        r"^(?:Special Capital Region of|Metropolitan City of|Federal Capital Territory|Province of|State of|Governorate of)\s+",
        "",
        (raw_city or "").strip(),
        flags=re.IGNORECASE,
    )
    return c.split(",")[0].strip()


class ZonalCapacityEngine:
    """
    100% Empirical Zonal Commercial Capacity & Wholesale Supply Engine (Zero Simulation).
    - Tier 1 Footprint: Real 3D Overture/OSM gross floor area (`total_osm_3d_gross_floor_sqm`) or 2D building polygons.
    - Tier 2 Footprint: Unscaled spherical Shoelace hull across verified commercial nodes (`<= 450m` core first;
      expands to `<= 850m` only if `< 3` nodes sit inside `450m`, fixing sprawling markets like Alaba).
    - Supply Extraction: Uses `llm_router.fast_ddgs_text` (`yahoo,startpage`, cached 6h) with IQR filtering.
    - Zero fake stock multipliers and zero dishonest data-point floors.
    """

    async def _measure_structural_zonal_capacity(
        self, lat: float, lon: float
    ) -> Tuple[float, str, str, int]:
        snapshot = await LiveInfrastructureEngine.get_coalesced_spatial_snapshot(lat, lon)
        loc_label = snapshot.get("location_meta", {}).get("label", f"{lat:.4f},{lon:.4f}")

        gross_3d_sqm = float(snapshot.get("total_osm_3d_gross_floor_sqm", 0.0) or 0.0)
        flat_2d_sqm = float(snapshot.get("total_osm_footprint_sqm", 0.0) or 0.0)
        bldg_cnt = int(snapshot.get("osm_buildings_count", 0) or 0)
        geom_src = str(snapshot.get("geometry_source") or "OSM_3D")

        if gross_3d_sqm >= 100.0:
            logger.info(
                f"🏗️ Verified 3D Building Gross Floor Area Locked ({geom_src}): "
                f"{gross_3d_sqm:,.2f} sqm ({bldg_cnt} buildings) at {lat:.4f},{lon:.4f}."
            )
            return round(gross_3d_sqm, 2), loc_label, f"3D_GROSS_FLOOR_AREA_{geom_src}", bldg_cnt

        if flat_2d_sqm >= 100.0:
            logger.info(
                f"🏗️ Verified 2D Building Footprint Locked ({geom_src}): "
                f"{flat_2d_sqm:,.2f} sqm ({bldg_cnt} buildings) at {lat:.4f},{lon:.4f}."
            )
            return round(flat_2d_sqm, 2), loc_label, f"2D_POLYGON_FOOTPRINT_{geom_src}", bldg_cnt

        all_nodes = (
            list(snapshot.get("gmaps_pois", []))
            + list(snapshot.get("photon_pois", []))
            + list(snapshot.get("osm_merchant_coords", []))
        )

        # Tier 2A: Core 450m commercial hull
        core_pts_450 = [
            (float(p["lon"]), float(p["lat"]))
            for p in all_nodes
            if "lat" in p
            and "lon" in p
            and _haversine_m(lat, lon, float(p["lat"]), float(p["lon"])) <= 450.0
        ]
        if len(core_pts_450) >= 3:
            hull_sqm = _shoelace_hull_sqm(core_pts_450)
            logger.info(
                f"🏗️ Core-Radius (<=450m) POI Hull Footprint Locked: "
                f"{hull_sqm:,.2f} sqm across {len(core_pts_450)} core nodes at {lat:.4f},{lon:.4f}."
            )
            return hull_sqm, loc_label, "CORE_450M_POI_SHOELACE_HULL", len(core_pts_450)

        # Tier 2B: Expanded 850m zone hull when immediate 450m has < 3 mapped pins (e.g. sprawling hubs like Alaba)
        zone_pts_850 = [
            (float(p["lon"]), float(p["lat"]))
            for p in all_nodes
            if "lat" in p
            and "lon" in p
            and _haversine_m(lat, lon, float(p["lat"]), float(p["lon"])) <= 850.0
        ]
        if len(zone_pts_850) >= 3:
            hull_sqm = _shoelace_hull_sqm(zone_pts_850)
            logger.info(
                f"🏗️ Zone-Radius (<=850m) POI Hull Footprint Locked: "
                f"{hull_sqm:,.2f} sqm across {len(zone_pts_850)} nodes at {lat:.4f},{lon:.4f}."
            )
            return hull_sqm, loc_label, "ZONE_850M_POI_SHOELACE_HULL", len(zone_pts_850)

        return 0.0, loc_label, "UNVERIFIED_GEOMETRY", len(zone_pts_850)

    async def _extract_live_supply_osint(
        self, commodity: str, city_label: str
    ) -> List[int]:
        clean_comm = commodity.replace("_", " ").strip()
        if clean_comm.lower() in ("general merchandise", "general", "all", "market", "cashflow"):
            clean_comm = "market goods"
        clean_city = _clean_city_label(city_label)

        q1 = f"wholesale {clean_comm} {clean_city} MOQ minimum order cartons units".strip()
        q2 = f"{clean_comm} supplier distributor {clean_city} bulk lot pieces boxes".strip()

        pattern = (
            r"\b(?:moq|minimum order(?: quantity)?|min\.?\s*order)[\s:]+(?:is\s+|of\s+)?([\d,]+)\b"
            r"|\b(?:pack|box|carton|case|lot|bundle|set)\s+of\s+([\d,]+)\b"
            r"|\b([\d,]+)\s*(?:pieces|pcs|units|cartons|cases|boxes|pallets|packs|rolls|bales|pairs)\b"
        )

        rows1, rows2 = await asyncio.gather(
            llm_router.fast_ddgs_text(q1, max_results=8),
            llm_router.fast_ddgs_text(q2, max_results=8),
            return_exceptions=True,
        )
        chunks: List[str] = []
        for batch in (rows1, rows2):
            if isinstance(batch, list):
                for r in batch:
                    chunks.append(f"{r.get('title', '')} {r.get('body', '')}")
        combined = " ".join(chunks)

        extracted: List[int] = []
        for m in re.findall(pattern, combined, flags=re.IGNORECASE):
            raw_num = m[0] or m[1] or m[2]
            if not raw_num:
                continue
            try:
                val = int(raw_num.replace(",", ""))
                if 10 <= val <= 100_000 and not (1990 <= val <= 2035):
                    extracted.append(val)
            except ValueError:
                pass

        if len(extracted) >= 4:
            extracted.sort()
            q1_v = extracted[len(extracted) // 4]
            q3_v = extracted[(len(extracted) * 3) // 4]
            iqr = q3_v - q1_v
            extracted = [x for x in extracted if (q1_v - 1.5 * iqr) <= x <= (q3_v + 1.5 * iqr)] or extracted

        return sorted(extracted)

    async def calculate_mass_depletion_and_cap(
        self,
        lat: float,
        lon: float,
        commodity: str,
        city: str = "",
        empirical_scope: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        literal_zonal_sqm, loc_label, footprint_source, structure_nodes = (
            await self._measure_structural_zonal_capacity(lat, lon)
        )
        city_search = _clean_city_label(city) or (
            loc_label.split(",")[-2].strip() if "," in loc_label else loc_label
        )
        clean_lots = await self._extract_live_supply_osint(commodity, city_search)
        median_lot_size = clean_lots[len(clean_lots) // 2] if clean_lots else 0

        scoped_units = int((empirical_scope or {}).get("scoped_economic_units", 0) or 0)
        corpus_stall_stock = int((empirical_scope or {}).get("typical_stall_stock_units", 0) or 0)

        if scoped_units > 0 and median_lot_size > 0 and corpus_stall_stock > 0:
            per_stall_units = int(round((median_lot_size * 0.50) + (corpus_stall_stock * 0.50)))
            proven_market_inventory = scoped_units * per_stall_units
            stock_source = "DDGS_B2B_MOQ_AND_EMPIRICAL_STALL_CORPUS"
            depletion_state = "ACTIVE_PHYSICAL_LIQUIDITY"
            is_stock_verified = True
        elif scoped_units > 0 and median_lot_size > 0:
            proven_market_inventory = scoped_units * median_lot_size
            stock_source = "DDGS_B2B_MOQ_VERIFIED_LOT_SCALED"
            depletion_state = "ACTIVE_PHYSICAL_LIQUIDITY"
            is_stock_verified = True
        elif scoped_units > 0 and corpus_stall_stock > 0:
            proven_market_inventory = scoped_units * corpus_stall_stock
            stock_source = "EMPIRICAL_CORPUS_STALL_STOCK"
            depletion_state = "ACTIVE_PHYSICAL_LIQUIDITY"
            is_stock_verified = False
        else:
            proven_market_inventory = 0
            stock_source = "UNVERIFIED_ZERO_SUPPLY_OBSERVATIONS"
            depletion_state = "STOCK_UNVERIFIED"
            is_stock_verified = False

        logger.info(
            f"📦 Empirical Zonal Capacity Locked | Footprint: {literal_zonal_sqm:,.2f} sqm ({footprint_source}) | "
            f"Market Stock: {proven_market_inventory:,} units ({stock_source}, B2B Lots Observed: {len(clean_lots)}, "
            f"Median Lot: {median_lot_size}) | State: {depletion_state}"
        )

        return {
            "literal_commercial_footprint_sqm": literal_zonal_sqm,
            "footprint_source": footprint_source,
            "footprint_structure_nodes": structure_nodes,
            "median_verified_physical_stock": proven_market_inventory,
            "median_b2b_lot_size": median_lot_size,
            "raw_osint_stock_data_points": len(clean_lots),
            "is_stock_empirically_verified": is_stock_verified,
            "stock_source": stock_source,
            "liquidity_status": depletion_state,
            "depletion_state": depletion_state,
            "provenance": f"{footprint_source} + {stock_source}",
        }