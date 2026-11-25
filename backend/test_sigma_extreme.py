import json
import time
import requests

API_URL = "http://127.0.0.1:8000/api/v1/intelligence/scan"

# 30 Global Locations Across All 6 Strategic Intent Categories
# Mixes: Major Hubs, Regional Markets, Random Everyday Streets & Non-Market Neighborhoods
PROMPTS = [
    # === CATEGORY 1: cashflow_location (Macro Liquidity) ===
    ("cashflow_location", "Major Hub", "Map the total daily cashflow and active merchant density of Grand Bazaar in Istanbul."),
    ("cashflow_location", "Major Hub", "Analyze the live street liquidity and total daily transaction volume at Alaba International Market in Lagos."),
    ("cashflow_location", "Regional Hub", "Estimate the daily cashflow and active retail stall liquidity across Sabon Gari Market in Kano, Nigeria."),
    ("cashflow_location", "Random Street", "Measure street-level commercial cashflow and pedestrian trade velocity along Rue de la République in Marseille, France."),
    ("cashflow_location", "Random Neighborhood", "Analyze local retail liquidity and daily neighborhood spend around Narvarte Poniente along Avenida Universidad in Mexico City."),

    # === CATEGORY 2: cashflow_commodity (Micro Liquidity) ===
    ("cashflow_commodity", "Major Hub", "What is the live capital velocity and wholesale lot pricing of gold jewelry at Dubai Gold Souk, Dubai?"),
    ("cashflow_commodity", "Major Hub", "Calculate the current transactional volume and active buyer conversion rate for leather goods at Mercato Centrale in Florence."),
    ("cashflow_commodity", "Regional Street", "Track live retail pricing and hourly buyer turnover for batik textiles and street food along Jalan Malioboro in Yogyakarta, Indonesia."),
    ("cashflow_commodity", "Random Niche Street", "Measure automotive spare parts pricing and active merchant liquidity along Kirinyaga Road in Nairobi, Kenya."),
    ("cashflow_commodity", "Random Neighborhood", "Calculate daily specialty coffee and bakery cash velocity along Sonnenallee in Neukölln, Berlin, Germany."),

    # === CATEGORY 3: market_expansion (Where to Sell & Routing) ===
    ("market_expansion_routing", "Major Hub", "Where is the highest-velocity street corridor and optimal routing to sell bulk textiles in Chandni Chowk, Old Delhi?"),
    ("market_expansion_routing", "Major Hub", "Identify the highest-converting merchant distribution nodes and logistics corridor for packaged foods at Gikomba Market in Nairobi."),
    ("market_expansion_routing", "Suburban Corridor", "Map the highest-demand retail strip and delivery routing for consumer electronics along Spintex Road in Accra, Ghana."),
    ("market_expansion_routing", "Random Neighborhood", "Identify optimal street-level sales corridors for specialty groceries and artisan goods in Barrio Italia, Santiago, Chile."),
    ("market_expansion_routing", "Random Street", "Evaluate foot-traffic routing and local hardware retail demand along Old Kent Road in Southwark, London, United Kingdom."),

    # === CATEGORY 4: demand_discovery (Commodity Discovery & Taxonomy) ===
    ("demand_discovery_taxonomy", "Major Hub", "Discover the top high-velocity product categories and empirical merchant taxonomy driving cashflow at Khan el-Khalili in Cairo."),
    ("demand_discovery_taxonomy", "Major Hub", "What are the dominant wholesale commodity sectors and buyer demand patterns at Tanah Abang Market in Jakarta?"),
    ("demand_discovery_taxonomy", "Major Street (Pix BR)", "Analyze the dominant retail product mix and street-level buyer demand along Rua 25 de Março in São Paulo, Brazil."),
    ("demand_discovery_taxonomy", "Random Neighborhood", "Discover the primary commercial categories and evening retail economy driving trade in Poblacion, Makati, Manila, Philippines."),
    ("demand_discovery_taxonomy", "Random Street", "Map the dominant neighborhood business taxonomy and consumer demand along Westheimer Road in Montrose, Houston, Texas."),

    # === CATEGORY 5: demand_discovery (Peak Windows & Friction Factors) ===
    ("demand_discovery_friction", "Major Hub", "When are the peak buyer conversion windows and what environmental or payment friction factors impact trade at Merkato in Addis Ababa?"),
    ("demand_discovery_friction", "Transit Hub", "Analyze peak trading hours, commuter congestion friction, and cash-rail bottlenecks around Oshodi Market in Lagos, Nigeria."),
    ("demand_discovery_friction", "Mid-Tier Street", "What are the peak shopping hours and traffic or payment friction factors impacting retail along Commercial Street in Bengaluru, India."),
    ("demand_discovery_friction", "Random Neighborhood", "Identify peak footfall windows and street-level friction factors for independent retail in Shimokitazawa, Setagaya, Tokyo, Japan."),
    ("demand_discovery_friction", "Random Street", "Determine peak conversion hours and weather or mobility friction along Dundas Street West near Kensington in Toronto, Canada."),

    # === CATEGORY 6: market_expansion (Where to Build / B2B Strategy & Saturation) ===
    ("market_expansion_b2b", "Major Hub", "Evaluate the physical inventory saturation, B2B supply gaps, and where to build a wholesale distribution hub in Gamarra Commercial Emporium, Lima."),
    ("market_expansion_b2b", "Regional Industrial", "Assess wholesale footwear inventory saturation and B2B distribution opportunities at Ariaria International Market in Aba, Nigeria."),
    ("market_expansion_b2b", "Random Street", "Evaluate retail density, supply bottlenecks, and small-warehouse siting along Hoang Hoa Tham Street in Ba Dinh, Hanoi, Vietnam."),
    ("market_expansion_b2b", "Random Neighborhood", "Assess storefront saturation and local hospitality supply gaps along King Street in Newtown, Sydney, Australia."),
    ("market_expansion_b2b", "Urban Corridor", "Analyze retail density, FX spread friction, and B2B fulfillment opportunities along Calle Florida in Buenos Aires, Argentina."),
]


def run_extreme_test():
    print(f"\n🚀 Initializing 6-Category Global Physical Reality Test Harness ({len(PROMPTS)} Diverse Locations)...\n")
    passed = 0
    audit_records = []

    for idx, (category, tier, prompt) in enumerate(PROMPTS, 1):
        print("=" * 78)
        print(f"Test [{idx}/{len(PROMPTS)}] | {category} | {tier}")
        print(f'Prompt: "{prompt}"')
        print("=" * 78)

        t0 = time.time()
        try:
            # requests timeout tuple = (connect_timeout_sec, read_timeout_sec)
            res = requests.post(API_URL, json={"prompt": prompt}, timeout=(15.0, 120.0))
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
                pos = data.get("empirical_pos_receipt_telemetry", {})

                curr = fin.get("local_currency", "USD")
                passed += 1

                print(f"✅ STATUS: {data.get('status')} in {elapsed}s | Coord: ({city.get('lat')}, {city.get('lon')}) [{city.get('country_code')}]")
                print(f"🏛️  SCOPE: {gt.get('permanent_buildings_count')} Bldgs | {scope.get('scoped_active_stalls', 0):,}/{gt.get('registered_stalls_complex', 0):,} Stalls ({gt.get('total_zone_economic_units', 0):,} Zone Units)")
                print(f"👥 FLOW: {det.get('hourly_visitors_footfall', 0):,}/hr Visitors | {det.get('active_buyers_live', 0):,} Active Buyers ({det.get('hourly_converting_buyers', 0):,}/hr conv @ {det.get('physical_conversion_rate_pct')}%)")
                print(f"💵 VELOCITY: {curr} {det.get('average_visitor_spend_local', 0):,.2f} Spend (Matrix: {curr} {pm.get('price', 0):,.2f}, LiveCov={pm.get('live_data_coverage_pct')}%) | Daily: {curr} {det.get('projected_daily_cashflow_local', 0):,.2f}/day")
                print(f"💱 FOREX/OTC: 1 USD = {fx.get('street_rate', 0):,.2f} {curr} | Escrow: {curr} {fx.get('physical_liquidity_available', 0):,.2f} ({fx.get('active_market_makers_count', 0)} makers)")
                print(f"📦 CAPACITY: {cap.get('literal_commercial_footprint_sqm', 0):,.1f} sqm | Stock: {cap.get('median_verified_physical_stock', 0):,} units | Port: {city.get('port_corridor')}")
                print(f"🏦 GATEWAY: {gw.get('mapped_cico_nodes')} CICO | Switch: {gw.get('sovereign_switch_latency_ms')}ms | POS Anchor: {pos.get('basket_source', 'N/A')} ({pos.get('observed_basket_total_local')})")
                print(f"🧠 ML 7D: R²={ml.get('r2_goodness_of_fit')} | Next 24h: {curr} {ml.get('next_24h_projected_hourly_velocity_local', 0):,.2f}/hr | 7d: {curr} {ml.get('projected_7d_cumulative_cashflow_local', 0):,.2f}\n")

                audit_records.append({
                    "idx": idx,
                    "category": category,
                    "tier": tier,
                    "prompt": prompt,
                    "http_status": 200,
                    "elapsed_s": elapsed,
                    "lat": city.get("lat"),
                    "lon": city.get("lon"),
                    "country_code": city.get("country_code"),
                    "currency": curr,
                    "stalls_scoped": scope.get("scoped_active_stalls"),
                    "stalls_total": gt.get("registered_stalls_complex"),
                    "hourly_visitors": det.get("hourly_visitors_footfall"),
                    "active_buyers_live": det.get("active_buyers_live"),
                    "matrix_price": pm.get("price"),
                    "live_price_coverage_pct": pm.get("live_data_coverage_pct"),
                    "daily_cashflow_local": det.get("projected_daily_cashflow_local"),
                    "fx_rate": fx.get("street_rate"),
                    "otc_escrow_local": fx.get("physical_liquidity_available"),
                    "otc_makers": fx.get("active_market_makers_count"),
                    "cico_nodes": gw.get("mapped_cico_nodes"),
                    "pos_anchor_verified": pos.get("pos_anchor_verified"),
                    "pos_basket_local": pos.get("observed_basket_total_local"),
                })
            else:
                print(f"❌ HTTP Error {res.status_code} ({elapsed}s): {res.text[:350]}\n")
                audit_records.append({
                    "idx": idx, "category": category, "tier": tier, "prompt": prompt,
                    "http_status": res.status_code, "elapsed_s": elapsed, "error": res.text[:300],
                })
        except Exception as e:
            elapsed = round(time.time() - t0, 2)
            print(f"🔥 Connection Failure ({elapsed}s): {e}\n")
            audit_records.append({
                "idx": idx, "category": category, "tier": tier, "prompt": prompt,
                "http_status": 0, "elapsed_s": elapsed, "error": str(e),
            })

    with open("sigma_30_audit_report.json", "w", encoding="utf-8") as f:
        json.dump(audit_records, f, indent=2, ensure_ascii=False)

    print("=" * 78)
    print(f"🏁 30-LOCATION STRESS SUITE COMPLETE: {passed}/{len(PROMPTS)} Locked | Saved -> sigma_30_audit_report.json")
    print("=" * 78)


if __name__ == "__main__":
    run_extreme_test()