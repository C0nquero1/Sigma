import os
import time
import httpx
import logging
import asyncio
from typing import Optional, List, Dict, Any, Tuple
from engine.resilience_bus import EnterpriseResilienceBus

logger = logging.getLogger("StreetAI.Forex")


class LiveStreetForex:
    """
    100% Globally Dynamic Physical Reality Forex & Liquidity Engine.
    - Queries Binance P2P + Bybit P2P OTC Orderbooks for live merchant clearing prices & ad liquidity.
    - Queries CoinGecko Live 24h Fiat/Tether & USDC Volume (`include_24hr_vol=true`) for real-time
      fiat orderbook turnover.
    - ZERO static multipliers (no `25000.0` or `1_000_000.0` constants).
    """
    def __init__(self, db_ledger=None):
        self.binance_p2p_url = "https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search"
        self.bybit_p2p_url = "https://api2.bybit.com/fiat/otc/item/online"
        self.coingecko_url = "https://api.coingecko.com/api/v3/simple/price"
        self.open_er_url = "https://open.er-api.com/v6/latest/USD"
        self.cdn_fx_url = "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json"
        self.db_ledger = db_ledger
        self._rate_memory: Dict[str, Tuple[float, float]] = {}
        self.bus = EnterpriseResilienceBus()
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }

    async def _query_binance_p2p(self, fiat: str) -> Tuple[Optional[float], float, List[str]]:
        payload = {
            "fiat": fiat,
            "page": 1,
            "rows": 10,
            "tradeType": "BUY",
            "asset": "USDT",
            "countries": [],
            "payTypes": [],
            "publisherType": None
        }
        methods = set()
        try:
            async with httpx.AsyncClient(timeout=5.5, headers=self.headers) as client:
                res = await client.post(self.binance_p2p_url, json=payload)
                if res.status_code == 200:
                    ads = res.json().get("data", [])
                    if ads:
                        prices = []
                        total_liq = 0.0
                        for ad in ads:
                            adv = ad.get("adv", {})
                            p = float(adv.get("price", 0.0) or 0.0)
                            surplus = float(adv.get("surplusAmount", 0.0) or 0.0)
                            if p > 0:
                                prices.append(p)
                                total_liq += surplus * p
                            for m in adv.get("tradeMethods", []):
                                ident = m.get("tradeMethodName") or m.get("identifier")
                                if ident:
                                    methods.add(str(ident))
                        if prices:
                            return prices[0], round(total_liq, 2), list(methods)
        except Exception as e:
            logger.debug(f"Binance P2P scan degraded for {fiat}: {e}")
        return None, 0.0, list(methods)

    async def _query_bybit_p2p(self, fiat: str) -> Tuple[Optional[float], float, List[str]]:
        payload = {
            "userId": "",
            "tokenId": "USDT",
            "currencyId": fiat,
            "payment": [],
            "side": "1",
            "size": "10",
            "page": "1",
            "amount": ""
        }
        methods = set()
        try:
            async with httpx.AsyncClient(timeout=5.5, headers=self.headers) as client:
                res = await client.post(self.bybit_p2p_url, json=payload)
                if res.status_code == 200:
                    items = res.json().get("result", {}).get("items", [])
                    if items:
                        prices = []
                        total_liq = 0.0
                        for item in items:
                            p = float(item.get("price", 0.0) or 0.0)
                            qty = float(item.get("lastQuantity", 0.0) or 0.0)
                            if p > 0:
                                prices.append(p)
                                total_liq += qty * p
                            for pm in item.get("payments", []):
                                methods.add(f"PaymentRail_{pm}")
                        if prices:
                            return prices[0], round(total_liq, 2), list(methods)
        except Exception as e:
            logger.debug(f"Bybit P2P scan degraded for {fiat}: {e}")
        return None, 0.0, list(methods)

    async def _fetch_coingecko_rate_and_live_volume(self, fiat: str) -> Tuple[Optional[float], float]:
        """
        Extracts both the exact USDT/Fiat spot rate AND the literal 24-hour trading volume
        in that currency (`{fiat}_24h_vol`) directly from CoinGecko's live market ticker.
        """
        f_low = fiat.lower()
        params = {
            "ids": "tether,usd-coin",
            "vs_currencies": f"{f_low},usd",
            "include_24hr_vol": "true"
        }
        try:
            async with httpx.AsyncClient(timeout=5.5) as client:
                res = await client.get(self.coingecko_url, params=params)
                if res.status_code == 200:
                    data = res.json()
                    tether = data.get("tether", {})
                    usdc = data.get("usd-coin", {})
                    rate = float(tether.get(f_low, 0.0) or usdc.get(f_low, 0.0))
                    vol_24h_local = float(tether.get(f"{f_low}_24h_vol", 0.0)) + float(usdc.get(f"{f_low}_24h_vol", 0.0))
                    # Hourly active liquidity pool in target currency across instant settlement books
                    hourly_pool_local = round(vol_24h_local / 24.0, 2) if vol_24h_local > 0 else 0.0
                    if rate > 0:
                        return rate, hourly_pool_local
        except Exception as e:
            logger.debug(f"CoinGecko live volume ticker degraded for {fiat}: {e}")
        return None, 0.0

    async def _fetch_fallback_spot_rate(self, fiat: str) -> Tuple[Optional[float], str]:
        f_up = fiat.upper()
        f_low = fiat.lower()
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.get(self.open_er_url)
                if res.status_code == 200:
                    rates = res.json().get("rates", {})
                    if f_up in rates and float(rates[f_up]) > 0:
                        return float(rates[f_up]), "Open-ER Live Interbank Feed"
        except Exception:
            pass

        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.get(self.cdn_fx_url)
                if res.status_code == 200:
                    usd_rates = res.json().get("usd", {})
                    if f_low in usd_rates and float(usd_rates[f_low]) > 0:
                        return float(usd_rates[f_low]), "Global Currency Live Spot Ledger"
        except Exception:
            pass

        return None, ""

    async def get_realtime_rate(self, country_code: str, local_currency: str, lat: float, lon: float) -> Dict[str, Any]:
        fiat = local_currency.upper().strip()

        # Fire Binance P2P, Bybit P2P, and CoinGecko Live 24h Volume concurrently
        (bin_price, bin_liq, bin_methods), (byb_price, byb_liq, byb_methods), (cg_rate, cg_hourly_liq) = await asyncio.gather(
            self._query_binance_p2p(fiat),
            self._query_bybit_p2p(fiat),
            self._fetch_coingecko_rate_and_live_volume(fiat)
        )

        discovered_methods = list(dict.fromkeys(bin_methods + byb_methods))
        p2p_price = bin_price or byb_price
        p2p_liquidity = round(bin_liq + byb_liq, 2)

        best_rate = 0.0
        available_fiat_liquidity = 0.0
        provenance = ""

        if p2p_price and p2p_price > 0:
            best_rate = p2p_price
            available_fiat_liquidity = p2p_liquidity if p2p_liquidity > 0 else cg_hourly_liq
            provenance = f"Live P2P Orderbook Depth ({len(discovered_methods)} active payment rails)"
        elif cg_rate and cg_rate > 0:
            best_rate = cg_rate
            available_fiat_liquidity = cg_hourly_liq
            provenance = "Live CoinGecko USDT/USDC 24h Orderbook Turnover"
        else:
            spot_rate, spot_prov = await self._fetch_fallback_spot_rate(fiat)
            if not spot_rate or spot_rate <= 0:
                if fiat == "USD":
                    spot_rate, spot_prov = 1.0, "USD Sovereign Base"
                else:
                    raise RuntimeError(f"CRITICAL LOSS OF TELEMETRY: All P2P & FX sensors unreachable for {fiat}. Halting.")
            best_rate = spot_rate
            available_fiat_liquidity = cg_hourly_liq
            provenance = spot_prov

        current_time = time.time()
        if fiat in self._rate_memory:
            _, old_rate = self._rate_memory[fiat]
            if old_rate > 0:
                delta_pct = ((best_rate - old_rate) / old_rate) * 100.0
                if abs(delta_pct) > 0.0:
                    logger.info(f"Physical Liquidity Shift: {fiat} shifted {delta_pct:+.2f}% on the live ledger.")
                    if self.db_ledger:
                        asyncio.create_task(self.db_ledger.log_physical_anomaly(f"REGION_{country_code}", delta_pct))

        self._rate_memory[fiat] = (current_time, best_rate)
        logger.info(
            f"💱 FX & Liquidity Locked: 1 USD = {best_rate:,.2f} {fiat} | "
            f"Live Orderbook Liquidity: {available_fiat_liquidity:,.2f} {fiat} | {provenance}"
        )

        return {
            "clearing_price": best_rate,
            "physical_liquidity_available": available_fiat_liquidity,
            "active_networks_detected": discovered_methods,
            "provenance": provenance
        }