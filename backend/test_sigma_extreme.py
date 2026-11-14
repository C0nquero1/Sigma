import time
import requests

API_URL = "http://127.0.0.1:8000/api/v1/intelligence/scan"

# 10 Brand-New Global Locations Covering All 6 Strategic Intent Categories
PROMPTS = [
    # 1. cashflow_location (Macro Liquidity)
    "Map the total daily cashflow and active merchant density of Grand Bazaar in Istanbul.",
    # 2. cashflow_location (Macro Liquidity)
    "Analyze the live street liquidity and total daily transaction volume at Alaba International Market in Lagos.",
    # 3. cashflow_commodity (Micro Liquidity)
    "What is the live capital velocity and wholesale lot pricing of gold jewelry at Dubai Gold Souk, Dubai?",
    # 4. cashflow_commodity (Micro Liquidity)
    "Calculate the current transactional volume and active buyer conversion rate for leather goods at Mercato Centrale in Florence.",
    # 5. market_expansion (Where to Sell & Routing)
    "Where is the highest-velocity street corridor and optimal routing to sell bulk textiles in Chandni Chowk, Old Delhi?",
    # 6. market_expansion (Where to Sell & Routing)
    "Identify the highest-converting merchant distribution nodes and logistics corridor for packaged foods at Gikomba Market in Nairobi.",
    # 7. demand_discovery (Commodity Discovery & Taxonomy)
    "Discover the top high-velocity product categories and empirical merchant taxonomy driving cashflow at Khan el-Khalili in Cairo.",
    # 8. demand_discovery (Commodity Discovery & Taxonomy)
    "What are the dominant wholesale commodity sectors and buyer demand patterns at Tanah Abang Market in Jakarta?",
    # 9. demand_discovery (When, Why, How & Friction Factors)
    "When are the peak buyer conversion windows and what environmental or payment friction factors impact trade at Merkato in Addis Ababa?",
    # 10. market_expansion (Where to Build / B2B Strategy & Saturation)
    "Evaluate the physical inventory saturation, B2B supply gaps, and where to build a wholesale distribution hub in Gamarra Commercial Emporium, Lima.",
]


def run_extreme_test():
    print("\n🚀 Initializing 6-Category Global Physical Reality Test Harness (10 Unseen Markets)...\n")
    passed = 0

    for idx, prompt in enumerate(PROMPTS, 1):
        print("=" * 72)
        print(f"Test [{idx}/{len(PROMPTS)}]")
        print(f'Prompt: "{prompt}"')
        print("=" * 72)

        t0 = time.time()
        try:
            res = requests.post(API_URL, json={"prompt": prompt}, timeout=60.0)
            elapsed = round(time.time() - t0, 2)

            if res.status_code == 200:
                data = res.json()
                city = data.get("city_overview", {})
                fin = data.get("financial_metrics", {})
                det = fin.get("live_deterministic", {})
                fx = fin.get("forex_telemetry", {})
                pm = fin.get("pricing_matrix", {})
                ml = fin.get("ml_projected", {})
                gt = data.get("structural_ground_truth", {})
                scope = gt.get("empirical_scope", {})
                cap = data.get("zonal_capacity", {})
                gw = data.get("digital_gateway", {})

                curr = fin.get("local_currency", "USD")
                passed += 1

                print(f"✅ STATUS: {data.get('status')} in {elapsed}s | Coordinate: ({city.get('lat')}, {city.get('lon')}) [{city.get('country_code')}]")
                print(f"🏛️  STRUCTURAL SCOPE: {gt.get('permanent_buildings_count')} Buildings | {scope.get('scoped_active_stalls', 0):,}/{gt.get('registered_stalls_complex', 0):,} Stalls ({gt.get('total_zone_economic_units', 0):,} Zone Units)")
                print(f"👥 FOOTFALL & BUYERS: {det.get('hourly_visitors_footfall', 0):,}/hr Visitors | {det.get('active_buyers_live', 0):,} Active Buyers Now ({det.get('hourly_converting_buyers', 0):,}/hr converting, {det.get('hourly_transactions_total', 0):,} buys/hr @ {det.get('physical_conversion_rate_pct')}% conv)")
                print(f"💵 PRICING & VELOCITY: {curr} {det.get('average_visitor_spend_local', 0):,.2f} Visitor Spend (Matrix: {curr} {pm.get('price', 0):,.2f}) | Hourly Velocity: {curr} {det.get('verified_velocity_floor_local', 0):,.2f}/hr | Daily Cashflow: {curr} {det.get('projected_daily_cashflow_local', 0):,.2f}/day")
                print(f"💱 STREET LIQUIDITY: 1 USD = {fx.get('street_rate', 0):,.2f} {curr} | Working-Capital & Orderbook Float: {curr} {fx.get('physical_liquidity_available', 0):,.2f}")
                print(f"📦 ZONAL INVENTORY: {cap.get('literal_commercial_footprint_sqm', 0):,.1f} sqm | Verified Stock: {cap.get('median_verified_physical_stock', 0):,} units | Port: {city.get('port_corridor')}")
                print(f"🏦 DIGITAL GATEWAY: {gw.get('mapped_cico_nodes')} CICO Nodes | Switch Latency: {gw.get('sovereign_switch_latency_ms')}ms | Rails: {', '.join(gw.get('discovered_local_rails', [])[:5])}")
                print(f"🧠 7-DAY ML FORECAST: R²={ml.get('r2_goodness_of_fit')} | Next 24h: {curr} {ml.get('next_24h_projected_hourly_velocity_local', 0):,.2f}/hr | 7d Cumulative: {curr} {ml.get('projected_7d_cumulative_cashflow_local', 0):,.2f}\n")
            else:
                print(f"❌ HTTP Error {res.status_code} ({elapsed}s): {res.text}\n")
        except Exception as e:
            print(f"🔥 Connection Failure ({round(time.time() - t0, 2)}s): {e}\n")

    print("=" * 72)
    print(f"🏁 TEST SUITE COMPLETE: {passed}/{len(PROMPTS)} Global Markets Locked.")
    print("=" * 72)


if __name__ == "__main__":
    run_extreme_test()