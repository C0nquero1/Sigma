import sys
import asyncio
if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

import httpx

BASE_URL = "http://127.0.0.1:8000/api/v1/intelligence"

# test_sigma_50_matrix.py
STRESS_PROMPTS = [
    # Vector 1: Night Economies & Street Food (Nocturnal Inversion)
    {"id": 1, "prompt": "Measure midnight cash turnover of suya and shawarma vendors along Wuse 2 Aminu Kano crescent Abuja."},
    {"id": 2, "prompt": "Live cash flow for street barbecue and tusker beer hawkers on Kenyatta Avenue Nairobi after 10 PM."},
    {"id": 3, "prompt": "Calculate nocturnal cash velocity of late-night taco stands near Tepito Mexico City."},
    {"id": 4, "prompt": "Real-time liquidity of balut and street skewers around Quiapo Church Manila at 1 AM."},
    {"id": 5, "prompt": "Estimate evening transaction rate of roadside fried plantain (dundu) vendors around Oshodi under-bridge Lagos."},
    {"id": 6, "prompt": "Hourly cash exchange of street food carts surrounding Khao San Road Bangkok between 11 PM and 3 AM."},
    {"id": 7, "prompt": "Track midnight cash flow for grilled meat and tea stalls near Al-Hussein square Cairo."},
    {"id": 8, "prompt": "Calculate nocturnal liquor and fast-food transactions outside Braamfontein nightclubs Johannesburg."},
    {"id": 9, "prompt": "Transaction rate of illegal late-night street food operators outside Shinjuku station Tokyo."},
    {"id": 10, "prompt": "Cash volume of midnight street fish fryers in Jamestown Accra."},

    # Vector 2: Specialized Wholesale & Industrial Scrap (Fat-Tail Basket Sizes)
    {"id": 11, "prompt": "Daily cash volume of scrapped Mercedes engine blocks and gearboxes moving through Ladipo Market Lagos."},
    {"id": 12, "prompt": "Wholesale textile bulk liquidity inside Gikomba second-hand clothes market Nairobi."},
    {"id": 13, "prompt": "Counterfeit luxury handbag and perfume cash turnover on Canal Street NYC."},
    {"id": 14, "prompt": "Precious metals and raw gold scrap cash velocity inside the alleys behind Grand Bazaar Istanbul."},
    {"id": 15, "prompt": "Bicycle and motorbike spare parts informal trade velocity in Chongwe market Lusaka."},
    {"id": 16, "prompt": "Informal construction timber and roofing sheet liquidity at Timber Market Marine Base Port Harcourt."},
    {"id": 17, "prompt": "Electronic scrap and e-waste copper recovery cash flow at Agbogbloshie Accra."},
    {"id": 18, "prompt": "Heavy truck tire retreading informal sales volume around Alaba International Market Ojo Lagos."},
    {"id": 19, "prompt": "Unregulated lithium battery salvaging transactions around Huaqiangbei alleys Shenzhen."},
    {"id": 20, "prompt": "Wholesale burlap sacks of raw ginger and dried pepper moving through Dawanau market Kano."},

    # Vector 3: Informal Mobility & Transport Interchanges (High Velocity, Micro-Baskets)
    {"id": 21, "prompt": "Micro-transaction density for unregulated kombi taxi loading and queue marshals at Bree Street Taxi Rank Jo'burg."},
    {"id": 22, "prompt": "Daily ticket revenue of Danfo conductors and agbero levies collected at Oshodi Bus Interchange Lagos."},
    {"id": 23, "prompt": "Boda-boda fare collection and fuel top-ups at Stage 2 Eastleigh Nairobi."},
    {"id": 24, "prompt": "Keke NAPEP daily passenger remittance around Nyanya bridge terminal Abuja."},
    {"id": 25, "prompt": "Tuk-tuk cash turnover and micro-bribes at Pyramids road hub Giza."},
    {"id": 26, "prompt": "Informal motorbike taxi (xe om) liquidity around Ben Thanh market Ho Chi Minh City."},
    {"id": 27, "prompt": "Informal microbus fares on Route 4 through Ciudad Neza Mexico."},
    {"id": 28, "prompt": "Jeepney fare aggregation along Epifanio de los Santos Avenue Manila."},
    {"id": 29, "prompt": "Tro-tro bus loading station daily cash collection at Circle Interchange Accra."},
    {"id": 30, "prompt": "Informal handcart pushers (Mkokoteni) daily haulage earnings inside Toi Market Nairobi."},

    # Vector 4: Unregulated Foreign Exchange & Remittance (High Capital, Near-Zero Dwell)
    {"id": 31, "prompt": "Black market bureau de change USD/NGN street cash turnover around Zone 4 Abuja Sheraton corridor."},
    {"id": 32, "prompt": "Informal Hawala cash settlement velocity in Eastleigh 1st Avenue Nairobi."},
    {"id": 33, "prompt": "Parallel market cash exchange rates and volume at Cueva financial stalls on Calle Florida Buenos Aires."},
    {"id": 34, "prompt": "Informal remittance and paper cash movement through Little India Singapore corridors."},
    {"id": 35, "prompt": "Street money changers swapping CFA Francs for Naira along Seme border corridor."},
    {"id": 36, "prompt": "Informal cross-border merchant transfers at Beitbridge border post Zimbabwe-South Africa."},
    {"id": 37, "prompt": "Gold-backed informal currency swaps operating in Deira spice souk Dubai."},
    {"id": 38, "prompt": "Underground US dollar cash exchanges operating in downtown Caracas Venezuela."},
    {"id": 39, "prompt": "Informal cross-border mobile money cashing points at Malaba border Uganda-Kenya."},
    {"id": 40, "prompt": "Parallel street forex volume swapping Euros for Dinars around Port Said square Algiers."},

    # Vector 5: Hyper-Local Slang, Dialects & Ambiguous Adversarial Scenarios
    {"id": 41, "prompt": "What is the cash turnover of kabu-kabu operators and pure water hawkers at Berger roundabout?"},
    {"id": 42, "prompt": "Track cash flow for 'tokunbo' electronics and second-hand generators in Computer Village Ikeja."},
    {"id": 43, "prompt": "Turnover of illicit miraa and muguka retail twigs on Juja road Nairobi."},
    {"id": 44, "prompt": "Estimate street revenue of 'okada' riders and roadside recharge card tables in Maraba boundary."},
    {"id": 45, "prompt": "How much vibranium is being traded in the underground markets of Wakanda today?"},  # Adversarial
    {"id": 46, "prompt": "Calculate daily transaction liquidity of street vendors on Main Street."},  # Ambiguous
    {"id": 47, "prompt": "Daily cash volume of counterfeit malaria medicine sold in Onitsha Head Bridge Market."},
    {"id": 48, "prompt": "Turnover of informal coal and charcoal sack distributors in Kibera Nairobi."},
    {"id": 49, "prompt": "Revenue of unlicensed street cartels selling smuggled petroleum in jerrycans along Badagry expressway."},
    {"id": 50, "prompt": "Transaction velocity of artisanal diamond panners selling raw carats along Kasai river market DRC."}
]

async def run_extreme_tests():
    async with httpx.AsyncClient(timeout=90.0) as client:
        print("🚀 Initializing Sigma Extreme Test Harness...\n")
        
        for idx, test in enumerate(STRESS_PROMPTS, 1):
            print(f"--------------------------------------------------")
            print(f"Test [{idx}/{len(STRESS_PROMPTS)}]")
            print(f"Prompt: \"{test['prompt']}\"")
            print(f"--------------------------------------------------")
            
            try:
                start_time = asyncio.get_event_loop().time()
                # Use json={"prompt": test["prompt"]} to match the FastAPI endpoint expectation
                response = await client.post(f"{BASE_URL}/scan", json={"prompt": test["prompt"]})
                duration = asyncio.get_event_loop().time() - start_time
                
                if response.status_code == 200:
                    data = response.json()
                    status = data.get("status")
                    print(f"Status: {status} (Resolved in {duration:.2f}s)")
                    
                    if status == "TARGET_LOCKED":
                        sp = data.get("spatial", {})
                        tp = data.get("temporal", {})
                        funnel = data.get("physical_funnel", {})
                        mkt = data.get("market_typology", {})
                        cash = data.get("cash_velocity", {})

                        print(f"  📍 Locked Location: {sp.get('location_name')} ({sp.get('country_code')})")
                        print(f"  ⬡ H3 Hex Cell ID:   {sp.get('h3_index')}")
                        print(f"  🕒 Local Time:      {tp.get('local_time')} [{tp.get('market_cycle')}]")
                        print(f"  🧠 Covariance:      {cash.get('covariance_factor')}")
                        print(f"  🛒 Typology:        {mkt.get('target_commodity')} -> {mkt.get('resolved_sku')} ({mkt.get('unit_price_local')} {mkt.get('unit_type')})")
                        print(f"  👥 Funnel Metrics:  {funnel.get('gross_pedestrian_flow')} observed -> {funnel.get('active_buyers_hourly')} buyers ({funnel.get('conversion_rate_pct')} conversion @ {funnel.get('observed_dwell_mins')}m dwell)")
                        print(f"  🏪 Active Stalls:   {funnel.get('physical_stalls')} detected")
                        print(f"  🔥 Live 1Hr Cash:   {cash.get('live_1hr_velocity')}")
                        print(f"  📈 24Hr Volume:     {cash.get('projected_24hr_volume')}")
                        print(f"  🚢 Routing Port:    {sp.get('port_corridor')}")
                        
                    elif status == "AMBIGUOUS_TARGET":
                        print(f"  ⚠️ Disambiguation Triggered: {data.get('message', 'Target too broad.')}")
                    else:
                        print(f"  ⚠️ Status Unknown: {data}")
                        
                else:
                    print(f"❌ HTTP Error {response.status_code}: {response.text}")
                    
            except Exception as e:
                print(f"🔥 Connection Failure: {e}")
                
            print("\n" + "-"*50)
            await asyncio.sleep(6) # Throttles to respect Groq/Overpass rate limits

if __name__ == "__main__":
    asyncio.run(run_extreme_tests())