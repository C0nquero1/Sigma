from pydantic import BaseModel, Field
from typing import Dict, Any, Optional

# --- STRICT GRAPH NODES ---

class CommodityNode(BaseModel):
    id: str
    name: str
    base_usd_price: float
    volatility_index: float = 1.0
    import_dependency: float = 0.5

class MerchantClusterNode(BaseModel):
    s2_cell_token: str
    country_code: str
    foot_traffic_baseline: int
    median_dwell_mins: int
    acoustic_friction_db: float
    offline_transit_multiplier: float

# --- DETERMINISTIC ACTION EXECUTOR ---

class StreetAIOntology:
    """Executes rigid financial math based on empirical sensor inputs."""
    
    def __init__(self):
        # Global baseline conversion rates
        self.BASE_CONVERSION_RATE = 0.38
        self.IMPULSE_BUY_MULTIPLIER = 0.02  # +2% conversion per 10 mins of dwell over 20 mins

    def execute_liquidity_projection(
        self, 
        cluster: MerchantClusterNode, 
        commodity: CommodityNode, 
        grid_multiplier: float = 1.0
    ) -> Dict[str, Any]:
        
        # 1. Calculate Active Buyers
        dwell_bonus = max(0, (cluster.median_dwell_mins - 20) // 10) * self.IMPULSE_BUY_MULTIPLIER
        actual_conversion = min(0.85, self.BASE_CONVERSION_RATE + dwell_bonus)
        
        total_human_presence = int(cluster.foot_traffic_baseline * cluster.offline_transit_multiplier)
        active_buyers = int(total_human_presence * actual_conversion)
        
        # 2. Calculate Street Markup via Acoustic Friction
        # High background noise (haggling/crowds) indicates higher price elasticity
        acoustic_markup = 1.0 + (max(0, cluster.acoustic_friction_db - 60) / 200.0)
        final_basket_usd = commodity.base_usd_price * acoustic_markup * commodity.volatility_index

        # 3. Final Daily Gross Liquidty
        daily_gross_usd = active_buyers * final_basket_usd * grid_multiplier

        return {
            "daily_gross_usd": round(daily_gross_usd, 2),
            "active_buyers": active_buyers,
            "applied_markup_pct": round((acoustic_markup - 1.0) * 100, 1),
            "conversion_rate_pct": round(actual_conversion * 100, 1),
            "total_human_presence": total_human_presence
        }