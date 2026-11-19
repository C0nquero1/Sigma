import math
import logging
from typing import List, Dict, Any
from engine.overture_engine import LiveInfrastructureEngine

logger = logging.getLogger("StreetAI.MarketShare")


class MarketShareEngine:
    """
    100% Empirical Market Share Spatial Distribution Engine.
    Consumes ALL verified spatial layers from Batch 1 `overture_engine.py`:
      1. OSM 3D/2D building polygons (`polygons`)
      2. Verified Google Maps POIs (`gmaps_pois`)
      3. Verified Esri ArcGIS / Photon & OSM commercial merchant nodes (`photon_pois`, `osm_merchant_coords`)
      4. Haversine spatial sub-blocks (`spatial_sub_blocks`)
    """
    async def calculate_market_share(self, lat: float, lon: float) -> List[Dict[str, Any]]:
        snapshot = await LiveInfrastructureEngine.get_coalesced_spatial_snapshot(lat, lon)
        polygons = snapshot.get("polygons", [])
        gmaps_pois = snapshot.get("gmaps_pois", [])
        photon_pois = snapshot.get("photon_pois", [])
        osm_coords = snapshot.get("osm_merchant_coords", [])
        sub_blocks = snapshot.get("spatial_sub_blocks", [])

        clusters = {"Primary Hub": 0.0, "Secondary Spine": 0.0, "Periphery Nodes": 0.0}

        # Tier 1: Exact OSM Polygon Surface Area Distribution
        for poly in polygons:
            dist = math.hypot(poly["lon"] - lon, poly["lat"] - lat)
            area = float(poly.get("area_sqm", 0.0) or 0.0)
            if area <= 0:
                continue
            if dist < 0.0015:
                clusters["Primary Hub"] += area
            elif dist < 0.0030:
                clusters["Secondary Spine"] += area
            else:
                clusters["Periphery Nodes"] += area

        # Tier 2: All Verified Commercial Merchant Nodes (GMaps + ArcGIS/Photon + OSM)
        if sum(clusters.values()) <= 0:
            all_nodes = gmaps_pois + photon_pois + osm_coords
            for node in all_nodes:
                n_lat, n_lon = node.get("lat"), node.get("lon")
                if n_lat is None or n_lon is None:
                    continue
                dist = math.hypot(float(n_lon) - lon, float(n_lat) - lat)
                # Literal observed review weight when > 0, else 1.0 unit per verified merchant
                reviews = int(node.get("reviews") or 0)
                weight = float(1.0 + math.log1p(reviews)) if reviews > 0 else 1.0
                if dist < 0.0020:
                    clusters["Primary Hub"] += weight
                elif dist < 0.0045:
                    clusters["Secondary Spine"] += weight
                else:
                    clusters["Periphery Nodes"] += weight

        # Tier 3: Verified Spatial Sub-Blocks
        if sum(clusters.values()) <= 0 and sub_blocks:
            for sb in sub_blocks:
                dist = math.hypot(sb["centroid_lon"] - lon, sb["centroid_lat"] - lat)
                w = float(sb.get("verified_nodes_count", 1) or 1)
                if dist < 0.0020:
                    clusters["Primary Hub"] += w
                elif dist < 0.0045:
                    clusters["Secondary Spine"] += w
                else:
                    clusters["Periphery Nodes"] += w

        total = sum(clusters.values())
        if total <= 0:
            logger.warning(f"⚠️ No commercial geometry available for market share at {lat},{lon}; returning empty distribution.")
            return []

        result = [{"name": k, "value": round((v / total) * 100.0, 1)} for k, v in clusters.items() if v > 0]
        logger.info(f"📊 Coalesced Market Share Locked at {lat},{lon}: {result}")
        return result