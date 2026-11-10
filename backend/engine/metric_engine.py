import math
import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger("StreetAI.MetricEngine")


class MetricExecutionEngine:
    """
    100% Physical Reality Metric & Multi-Sector Conversion Kinematics Engine.
    Computes live Active Buyers, Hourly Cash Velocity, Daily Cashflow, and
    Sector-by-Sector Revenue Attribution from physical sensor telemetry.
    """

    @classmethod
    def execute_plan(
        cls,
        exact_unit_price: float,
        active_mpos_hardware: int,
        rf_devices_detected: int = 0,
        dwell_time_minutes: float = 0.0,
        foot_velocity_kmh: float = 4.8,
        structural_multiplier: float = 1.0,
        temporal_density_index: int = 50,
        is_daylight: bool = True,
        sector_breakdown: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        # 1. Pure Pedestrian Transit Time across the 250m market sector at OSRM kinematic foot speed
        safe_foot_kmh = max(1.5, foot_velocity_kmh)
        pure_transit_minutes = (0.25 / safe_foot_kmh) * 60.0

        # 2. Physical Dwell Conversion Probability (Excess commercial engagement time vs transit time)
        if dwell_time_minutes > pure_transit_minutes:
            excess_commercial_minutes = dwell_time_minutes - pure_transit_minutes
            dwell_conversion_rate = min(0.65, (excess_commercial_minutes / dwell_time_minutes) * 0.55)
        else:
            dwell_conversion_rate = 0.08

        # 3. Temporal & Solar Activity Factor
        temporal_factor = max(0.10, (temporal_density_index / 100.0)) * (1.0 if is_daylight else 0.35)

        # 4. Live Active Buyers inside the commercial polygon right now
        effective_crowd = max(rf_devices_detected, active_mpos_hardware * 3)
        active_buyers_live = int(
            round(effective_crowd * dwell_conversion_rate * max(0.25, structural_multiplier) * temporal_factor)
        )
        active_buyers_live = max(active_buyers_live, int(round(active_mpos_hardware * temporal_factor)))

        # 5. Hourly Buyer Turnover Waves (60 mins / average commercial dwell time)
        effective_dwell = max(6.0, dwell_time_minutes)
        hourly_turnover_cycles = 60.0 / effective_dwell
        hourly_transacting_buyers = int(round(active_buyers_live * hourly_turnover_cycles))

        # 6. Multi-Sector Cashflow Decomposition (if multiple sectors are active in location-wide queries)
        sector_cashflows: List[Dict[str, Any]] = []
        if sector_breakdown:
            for s in sector_breakdown:
                w = float(s.get("weight", 1.0))
                s_price = float(s.get("median_clearing_price_local", exact_unit_price))
                s_buyers_hr = int(round(hourly_transacting_buyers * w))
                s_hourly_rev = round(s_buyers_hr * s_price, 2)
                sector_cashflows.append({
                    "sector_name": s.get("sector_name"),
                    "representative_sku": s.get("search_item"),
                    "storefront_weight_pct": round(w * 100.0, 1),
                    "unit_clearing_price_local": s_price,
                    "hourly_buyers": s_buyers_hr,
                    "hourly_cash_velocity_local": s_hourly_rev,
                    "daily_cashflow_local": round(s_hourly_rev * 9.5, 2)
                })

        # 7. Total Location or Specific Commodity Cash Velocity
        mpos_hourly_floor_local = round(active_mpos_hardware * exact_unit_price * temporal_factor, 2)
        hourly_cash_velocity_local = (
            round(sum(s["hourly_cash_velocity_local"] for s in sector_cashflows), 2)
            if sector_cashflows
            else round(hourly_transacting_buyers * exact_unit_price, 2)
        )
        verified_velocity_floor_local = max(mpos_hourly_floor_local, hourly_cash_velocity_local)
        projected_daily_cashflow_local = round(verified_velocity_floor_local * 9.5, 2)

        logger.info(
            f"💰 Physical Cash Velocity Locked | Active Buyers Now: {active_buyers_live:,} "
            f"({hourly_transacting_buyers:,}/hr at {dwell_time_minutes:.1f}m dwell, {dwell_conversion_rate*100:.1f}% conv) | "
            f"Hourly Velocity: {verified_velocity_floor_local:,.2f} | Daily Cashflow: {projected_daily_cashflow_local:,.2f} "
            f"across {len(sector_cashflows) or 1} active sector(s)"
        )

        return {
            "verified_velocity_floor_local": verified_velocity_floor_local,
            "hourly_cash_velocity_local": hourly_cash_velocity_local,
            "projected_daily_cashflow_local": projected_daily_cashflow_local,
            "active_buyers_live": active_buyers_live,
            "hourly_transacting_buyers": hourly_transacting_buyers,
            "physical_conversion_rate_pct": round(dwell_conversion_rate * 100.0, 2),
            "pure_transit_time_minutes": round(pure_transit_minutes, 2),
            "commercial_dwell_time_minutes": round(dwell_time_minutes, 2),
            "physical_mpos_nodes": active_mpos_hardware,
            "median_unit_price_local": round(exact_unit_price, 2),
            "sector_revenue_matrix": sector_cashflows
        }