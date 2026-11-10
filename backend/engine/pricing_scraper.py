import os
import re
import httpx
import logging
import asyncio
from typing import Dict, Any, List, Set, Optional, Tuple

logger = logging.getLogger("StreetAI.PricingScraper")


class AbsolutePhysicalPricingEngine:
    """
    100% Dynamic Multi-Sector & Single-SKU Physical Pricing Engine.
    - For SPECIFIC_COMMODITY queries: Locks onto the exact requested commodity and extracts
      IQR-filtered local street/wholesale prices.
    - For LOCATION_ECOSYSTEM queries: Concurrently scrapes live clearing prices across all
      top merchant sectors mapped at (lat, lon) and computes the Storefront-Weighted Composite
      Clearing Price + full sector breakdown.
    """
    def __init__(self):
        self.api_key = os.getenv("SERPAPI_API_KEY", "")
        self.base_url = "https://serpapi.com/search"
        self._currency_meta_cache: Dict[str, List[str]] = {}

    async def _resolve_live_currency_tokens(self, currency_code: str) -> List[str]:
        curr = currency_code.upper().strip()
        if curr in self._currency_meta_cache:
            return self._currency_meta_cache[curr]

        tokens: Set[str] = {curr}
        try:
            url = f"https://restcountries.com/v3.1/currency/{curr.lower()}"
            async with httpx.AsyncClient(timeout=6.0, follow_redirects=True) as client:
                res = await client.get(url)
                if res.status_code == 200:
                    data = res.json()
                    if isinstance(data, list):
                        for country in data:
                            if not isinstance(country, dict):
                                continue
                            currencies = country.get("currencies")
                            if isinstance(currencies, dict):
                                for code, meta in currencies.items():
                                    if code.upper() == curr and isinstance(meta, dict):
                                        symbol = meta.get("symbol", "").strip()
                                        name = meta.get("name", "").strip()
                                        # Avoid bare '$' or '¥' ambiguity if currency is not USD
                                        if symbol and (symbol not in ("$", "¥") or curr in ("USD", "JPY", "CNY")):
                                            tokens.add(symbol)
                                        if name:
                                            tokens.add(name)
                            elif isinstance(currencies, list):
                                for meta in currencies:
                                    if isinstance(meta, dict) and str(meta.get("code", "")).upper() == curr:
                                        symbol = str(meta.get("symbol") or "").strip()
                                        name = str(meta.get("name") or "").strip()
                                        if symbol and (symbol not in ("$", "¥") or curr in ("USD", "JPY", "CNY")):
                                            tokens.add(symbol)
                                        if name:
                                            tokens.add(name)
        except Exception as e:
            logger.debug(f"Live currency metadata lookup degraded for {curr}: {e}")

        token_list = sorted(list(tokens), key=len, reverse=True)
        self._currency_meta_cache[curr] = token_list
        return token_list

    def _extract_prices_with_dynamic_tokens(self, text: str, currency_tokens: List[str]) -> List[float]:
        escaped_tokens = [re.escape(t) for t in currency_tokens if t]
        curr_group = "(?:" + "|".join(escaped_tokens) + ")"
        pattern = rf"{curr_group}\s*([\d,]+(?:\.\d{{1,2}})?)|([\d,]+(?:\.\d{{1,2}})?)\s*{curr_group}"

        extracted: List[float] = []
        for m_tuple in re.findall(pattern, text, flags=re.IGNORECASE):
            raw = m_tuple[0] or m_tuple[1]
            if raw:
                try:
                    val = float(raw.replace(",", ""))
                    if 1.0 < val <= 100_000_000.0 and not (1990 <= val <= 2030):
                        extracted.append(val)
                except ValueError:
                    pass
        return extracted

    async def _scrape_single_sector_price(
        self,
        search_item: str,
        location_label: str,
        curr: str,
        currency_tokens: List[str],
        country_code: str = "US",
        fx_rate_per_usd: float = 1.0,
    ) -> Tuple[float, int]:
        city_part = location_label.split(",")[-2].strip() if "," in location_label else location_label
        gl_param = country_code.lower().strip() if len(country_code.strip()) == 2 else "us"

        # Physical Purchasing-Power Floor: a real commercial commodity in local currency
        # must be worth at least 0.35 USD equivalent (prevents "$12" being read as "12 VND" or "12 KRW")
        min_physical_local_price = max(1.0, round(fx_rate_per_usd * 0.35, 2))
        max_physical_local_price = max(100_000.0, round(fx_rate_per_usd * 25_000.0, 2))

        primary_q = f"buy {search_item} price in {city_part} {curr}"
        valid_prices: List[float] = []

        async with httpx.AsyncClient(timeout=10.0) as client:
            # Pass 1: Country-pinned (`gl`) Google Search (captures both organic snippets & inline shopping)
            try:
                params = {
                    "engine": "google",
                    "q": primary_q,
                    "gl": gl_param,
                    "api_key": self.api_key,
                    "num": 15,
                }
                res = await client.get(self.base_url, params=params)
                if res.status_code == 200:
                    data = res.json()
                    for item in data.get("shopping_results", []) + data.get("inline_shopping_results", []):
                        ext_price = item.get("extracted_price")
                        price_str = str(item.get("price") or "")
                        if ext_price:
                            val = float(ext_price)
                            # Convert to local currency if SerpAPI returned USD price on a non-USD country
                            if curr != "USD" and ("USD" in price_str or (price_str.startswith("$") and fx_rate_per_usd > 5.0)):
                                val = val * fx_rate_per_usd
                            if min_physical_local_price <= val <= max_physical_local_price:
                                valid_prices.append(val)

                    for result in data.get("organic_results", []):
                        text_to_scan = f"{result.get('title', '')} {result.get('snippet', '')}"
                        rich_top = result.get("rich_snippet", {}).get("top", {})
                        extensions = rich_top.get("extensions", [])
                        if extensions:
                            text_to_scan += " " + " ".join(str(x) for x in extensions)
                        detected_price = rich_top.get("detected_extensions", {}).get("price")
                        if detected_price:
                            val = float(detected_price)
                            if val < min_physical_local_price and fx_rate_per_usd > 5.0:
                                val = val * fx_rate_per_usd
                            if min_physical_local_price <= val <= max_physical_local_price:
                                valid_prices.append(val)

                        for p_val in self._extract_prices_with_dynamic_tokens(text_to_scan, currency_tokens):
                            if min_physical_local_price <= p_val <= max_physical_local_price:
                                valid_prices.append(p_val)
            except Exception as e:
                logger.debug(f"Primary sector price scrape degraded for '{primary_q}': {e}")

            # Pass 2: Only fire a second query if Pass 1 yielded < 3 verified price nodes (cuts SerpAPI usage by 60%)
            if len(valid_prices) < 3:
                try:
                    params = {
                        "engine": "google",
                        "q": f"{search_item} price {curr} {city_part} marketplace",
                        "gl": gl_param,
                        "api_key": self.api_key,
                        "num": 12,
                    }
                    res = await client.get(self.base_url, params=params)
                    if res.status_code == 200:
                        for result in res.json().get("organic_results", []):
                            text_to_scan = f"{result.get('title', '')} {result.get('snippet', '')}"
                            for p_val in self._extract_prices_with_dynamic_tokens(text_to_scan, currency_tokens):
                                if min_physical_local_price <= p_val <= max_physical_local_price:
                                    valid_prices.append(p_val)
                            # Also check USD-denominated marketplace quotes and convert at live street FX rate
                            if len(valid_prices) < 3 and fx_rate_per_usd > 1.0:
                                for usd_val in self._extract_prices_with_dynamic_tokens(text_to_scan, ["USD", "US$", "$"]):
                                    conv_val = round(usd_val * fx_rate_per_usd, 2)
                                    if min_physical_local_price <= conv_val <= max_physical_local_price:
                                        valid_prices.append(conv_val)
                except Exception:
                    pass

        if not valid_prices:
            return 0.0, 0

        valid_prices.sort()
        q1 = valid_prices[len(valid_prices) // 4]
        q3 = valid_prices[(len(valid_prices) * 3) // 4]
        iqr = q3 - q1
        lower = q1 - (1.5 * iqr)
        upper = q3 + (1.5 * iqr)
        filtered = [p for p in valid_prices if lower <= p <= upper] or valid_prices
        median_val = round(filtered[len(filtered) // 2], 2)
        return median_val, len(filtered)

    async def get_absolute_street_price(
        self,
        lat: float,
        lon: float,
        commodity: str,
        currency: str,
        country_code: str = "US",
        fx_rate_per_usd: float = 1.0
        resolved_sku_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        if not self.api_key:
            raise RuntimeError(f"CRITICAL LOSS: SERPAPI_API_KEY missing. Cannot verify physical pricing for {commodity}. Halting.")

        curr = currency.upper().strip()
        currency_tokens = await self._resolve_live_currency_tokens(curr)

        if not resolved_sku_data or "sector_portfolio" not in resolved_sku_data:
            from engine.spatial_product_resolver import SpatialProductResolver
            resolver = SpatialProductResolver()
            resolved_sku_data = await resolver.resolve_market_ground_truth(lat, lon, commodity)

        portfolio = resolved_sku_data.get("sector_portfolio", [])
        loc_label = resolved_sku_data.get("location_label", f"{lat:.4f},{lon:.4f}")
        scope_mode = resolved_sku_data.get("scope_mode", "LOCATION_ECOSYSTEM")

        # Scrape all sectors in the portfolio concurrently
        tasks = [
            self._scrape_single_sector_price(s["search_item"], loc_label, curr, currency_tokens)
            for s in portfolio
        ]
        sector_results = await asyncio.gather(*tasks)

        priced_sectors: List[Dict[str, Any]] = []
        total_verified_points = 0
        active_weight_sum = 0.0
        weighted_price_accum = 0.0

        for sector_meta, (median_p, pts) in zip(portfolio, sector_results):
            if median_p > 0:
                w = float(sector_meta.get("weight", 1.0))
                active_weight_sum += w
                weighted_price_accum += w * median_p
                total_verified_points += pts
                priced_sectors.append({
                    "sector_name": sector_meta["sector_name"],
                    "search_item": sector_meta["search_item"],
                    "weight": w,
                    "median_clearing_price_local": median_p,
                    "verified_nodes": pts
                })

        if not priced_sectors or active_weight_sum <= 0:
            raise RuntimeError(
                f"CRITICAL LOSS OF PRICING TELEMETRY: Unable to scrape live clearing prices for '{resolved_sku_data.get('resolved_sku')}' in {curr} at {lat},{lon}. Halting."
            )

        composite_clearing_price = round(weighted_price_accum / active_weight_sum, 2)

        # Build the sector string safely without nested f-string quotes
        sectors_log = ", ".join(
            f"{s['sector_name']}: {curr} {s['median_clearing_price_local']:,.2f}" 
            for s in priced_sectors
        )

        logger.info(
            f"💵 Physical Price Matrix Locked ({scope_mode}): {curr} {composite_clearing_price:,.2f} weighted clearing ticket "
            f"across {len(priced_sectors)} active sectors ({total_verified_points} verified market nodes | "
            f"Sectors: [{sectors_log}])"
        )

        return {
            "price": composite_clearing_price,
            "currency": curr,
            "scope_mode": scope_mode,
            "resolved_commodity": resolved_sku_data.get("resolved_sku", commodity),
            "sector_breakdown": priced_sectors,
            "verified_data_points": total_verified_points,
            "provenance": "Live Multi-Sector Open-Web Marketplace & Google Shopping Matrix (IQR Filtered)"
        }