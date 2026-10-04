import logging
import math
from typing import Dict, List, Tuple

logger = logging.getLogger("StreetAI.BuyerConversion")

class BuyerConversionEngine:
    """
    Filters raw pedestrian counts into transactional buyers based on 
    dwell kinetics and commercial proximity zones.
    """

    def __init__(self):
        # Dwell time thresholds in seconds
        self.min_transaction_dwell = 75   # 1.25 minutes minimum to transact
        self.max_transaction_dwell = 540  # 9 minutes maximum before flagged as loitering/sheltering
        self.transit_speed_cutoff = 1.0   # m/s (above this speed is transit commuter)

    def calculate_active_buyers(
        self,
        raw_headcount: int,
        dwell_distribution_mins: float,
        commodity: str,
        is_raining: bool = False
    ) -> Dict:
        """
        Calculates the true conversion rate and buyer headcount.
        """
        commodity_lower = commodity.lower()

        # 1. Parameterize conversion efficiency by typology
        if any(w in commodity_lower for w in ["suya", "food", "khat", "shawarma", "drink"]):
            decay_lambda = 0.0045
            min_dwell = 90
            max_dwell = 480
        elif any(w in commodity_lower for w in ["kombi", "danfo", "bus", "transport", "fare"]):
            decay_lambda = 0.0080
            min_dwell = 45
            max_dwell = 300
        elif any(w in commodity_lower for w in ["auto", "parts", "scrap", "textile", "gold"]):
            decay_lambda = 0.0020
            min_dwell = 180
            max_dwell = 1200
        else:
            decay_lambda = 0.0035
            min_dwell = 75
            max_dwell = 600

        dwell_seconds = dwell_distribution_mins * 60.0

        # 2. Environmental Shelter Correction
        if is_raining:
            # During rain, long dwell indicates shelter, not purchase intent
            dwell_validity_factor = 0.12
        else:
            if dwell_seconds < min_dwell:
                dwell_validity_factor = 0.05  # Mostly fast commuters
            elif min_dwell <= dwell_seconds <= max_dwell:
                dwell_validity_factor = 0.85  # Prime transactional queue
            else:
                dwell_validity_factor = 0.25  # Loiterers, hawkers, waiting drivers

        # 3. Poisson/Exponential conversion probability
        effective_dwell = max(0, dwell_seconds - min_dwell)
        raw_conversion = 1.0 - math.exp(-decay_lambda * effective_dwell)
        final_conversion_rate = max(0.02, min(0.92, raw_conversion * dwell_validity_factor))

        active_buyers = max(1, int(raw_headcount * final_conversion_rate))
        transit_pedestrians = int(raw_headcount * (1.0 - final_conversion_rate) * 0.7)
        loiterers = raw_headcount - active_buyers - transit_pedestrians

        logger.info(
            f"Conversion Filter: {raw_headcount:,} detected -> {active_buyers:,} confirmed buyers "
            f"({final_conversion_rate*100:.1f}% conversion at {dwell_distribution_mins:.1f}m dwell)"
        )

        return {
            "total_observed_footfall": raw_headcount,
            "active_buyers": active_buyers,
            "transit_pedestrians": transit_pedestrians,
            "passive_loiterers": loiterers,
            "conversion_rate": round(final_conversion_rate, 4),
            "dwell_efficiency_index": round(dwell_validity_factor, 2)
        }