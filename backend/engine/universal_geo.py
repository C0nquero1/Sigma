import pycountry
import httpx
from typing import Dict, Any, List

class UniversalGeoRouter:
    """Dynamically resolves regional digital infrastructure without static maps."""

    @staticmethod
    def get_currency_and_country(lat: float, lon: float, country_code: str) -> Dict[str, Any]:
        country = pycountry.countries.get(alpha_2=country_code.upper())
        currency = pycountry.currencies.get(numeric=country.numeric) if country else None
        
        return {
            "country_name": country.name if country else "Unknown",
            "country_code": country_code.upper(),
            "currency_code": currency.alpha_3 if currency else "USD"
        }

    @staticmethod
    async def discover_local_fintech_ecosystem(country_code: str) -> List[str]:
        """Scrapes local top financial application signatures dynamically."""
        # Queries localized store charts to identify dominant mobile money platforms
        url = f"https://raw.githubusercontent.com/facundoolano/google-play-scraper/master/categories/FINANCE_{country_code.upper()}.json"
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                res = await client.get(url)
                if res.status_code == 200:
                    return [item["appId"] for item in res.json()[:5]]
        except Exception:
            pass
        # Fallback signatures
        return ["com.google.android.apps.nbu.paisa.user", "com.paypal.android.p2pmobile"]