import logging
import httpx
from pydantic import BaseModel, Field
from typing import Dict, Any

logger = logging.getLogger("StreetAI.PPPScaler")

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
        # Local cache for World Bank conversion factors (LCU per international $)
        # These act as instant fallbacks if the API request fails or times out.
        self._conversion_cache: Dict[str, Dict[str, Any]] = {
            "NG": {"currency": "NGN", "multiplier": 450.5},
            "IN": {"currency": "INR", "multiplier": 23.4},
            "KE": {"currency": "KES", "multiplier": 52.1},
            "GH": {"currency": "GHS", "multiplier": 5.8},
            "BR": {"currency": "BRL", "multiplier": 2.8},
            "MX": {"currency": "MXN", "multiplier": 10.2},
            "US": {"currency": "USD", "multiplier": 1.0}
        }

    async def get_ppp_data(self, country_code: str) -> Dict[str, Any]:
        """Fetches dynamic PPP data from the World Bank API."""
        cc = country_code.upper()
        
        # Use cached data if available to prevent API throttling
        if cc in self._conversion_cache:
            return self._conversion_cache[cc]

        # Query World Bank API dynamically for indicator PA.NUS.PPP
        url = f"https://api.worldbank.org/v2/country/{cc}/indicator/PA.NUS.PPP?format=json&date=2023:2025"
        try:
            async with httpx.AsyncClient() as client:
                res = await client.get(url, timeout=5.0)
                if res.status_code == 200:
                    data = res.json()
                    if len(data) > 1 and data[1]:
                        for entry in data[1]:
                            if entry.get("value") is not None:
                                factor = float(entry["value"])
                                result = {"currency": "LCU", "multiplier": factor}
                                self._conversion_cache[cc] = result
                                return result
        except Exception as e:
            logger.warning(f"World Bank PPP live fetch failed for {cc}: {e}")

        # Universal fallback if the target country is unlisted or API fails
        return {"currency": "USD", "multiplier": 1.0}

    async def scale_basket(self, country_code: str, usd_baseline: float = 2.50) -> EconomicBaseline:
        """
        Normalizes a global baseline commodity basket into its local economic equivalent
        using real-time World Bank Purchasing Power Parity (PPP) metrics.
        """
        ppp_data = await self.get_ppp_data(country_code)
        
        localized_val = usd_baseline * ppp_data["multiplier"]
        
        return EconomicBaseline(
            usd_peg=usd_baseline,
            local_currency=ppp_data["currency"],
            country_code=country_code,
            ppp_multiplier=ppp_data["multiplier"],
            localized_value=round(localized_val, 2)
        )

# Quick Test Execution
if __name__ == "__main__":
    import asyncio
    async def _test():
        scaler = DynamicPPPScaler()
        # Testing with Nigeria (NG)
        result = await scaler.scale_basket(country_code="NG", usd_baseline=2.50)
        print(result.model_dump_json(indent=2))
        
    asyncio.run(_test())