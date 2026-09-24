from pydantic import BaseModel, Field
from typing import Dict

# 1. Pydantic Ontology Graph (Deterministic Typing)
class CoordinateNode(BaseModel):
    lat: float = Field(..., description="Target Latitude")
    lon: float = Field(..., description="Target Longitude")
    country_code: str = Field(..., description="ISO Alpha-2 Country Code")

class EconomicBaseline(BaseModel):
    usd_peg: float = Field(default=2.50, description="Global baseline micro-transaction value")
    local_currency: str = Field(..., description="Target local currency code")
    country_code: str = Field(..., description="Target ISO Country Code") 
    ppp_multiplier: float = Field(..., description="World Bank purchasing power parity ratio")
    localized_value: float = Field(..., description="Scaled transaction value in local currency")

class DynamicPPPScaler:
    def __init__(self):
        # Deterministic mapping dictionary (Will be replaced by Numbeo API in Phase 3)
        self.ppp_matrix: Dict[str, Dict] = {
            "NG": {"currency": "NGN", "multiplier": 450.5}, # Base multiplier for Federal Capital Territory / national average
            "US": {"currency": "USD", "multiplier": 1.0},
            "IN": {"currency": "INR", "multiplier": 22.4},
            "KE": {"currency": "KES", "multiplier": 45.2}
        }

    def resolve_country_from_coords(self, lat: float, lon: float) -> str:
        # Placeholder spatial resolution (DuckDB/Overture will handle this in Phase 4)
        # Bounding box heuristic for rapid testing
        if 4.0 <= lat <= 14.0 and 2.0 <= lon <= 15.0:
            return "NG"
        return "US"

    def scale_basket(self, lat: float, lon: float, usd_baseline: float = 2.50) -> EconomicBaseline:
        country = self.resolve_country_from_coords(lat, lon)
        node = CoordinateNode(lat=lat, lon=lon, country_code=country)
        
        matrix_data = self.ppp_matrix.get(node.country_code, self.ppp_matrix["US"])
        localized_val = usd_baseline * matrix_data["multiplier"]
        
        return EconomicBaseline(
            usd_peg=usd_baseline,
            local_currency=matrix_data["currency"],
            country_code=country,
            ppp_multiplier=matrix_data["multiplier"],
            localized_value=round(localized_val, 2)
        )

# Quick Test Execution
if __name__ == "__main__":
    scaler = DynamicPPPScaler()
    # Testing with Wuse, Abuja coordinates
    result = scaler.scale_basket(lat=9.0765, lon=7.3986)
    print(result.model_dump_json(indent=2))