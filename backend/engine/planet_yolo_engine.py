import httpx
from ultralytics import YOLO
import logging
import os

logger = logging.getLogger("StreetAI.PhysicalVelocity")

class SatelliteInferenceEngine:
    def __init__(self, planet_api_key=None, **kwargs):
        self.planet_api_key = planet_api_key
        
        # Safe fallback for missing custom weights
        model_path = "street_ai_stalls_v1.pt"
        if os.path.exists(model_path):
            self.model = YOLO(model_path)
        else:
            print(f"⚠️ Warning: '{model_path}' not found. Falling back to 'yolov8n.pt'.")
            self.model = YOLO("yolov8n.pt")
        
    async def request_planet_imagery(self, item_id: str, bbox: tuple) -> str:
        """Triggers the Planet Orders API to deliver a product bundle."""
        order_payload = {
            "name": f"market_scan_{item_id}",
            "products": [{
                "item_ids": [item_id],
                "item_type": "PSScene",
                "product_bundle": "analytic_sr_udm2"
            }],
            "tools": [{"clip": {"aoi": {"type": "Polygon", "coordinates": [bbox]}}}]
        }
        async with httpx.AsyncClient(auth=(self.api_key, "")) as client:
            res = await client.post("https://api.planet.com/compute/ops/orders/v2", json=order_payload)
            # In production, wait for the JSON delivery manifest and download the image path
            return "downloads/clipped_market_scene.tif"

    def compute_dark_cash(self, image_path: str, avg_basket_usd: float) -> dict:
        """Executes YOLO inference to count physical objects and compute baseline cash."""
        results = self.model(image_path)
        
        stall_count = 0
        human_cluster_count = 0
        
        for result in results:
            boxes = result.boxes
            for box in boxes:
                cls_id = int(box.cls[0])
                conf = float(box.conf[0])
                if conf > 0.65:
                    if cls_id == 0: stall_count += 1
                    elif cls_id == 1: human_cluster_count += 1

        baseline_physical_cash = stall_count * avg_basket_usd
        
        return {
            "detected_stalls": stall_count,
            "human_clusters": human_cluster_count,
            "baseline_physical_cash_usd": round(baseline_physical_cash, 2)
        }