import time
import requests
import json

# Define the endpoint for the local Uvicorn server
API_URL = "http://127.0.0.1:8000/api/v1/intelligence/scan"

# 10 Highly diverse, global, non-Nigeria locations and sectors
PROMPTS = [
    # 1. Mexico: Location Ecosystem (Multi-Sector)
    "Map the total daily cashflow of Mercado de la Merced in Mexico City.",
    
    # 2. Japan: Specific Commodity
    "What is the live capital velocity of wholesale seafood at Tsukiji Outer Market, Tokyo?",
    
    # 3. Thailand: Location Ecosystem (Multi-Sector)
    "Show me the overall liquidity and physical merchant density of Chatuchak Weekend Market in Bangkok.",
    
    # 4. South Korea: Specific Commodity
    "Calculate the current transactional volume of textiles at Dongdaemun Market, Seoul.",
    
    # 5. Vietnam: Location Ecosystem (Multi-Sector)
    "Map the live cashflow of Ben Thanh Market in Ho Chi Minh City.",
    
    # 6. Morocco: Specific Commodity
    "What is the active buyer conversion rate for spices in the Medina of Marrakesh?",
    
    # 7. Sri Lanka: Location Ecosystem (Multi-Sector)
    "Analyze the total daily transaction volume at Pettah Market, Colombo.",
    
    # 8. China: Specific Commodity
    "Show me the street liquidity for wholesale electronics in Huaqiangbei, Shenzhen.",
    
    # 9. Brazil: Location Ecosystem (Multi-Sector)
    "Map the cash velocity of Feira de São Cristóvão in Rio de Janeiro.",
    
    # 10. UK: Specific Commodity
    "What is the live capital velocity of antique goods at Portobello Road Market, London?"
]

def run_tests():
    print("\n🚀 Initializing Global Dynamic Intent Test Harness...\n")
    
    for i, prompt in enumerate(PROMPTS, 1):
        print("="*60)
        print(f"Test [{i}/10]")
        print(f"Prompt: \"{prompt}\"")
        print("="*60)
        
        start_time = time.time()
        
        try:
            # Fire the request to the concurrent backend pipeline
            response = requests.post(
                API_URL, 
                json={"prompt": prompt}, 
                timeout=45.0 # Safe 45-second timeout, though backend should finish in < 6s
            )
            
            elapsed = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                # If target is ambiguous, API safely handles it
                if data.get("status") == "AMBIGUOUS_TARGET":
                    print(f"⚠️ Result: AMBIGUOUS TARGET ({elapsed:.2f}s)")
                    print(f"Message: {data.get('message')}\n")
                    continue
                
                # Successfully locked target
                overview = data.get("city_overview", {})
                financials = data.get("financial_metrics", {})
                live_metrics = financials.get("live_deterministic", {})
                
                city = overview.get("city_name", "Unknown")
                lat = overview.get("lat", 0.0)
                lon = overview.get("lon", 0.0)
                
                currency = financials.get("local_currency", "USD")
                hourly_velocity = live_metrics.get("hourly_cash_velocity_local", 0.0)
                active_buyers = live_metrics.get("active_buyers_live", 0)
                
                print(f"✅ SUCCESS: Pipeline completed in {elapsed:.2f}s")
                print(f"📍 Location Locked: {city} ({lat}, {lon})")
                print(f"💰 Hourly Velocity: {currency} {hourly_velocity:,.2f}")
                print(f"🚶 Active Buyers: {active_buyers:,}\n")
                
            else:
                print(f"❌ HTTP Error {response.status_code}: {response.text}\n")
                
        except requests.exceptions.RequestException as e:
            print(f"🔥 Connection Failure: {e}\n")
            
        # Brief pause between test fires to let socket pool breathe
        time.sleep(2)

if __name__ == "__main__":
    run_tests()