import os
import logging
import httpx
import math
from typing import List, Dict, Any, Tuple
from engine.overture_engine import LiveInfrastructureEngine

logger = logging.getLogger("StreetAI.MarketShare")


class MarketShareEngine:
    """
    100% Physical Reality Market Share Engine.
    Consumes the Coalesced Spatial Multiplexer to compute exact cluster distribution
    across Primary Hub, Secondary Spine, and Periphery Nodes with zero duplicate Overpass calls.
    """
    async def calculate_market_share(self, lat: float, lon: float) -> List[Dict[str, Any]]:
        snapshot = await LiveInfrastructureEngine.get_coalesced_spatial_snapshot(lat, lon)
        polygons = snapshot.get("polygons", [])
        gmaps_pois = snapshot.get("gmaps_pois", [])

        clusters = {"Primary Hub": 0.0, "Secondary Spine": 0.0, "Periphery Nodes": 0.0}

        # 1. Exact Polygon Surface Area Distribution
        for poly in polygons:
            dist = math.hypot(poly["lon"] - lon, poly["lat"] - lat)
            area = float(poly["area_sqm"])
            if dist < 0.0015:
                clusters["Primary Hub"] += area
            elif dist < 0.0030:
                clusters["Secondary Spine"] += area
            else:
                clusters["Periphery Nodes"] += area

        # 2. Fuse with Verified Google Maps POI Commercial Activity Weights
        if sum(clusters.values()) <= 0 and gmaps_pois:
            for poi in gmaps_pois:
                dist = math.hypot(poi["lon"] - lon, poi["lat"] - lat)
                weight = float(max(10, poi.get("reviews", 10)))
                if dist < 0.0020:
                    clusters["Primary Hub"] += weight
                elif dist < 0.0045:
                    clusters["Secondary Spine"] += weight
                else:
                    clusters["Periphery Nodes"] += weight

        total = sum(clusters.values())
        if total <= 0:
            raise RuntimeError(f"CRITICAL: Unable to establish physical market share geometry at {lat},{lon}. Halting.")

        result = [{"name": k, "value": round((v / total) * 100.0, 1)} for k, v in clusters.items() if v > 0]
        logger.info(f"📊 Coalesced Market Share Locked at {lat},{lon}: {result}")
        return result