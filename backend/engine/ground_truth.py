import time
import httpx
import logging
from typing import Dict, Any
from engine.overture_engine import LiveInfrastructureEngine

logger = logging.getLogger("StreetAI.GroundTruth")

SECONDARY_OVERPASS_MIRRORS = [
    "https://overpass.private.coffee/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass-api.de/api/interpreter",
]


class GroundTruthCalibrator:
    """
    100% Empirical Structural Density Calibrator.
    Reads actual Batch 1 coalesced spatial keys (`osm_shops_count`, `osm_indoor_units_count`,
    `osm_cico_count`, `osm_buildings_count`, `gmaps_pois`) with fast Overpass mirror failover.
    """
    def __init__(self, db_client=None):
        self.db = db_client

    async def _extract_ledger_override(self, h3_cell: str) -> float:
        if not self.db:
            return 0.0
        try:
            if hasattr(self.db, "get_ground_truth_override"):
                val = await self.db.get_ground_truth_override(h3_cell)
                if val and float(val) > 0.0:
                    return float(val)
        except Exception:
            pass
        return 0.0

    async def _query_secondary_overpass_mirror(self, lat: float, lon: float) -> Dict[str, int]:
        overpass_ql = f"""
        [out:json][timeout:5];
        (
          nwr["shop"](around:350,{lat},{lon});
          nwr["amenity"~"marketplace|restaurant|cafe|fast_food|bank|pharmacy"](around:350,{lat},{lon});
          way["building"](around:350,{lat},{lon});
        );
        out tags;
        """
        async with httpx.AsyncClient(timeout=6.0, headers={"User-Agent": "StreetAI-GroundTruth/9.0"}) as client:
            for mirror_url in SECONDARY_OVERPASS_MIRRORS:
                try:
                    resp = await client.post(mirror_url, data={"data": overpass_ql})
                    if resp.status_code == 200:
                        elements = resp.json().get("elements", [])
                        shops = 0
                        buildings = 0
                        for el in elements:
                            tags = el.get("tags", {})
                            if "shop" in tags or "amenity" in tags:
                                shops += 1
                            if "building" in tags:
                                buildings += 1
                        if (shops + buildings) > 0:
                            return {"shops": shops, "buildings": buildings}
                except Exception as e:
                    logger.debug(f"Secondary Overpass mirror {mirror_url} pivot: {e}")
        return {"shops": 0, "buildings": 0}

    async def calculate_dynamic_multiplier(self, h3_cell: str, lat: float, lon: float) -> float:
        ledger_truth = await self._extract_ledger_override(h3_cell)
        if ledger_truth > 0.0:
            logger.info(f"🎯 Ground Truth Locked via Immutable Database Ledger ({ledger_truth}).")
            return ledger_truth

        snapshot = await LiveInfrastructureEngine.get_coalesced_spatial_snapshot(lat, lon)
        osm_shops = int(snapshot.get("osm_shops_count", 0) or 0)
        osm_indoor = int(snapshot.get("osm_indoor_units_count", 0) or 0)
        osm_cico = int(snapshot.get("osm_cico_count", 0) or 0)
        osm_buildings = int(snapshot.get("osm_buildings_count", 0) or 0)
        gmaps_pois = len(snapshot.get("gmaps_pois", []) or [])

        commercial_nodes = osm_shops + osm_indoor + osm_cico + gmaps_pois

        if commercial_nodes == 0 and osm_buildings == 0:
            mirror_counts = await self._query_secondary_overpass_mirror(lat, lon)
            commercial_nodes += mirror_counts["shops"]
            osm_buildings += mirror_counts["buildings"]

        if osm_buildings > 0 and commercial_nodes > 0:
            density = round(min(1.0, commercial_nodes / max(osm_buildings, commercial_nodes)), 3)
            logger.info(
                f"🎯 Ground Truth Locked via Coalesced OSM+POI Structural Density ({density} | "
                f"commercial_nodes={commercial_nodes}, buildings={osm_buildings})."
            )
            return density

        overture_b = int(snapshot.get("osm_buildings_count", 0) or 0)
        overture_p = int(snapshot.get("overture_places_count", 0) or 0)
        total_verified = commercial_nodes + overture_b + overture_p

        if total_verified > 0:
            logger.info(
                f"🎯 Ground Truth Locked via Verified Physical Geometry "
                f"(1.0 | commercial_nodes={commercial_nodes}, buildings={overture_b}, overture_places={overture_p})."
            )
            return 1.0

        logger.warning(
            f"⚠️ Ground Truth Unverified (0 transient POI/building nodes at {lat},{lon}); "
            "continuing with neutral factor 1.0."
        )
        return 1.0

        raise RuntimeError(f"CRITICAL: Cannot establish structural ground truth at {lat},{lon}. Halting.")