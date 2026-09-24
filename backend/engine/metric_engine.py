import logging
from typing import Dict, Any

logger = logging.getLogger("StreetAI.MetricEngine")

class MetricExecutionEngine:
    """Deterministic spatial calculator mimicking Palantir/SafeGraph analytics."""
    
    CADENCE_MULTIPLIERS = {
        "HOURLY": 1 / 12.0, # Assuming 12 active commercial hours
        "DAILY": 1.0,
        "WEEKLY": 7.0,
        "ANNUALLY": 365.0
    }

    # Baseline informal unit basket values (USD) per sector
    BASKET_BENCHMARKS = {
        "sugar": 1.85,
        "rubber": 4.20,
        "electronics": 22.50,
        "groceries": 3.10,
        "textiles": 8.50,
        "food": 2.20,
        "default": 2.50
    }

    @classmethod
    def execute_plan(cls, plan, telemetry_data: Dict[str, Any], spatial_density: int) -> Dict[str, Any]:
        """Calculates volume, split, and velocity deterministically."""
        
        # 1. Determine base basket size in strict USD
        commodity_key = (getattr(plan, "target_commodity", "default") or "default").lower()
        unit_basket = cls.BASKET_BENCHMARKS.get(commodity_key, cls.BASKET_BENCHMARKS["default"])
        
        # Adjust basket size if objective is high-yield projection
        query_obj = getattr(plan, "query_objective", "")
        if query_obj == "PROJECT_REVENUE":
            unit_basket *= 1.15 
            
        cadence_val = getattr(plan, "cadence", "daily").upper()
        multiplier = cls.CADENCE_MULTIPLIERS.get(cadence_val, 1.0)

        # 2. Grounded Palantir-Style Metric Tree
        # In informal corridors, typically 8% - 15% of total foot traffic actively transacts
        conversion_rate = 0.12
        active_buyers = max(int(spatial_density * conversion_rate), 150)
        
        # 35% velocity markup for multi-hop street trade
        daily_gross_usd = active_buyers * unit_basket * 1.35
        scaled_gross_usd = daily_gross_usd * multiplier

        # 3. Dynamic digital penetration based on actual telemetry (DNS bursts)
        # Normalizing gateway DNS bursts to estimate mobile money / USSD pings
        dns_bursts = telemetry_data.get("gateway_dns_bursts", 400)
        
        # Base digital penetration in emerging cash-heavy markets hovers around 15-45%
        digital_ratio = min(0.65, max(0.15, dns_bursts / (active_buyers + 1)))

        digital_cash = scaled_gross_usd * digital_ratio
        physical_cash = scaled_gross_usd * (1.0 - digital_ratio)
        
        # Scale transaction count based on cadence
        scaled_velocity = int(active_buyers * multiplier) if multiplier >= 1.0 else active_buyers

        return {
            "gross_volume": round(scaled_gross_usd, 2),
            "digital_split_pct": round(digital_ratio * 100, 1),
            "digital_cash": round(digital_cash, 2),
            "physical_cash": round(physical_cash, 2),
            "tx_velocity": scaled_velocity,
            "active_buyers": active_buyers,
            "unit_basket_usd": round(unit_basket, 2)
        }