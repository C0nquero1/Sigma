import random
from typing import Dict, Any

class TaxonomyEngine:
    def __init__(self):
        self.market_profiles = {
            "electronics": {
                "margin": 0.09,
                "sectors": ["Mobile Repairs & Parts", "Laptops & Accessories", "Mobile Money / POS"]
            },
            "agriculture": {
                "margin": 0.38,
                "sectors": ["Street Food & Produce", "Bulk Commodity Exchange", "Logistics Loading"]
            },
            "apparel": {
                "margin": 0.24,
                "sectors": ["Textiles & Fabrics", "Footwear & Leather", "Tailoring Services"]
            }
        }

    def get_cell_composition(self, s2_cell_id: str) -> Dict[str, Any]:
        cell_hash = sum(ord(c) for c in str(s2_cell_id))

        if cell_hash % 3 == 0:
            profile_key = "electronics"
            primary = "Consumer Tech & Micro-Repairs"
        elif cell_hash % 3 == 1:
            profile_key = "agriculture"
            primary = "Commodity Exchange & Fresh Produce"
        else:
            profile_key = "apparel"
            primary = "Apparel, Textiles & Leather"

        profile = self.market_profiles[profile_key]
        vendor_count = 1200 + (cell_hash * 37) % 6500

        return {
            "primary_sector": primary,
            "avg_margin": profile["margin"],
            "estimated_vendor_count": vendor_count,
            "composition": [
                {"label": profile["sectors"][0], "percentage": 48},
                {"label": profile["sectors"][1], "percentage": 34},
                {"label": profile["sectors"][2], "percentage": 18}
            ]
        }