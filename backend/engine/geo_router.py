from pydantic import BaseModel
from typing import Set

class RegionalContext(BaseModel):
    currency_code: str
    formal_parity_ratio: float
    fintech_bundles: Set[str]
    primary_classifieds_url: str
    search_path: str

class GeoContextRouter:
    """Dynamically routes ingestion engines to the correct regional data sources."""
    
    REGIONS = {
        # West Africa
        "NG": RegionalContext(
            currency_code="NGN", formal_parity_ratio=1.12,
            fintech_bundles={"com.opay.app", "com.moniepoint.agent", "com.palmpay.app"},
            primary_classifieds_url="https://jiji.ng", search_path="/search?query="
        ),
        "GH": RegionalContext(
            currency_code="GHS", formal_parity_ratio=1.15,
            fintech_bundles={"com.mtn.mobilemoney", "com.vodafone.cash", "com.opay.app"},
            primary_classifieds_url="https://jiji.com.gh", search_path="/search?query="
        ),
        # East Africa
        "KE": RegionalContext(
            currency_code="KES", formal_parity_ratio=1.08,
            fintech_bundles={"com.safaricom.mpesa", "com.airtel.money"},
            primary_classifieds_url="https://jiji.co.ke", search_path="/search?query="
        ),
        # South Asia
        "IN": RegionalContext(
            currency_code="INR", formal_parity_ratio=1.05,
            fintech_bundles={"com.paytm.pg", "com.phonepe.app", "com.google.android.apps.nbu.paisa.user"},
            primary_classifieds_url="https://www.olx.in", search_path="/items/q-"
        ),
        # LATAM
        "BR": RegionalContext(
            currency_code="BRL", formal_parity_ratio=1.10,
            fintech_bundles={"com.mercadolibre", "com.nu.production", "com.picpay"},
            primary_classifieds_url="https://lista.mercadolivre.com.br", search_path="/"
        )
    }

    @classmethod
    def get_context(cls, country_code: str) -> RegionalContext:
        # Default to West Africa (NG) if region is unknown or unsupported
        return cls.REGIONS.get(country_code.upper(), cls.REGIONS["NG"])