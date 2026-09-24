from engine.spatial_grid import SpatialGridResolver
from engine.continuous_engine import ContinuousRealityEngine

# Anchor query to Wuse Market, Abuja
node = SpatialGridResolver.resolve_anchor(lat=9.0627, lng=7.4664, query_name="Wuse Main Market, Abuja")
engine = ContinuousRealityEngine(s2_node=node)

metrics = engine.compute_instant_reality(
    s5p_no2=12.1,
    viirs_lux=24.5,
    truck_count=18,
    cell_rf_density=4850,
    acoustic_db=81.2,
    gateway_dns_bursts=640
)

print(f"\n--- STREET AI REALITY ENGINE [S2 Cell: {node.cell_id}] ---")
print(f"Active Contributors: {metrics.contributor_profile.total_active_population:,} people")
print(f"Buyers / Merchants:  {metrics.contributor_profile.active_buyers:,} / {metrics.contributor_profile.permanent_merchants:,}")
print(f"Total Cash Flow:     {metrics.currency} {metrics.total_volume_generated:,.2f}")
print(f"Physical Dark Cash:  {metrics.currency} {metrics.physical_cash_volume:,.2f}")
print(f"Digital / USSD Flow: {metrics.currency} {metrics.digital_ussd_volume:,.2f} ({metrics.digital_penetration_rate}%)")
print(f"Transaction Speed:   {metrics.velocity_tx_per_hour} tx/hr")
print(f"Street Price Markup: +{metrics.price_friction_markup}% vs formal retail\n")