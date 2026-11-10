from typing import Dict, Any


def build_overview_ui(
    plan: Any,
    metrics_payload: Dict[str, Any],
    gateway_payload: Dict[str, Any],
    local_currency: str
) -> Dict[str, Any]:
    """
    100% Physical Reality UI Compiler.
    Formats live multi-sector cash velocity, active buyer conversion kinematics,
    and digital liquidity gateway telemetry for the frontend presentation layer.
    """
    curr = (local_currency or "USD").upper()
    hourly_vel = float(metrics_payload.get("verified_velocity_floor_local", 0.0))
    daily_cashflow = float(metrics_payload.get("projected_daily_cashflow_local", round(hourly_vel * 9.5, 2)))
    active_buyers = int(metrics_payload.get("active_buyers_live", 0))
    hourly_buyers = int(metrics_payload.get("hourly_transacting_buyers", 0))
    conv_rate = float(metrics_payload.get("physical_conversion_rate_pct", 0.0))
    dwell_mins = float(metrics_payload.get("commercial_dwell_time_minutes", 0.0))
    transit_mins = float(metrics_payload.get("pure_transit_time_minutes", 0.0))
    mpos_nodes = int(metrics_payload.get("physical_mpos_nodes", 0))
    unit_price = float(metrics_payload.get("median_unit_price_local", 0.0))
    sector_matrix = metrics_payload.get("sector_revenue_matrix", [])

    cico_nodes = int(gateway_payload.get("mapped_cico_nodes", 0))
    digital_nets = int(gateway_payload.get("active_digital_networks", 0))
    switch_ms = float(gateway_payload.get("sovereign_switch_latency_ms", 0.0))
    gateway_status = gateway_payload.get("gateway_status", "MIXED_FIAT_DIGITAL_ZONE")
    local_rails = gateway_payload.get("discovered_local_rails", [])

    commodity_label = getattr(getattr(plan, "economic", None), "primary_commodity", "general_merchandise")
    scope_mode = "MULTI_SECTOR_LOCATION_ECOSYSTEM" if len(sector_matrix) > 1 or commodity_label == "general_merchandise" else "SPECIFIC_COMMODITY"

    return {
        "scope_mode": scope_mode,
        "headline_metrics": {
            "hourly_cash_velocity_formatted": f"{curr} {hourly_vel:,.2f}/hr",
            "projected_daily_cashflow_formatted": f"{curr} {daily_cashflow:,.2f}/day",
            "active_buyers_right_now": active_buyers,
            "hourly_transacting_buyers": hourly_buyers,
            "physical_conversion_rate": f"{conv_rate:.1f}%",
            "weighted_clearing_ticket": f"{curr} {unit_price:,.2f}"
        },
        "conversion_kinematics": {
            "commercial_dwell_time_minutes": dwell_mins,
            "pure_osrm_transit_time_minutes": transit_mins,
            "excess_commercial_engagement_minutes": round(max(0.0, dwell_mins - transit_mins), 2),
            "verified_mpos_terminals": mpos_nodes
        },
        "sector_revenue_breakdown": sector_matrix,
        "digital_liquidity_infrastructure": {
            "gateway_status": gateway_status,
            "mapped_cico_nodes": cico_nodes,
            "discovered_local_payment_rails": local_rails,
            "active_wireless_networks": digital_nets,
            "sovereign_switch_latency_ms": switch_ms
        }
    }