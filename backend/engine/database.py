import os
import logging
from supabase import create_client, Client

logger = logging.getLogger("StreetAI.Database")

class SupabaseLedger:
    def __init__(self):
        url = os.getenv("SUPABASE_URL", "")
        key = os.getenv("SUPABASE_KEY", "")
        self.client: Client = create_client(url, key) if url and key else None

    def log_reality_scan(self, s2_token: str, location: str, commodity: str, metrics: dict, taxonomy: dict):
        if not self.client:
            logger.warning("Supabase keys missing. Skipping time-series log.")
            return
            
        try:
            payload = {
                "s2_cell_id": s2_token,
                "location_name": location,
                "target_commodity": commodity,
                "total_liquidity_usd": metrics["daily_volume"],
                "physical_cash_usd": metrics["physical_cash"],
                "digital_cash_usd": metrics["digital_cash"],
                "tx_velocity": metrics["velocity"],
                "formal_spread_markup": metrics["markup"],
                "active_contributors": taxonomy["active_contributors"]
            }
            self.client.table("street_intelligence_logs").insert(payload).execute()
        except Exception as e:
            logger.error(f"Time-series logging failed: {e}")

    def get_historical_velocity(self, s2_token: str, limit: int = 7) -> list:
        if not self.client:
            return []
        try:
            response = self.client.table("street_intelligence_logs")\
                .select("scanned_at, total_liquidity_usd, tx_velocity")\
                .eq("s2_cell_id", s2_token)\
                .order("scanned_at", desc=True)\
                .limit(limit)\
                .execute()
            return response.data
        except Exception as e:
            logger.error(f"Failed to fetch time-series history: {e}")
            return []