import httpx
import logging
import asyncio

logger = logging.getLogger("StreetAI.Forex")

class LiveStreetForex:
    """Scrapes Binance P2P, with an automated proxy failover if blocked by regional ISPs."""
    
    def __init__(self):
        self.p2p_url = "https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search"
        # Unblocked global aggregator for parallel market fallback
        self.coingecko_url = "https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=ngn,inr,mxn,zar,kes,try,usd"
        
        self.fallbacks = {
            "NGN": 1680.0, "INR": 83.9, "MXN": 19.5, 
            "ZAR": 18.9, "KES": 130.0, "TRY": 34.2, "USD": 1.0
        }

    async def get_realtime_rate(self, country_code: str, local_currency: str) -> float:
        if local_currency == "USD": return 1.0

        # 1. Attempt Binance P2P (Will fail if ISP DNS blocks it)
        try:
            rate = await self._fetch_binance(local_currency)
            if rate: return rate
        except Exception as e:
            logger.warning("Binance P2P Blocked by ISP/DNS. Initiating failover routing...")

        # 2. Failover to Unblocked API (CoinGecko + Street Premium)
        try:
            rate = await self._fetch_coingecko(local_currency)
            if rate: return rate
        except Exception as e:
            logger.warning(f"Secondary FX API failed: {e}")

        # 3. Hard Fallback
        fallback_rate = self.fallbacks.get(local_currency, 1.0)
        logger.info(f"Using Offline Street FX Fallback: 1 USD = {fallback_rate:,.2f} {local_currency}")
        return fallback_rate

    async def _fetch_binance(self, fiat: str):
        payload = {"asset": "USDT", "fiat": fiat, "merchantCheck": False, "page": 1, "payTypes": [], "publisherType": None, "rows": 5, "tradeType": "SELL"}
        headers = {"User-Agent": "Mozilla/5.0", "Content-Type": "application/json"}
        async with httpx.AsyncClient() as client:
            res = await client.post(self.p2p_url, json=payload, headers=headers, timeout=3.0)
            if res.status_code == 200 and res.json().get("data"):
                best_rate = float(res.json()["data"][0]["adv"]["price"])
                logger.info(f"Live P2P FX Locked: 1 USD = {best_rate:,.2f} {fiat} (Binance)")
                return best_rate
        return None

    async def _fetch_coingecko(self, fiat: str):
        async with httpx.AsyncClient() as client:
            res = await client.get(self.coingecko_url, timeout=5.0)
            if res.status_code == 200:
                data = res.json()
                fiat_lower = fiat.lower()
                if "tether" in data and fiat_lower in data["tether"]:
                    best_rate = float(data["tether"][fiat_lower])
                    # Add 3% parallel market premium to official API aggregates
                    street_rate = best_rate * 1.03
                    logger.info(f"Live Proxy FX Locked: 1 USD = {street_rate:,.2f} {fiat} (Unblocked Aggregator + 3% Premium)")
                    return street_rate
        return None