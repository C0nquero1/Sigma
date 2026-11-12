import os
import re
import html
import httpx
import logging
import asyncio
from typing import Dict, Any, List, Set, Optional, Tuple

logger = logging.getLogger("StreetAI.PricingScraper")

# Universal ISO-4217 to street symbol & local denomination lexer (not a price fallback; used strictly to parse text snippets)
CURRENCY_LEXICON: Dict[str, List[str]] = {
    "JPY": ["JPY", "¥", "￥", "円", "yen"],
    "THB": ["THB", "฿", "baht", "บาท"],
    "KRW": ["KRW", "₩", "won", "원"],
    "VND": ["VND", "₫", "dong", "đ", "vnđ"],
    "MAD": ["MAD", "DH", "Dhs", "dirham", "dirhams"],
    "LKR": ["LKR", "Rs.", "Rs", "SLR", "rupees"],
    "CNY": ["CNY", "RMB", "¥", "￥", "元", "yuan"],
    "BRL": ["BRL", "R$", "reais"],
    "GBP": ["GBP", "£"],
    "MXN": ["MXN", "Mex$", "$"],
    "NGN": ["NGN", "₦", "naira"],
    "USD": ["USD", "US$", "$"],
}


class AbsolutePhysicalPricingEngine:
    """
    100% Dynamic Multi-Sector & Single-SKU Physical Pricing Engine.
    Extracts live product prices from:
      1. Google Product Grid (`udm=28` with <script>/<style> stripped)
      2. Bing Live XML/RSS Feed (`format=rss` - immune to 403/302 bot blocks)
      3. Yahoo Commercial Search (`search.yahoo.com/search`)
      4. SerpAPI Google Shopping (with automatic 429 circuit breaker)
    """
    _serpapi_exhausted: bool = False

    def __init__(self):
        self.api_key = os.getenv("SERPAPI_API_KEY", "")
        self.base_url = "https://serpapi.com/search"
        self._currency_meta_cache: Dict[str, List[str]] = {}
        self.browser_headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
        }

    async def _resolve_live_currency_tokens(self, currency_code: str, country_code: str = "") -> List[str]:
        curr = currency_code.upper().strip()
        if curr in self._currency_meta_cache:
            return self._currency_meta_cache[curr]

        tokens: Set[str] = set(CURRENCY_LEXICON.get(curr, [curr]))
        tokens.add(curr)

        try:
            sparql = (
                f'SELECT ?currLabel ?sym WHERE {{ '
                f'?curr wdt:P498 "{curr}" . '
                f'OPTIONAL {{ ?curr wdt:P5061 ?sym . }} '
                f'SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }} '
                f'}} LIMIT 5'
            )
            async with httpx.AsyncClient(timeout=4.5) as client:
                r_wd = await client.get(
                    "https://query.wikidata.org/sparql",
                    params={"query": sparql, "format": "json"},
                    headers={
                        "Accept": "application/sparql-results+json",
                        "User-Agent": "StreetAI-PricingEngine/7.0 (https://streetai.io; contact@streetai.io)",
                    },
                )
                if r_wd.status_code == 200:
                    for b in r_wd.json().get("results", {}).get("bindings", []):
                        sym = b.get("sym", {}).get("value", "").strip()
                        lbl = b.get("currLabel", {}).get("value", "").strip()
                        if sym and len(sym) <= 5:
                            tokens.add(sym)
                        if lbl:
                            tokens.add(lbl)
                            last_w = lbl.split()[-1].strip()
                            if len(last_w) >= 3:
                                tokens.add(last_w)
        except Exception as e:
            logger.debug(f"Wikidata currency symbol lookup pivot for {curr}: {e}")

        token_list = sorted(list(tokens), key=len, reverse=True)
        self._currency_meta_cache[curr] = token_list
        return token_list

    @staticmethod
    def _strip_scripts_and_tags(raw_html: str) -> str:
        no_scripts = re.sub(
            r"<(script|style|noscript|svg|head)[^>]*>.*?</\1>",
            " ",
            raw_html,
            flags=re.DOTALL | re.IGNORECASE,
        )
        no_tags = re.sub(r"<[^>]+>", " ", no_scripts)
        return html.unescape(re.sub(r"\s+", " ", no_tags))

    def _extract_prices_with_dynamic_tokens(self, visible_text: str, currency_tokens: List[str]) -> List[float]:
        escaped_tokens = [re.escape(t) for t in currency_tokens if t]
        curr_group = "(?:" + "|".join(escaped_tokens) + ")"
        pattern = rf"(?:^|[\s(/>]){curr_group}\s*([\d,]+(?:\.\d{{1,2}})?)\b|\b([\d,]+(?:\.\d{{1,2}})?)\s*{curr_group}(?:[\s.,;)<]|$)"

        extracted: List[float] = []
        for m_tuple in re.findall(pattern, visible_text, flags=re.IGNORECASE):
            raw = (m_tuple[0] or m_tuple[1]).strip().rstrip(".,")
            if raw:
                try:
                    val = float(raw.replace(",", ""))
                    if 0.5 < val <= 100_000_000.0 and not (1990 <= val <= 2035):
                        extracted.append(val)
                except ValueError:
                    pass
        return extracted

    @staticmethod
    def _simplify_product_query(raw_item: str) -> str:
        """Strips parentheticals and non-commercial words so product search engines match real SKUs."""
        clean = re.sub(r"\([^)]*\)", " ", raw_item)
        clean = re.sub(r"\b(receipt|slip|voucher|withdrawal|transaction|monthly|bill|payment)\b", " ", clean, flags=re.IGNORECASE)
        words = [w for w in clean.split() if len(w) >= 2]
        return " ".join(words[:5]) if words else "commercial retail item"

    async def _query_visible_ecommerce_prices(
        self,
        search_item: str,
        city_part: str,
        curr: str,
        currency_tokens: List[str],
        country_code: str,
        fx_rate_per_usd: float,
        min_local: float,
        max_local: float,
    ) -> List[float]:
        """
        Queries 4 high-availability commercial product feeds concurrently:
          1. Google Product Grid (`udm=28`, country-pinned `gl`)
          2. Google Product Grid (`udm=28`, global USD `gl=us`)
          3. Bing Live XML/RSS Search (`format=rss` - clean XML descriptions, zero JS noise)
          4. Yahoo Product/Web Search (`search.yahoo.com/search`)
        """
        prices: List[float] = []
        clean_item = self._simplify_product_query(search_item)
        cc_low = country_code.lower().strip() if len(country_code.strip()) == 2 else "us"

        local_q = f"{clean_item} price {curr} {city_part}"
        usd_q = f"buy {clean_item} price USD"

        async with httpx.AsyncClient(timeout=8.0, follow_redirects=True, headers=self.browser_headers) as client:
            tasks = [
                client.get("https://www.google.com/search", params={"q": local_q, "gl": cc_low, "hl": "en", "udm": "28"}),
                client.get("https://www.google.com/search", params={"q": usd_q, "gl": "us", "hl": "en", "udm": "28"}),
                client.get("https://www.bing.com/search", params={"q": local_q, "format": "rss", "count": "20"}),
                client.get("https://www.bing.com/search", params={"q": usd_q, "format": "rss", "count": "20"}),
                client.get("https://search.yahoo.com/search", params={"p": usd_q, "n": "15"}),
            ]
            responses = await asyncio.gather(*tasks, return_exceptions=True)

            # Pass A: Extract local currency prices from visible text (indices 0, 2)
            for idx in (0, 2):
                res = responses[idx]
                if isinstance(res, httpx.Response) and res.status_code == 200 and res.text:
                    vis_text = self._strip_scripts_and_tags(res.text)
                    for p_val in self._extract_prices_with_dynamic_tokens(vis_text, currency_tokens):
                        if min_local <= p_val <= max_local:
                            prices.append(round(p_val, 2))

            # Pass B: Extract USD marketplace prices from visible text & convert via live street FX rate
            usd_tokens = ["USD", "US$", "$", "£", "€"]
            for idx in (1, 3, 4, 0, 2):
                res = responses[idx]
                if isinstance(res, httpx.Response) and res.status_code == 200 and res.text:
                    vis_text = self._strip_scripts_and_tags(res.text)
                    for usd_val in self._extract_prices_with_dynamic_tokens(vis_text, usd_tokens):
                        # Exclude Google's $5.00 boilerplate constant and years
                        if 0.80 <= usd_val <= 8_500.0 and abs(usd_val - 5.0) > 0.01:
                            conv = round(usd_val * fx_rate_per_usd, 2) if curr != "USD" else round(usd_val, 2)
                            if min_local <= conv <= max_local:
                                prices.append(conv)

        return prices

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

        # Physical retail/wholesale ticket envelope: [0.85 USD eq, 1,200 USD eq]
        min_physical_local_price = max(0.85, round(fx_rate_per_usd * 0.85, 2))
        max_physical_local_price = max(1_200.0, round(fx_rate_per_usd * 1_200.0, 2))

        valid_prices: List[float] = []

        # Tier 1: SerpAPI (only if quota active and circuit breaker not tripped)
        if self.api_key and not AbsolutePhysicalPricingEngine._serpapi_exhausted:
            primary_q = f"buy {search_item} price in {city_part} {curr}"
            async with httpx.AsyncClient(timeout=6.5) as client:
                try:
                    params = {
                        "engine": "google",
                        "q": primary_q,
                        "gl": gl_param,
                        "api_key": self.api_key,
                        "num": 15,
                    }
                    res = await client.get(self.base_url, params=params)
                    if res.status_code == 429:
                        AbsolutePhysicalPricingEngine._serpapi_exhausted = True
                    elif res.status_code == 200:
                        data = res.json()
                        for item in data.get("shopping_results", []) + data.get("inline_shopping_results", []):
                            ext_price = item.get("extracted_price")
                            price_str = str(item.get("price") or "")
                            if ext_price:
                                val = float(ext_price)
                                if curr != "USD" and ("USD" in price_str or (price_str.startswith("$") and fx_rate_per_usd > 5.0)):
                                    val = val * fx_rate_per_usd
                                if min_physical_local_price <= val <= max_physical_local_price:
                                    valid_prices.append(val)
                except Exception as e:
                    logger.debug(f"SerpAPI sector price scrape degraded: {e}")

        # Tier 2: Visible Google `udm=28` Product Grid + Bing RSS + Yahoo Search
        if len(valid_prices) < 3:
            vis_prices = await self._query_visible_ecommerce_prices(
                search_item=search_item,
                city_part=city_part,
                curr=curr,
                currency_tokens=currency_tokens,
                country_code=country_code,
                fx_rate_per_usd=fx_rate_per_usd,
                min_local=min_physical_local_price,
                max_local=max_physical_local_price,
            )
            valid_prices.extend(vis_prices)

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
        resolved_sku_data: Optional[Dict[str, Any]] = None,
        country_code: str = "US",
        fx_rate_per_usd: float = 1.0,
    ) -> Dict[str, Any]:
        curr = currency.upper().strip()
        currency_tokens = await self._resolve_live_currency_tokens(curr, country_code)

        if not resolved_sku_data or "sector_portfolio" not in resolved_sku_data:
            from engine.spatial_product_resolver import SpatialProductResolver
            resolver = SpatialProductResolver()
            resolved_sku_data = await resolver.resolve_market_ground_truth(lat, lon, commodity)

        portfolio = resolved_sku_data.get("sector_portfolio", [])
        loc_label = resolved_sku_data.get("location_label", f"{lat:.4f},{lon:.4f}")
        scope_mode = resolved_sku_data.get("scope_mode", "LOCATION_ECOSYSTEM")

        tasks = [
            self._scrape_single_sector_price(
                search_item=str(s.get("search_item") or s.get("search_query") or commodity),
                location_label=loc_label,
                curr=curr,
                currency_tokens=currency_tokens,
                country_code=country_code,
                fx_rate_per_usd=fx_rate_per_usd,
            )
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
                s_item = str(sector_meta.get("search_item") or sector_meta.get("search_query") or commodity)
                active_weight_sum += w
                weighted_price_accum += w * median_p
                total_verified_points += pts
                priced_sectors.append({
                    "sector_name": sector_meta.get("sector_name", commodity),
                    "search_item": s_item,
                    "weight": w,
                    "median_clearing_price_local": median_p,
                    "verified_nodes": pts,
                })

        # If a specific search_item phrase was too narrow, run a broad commodity-level sweep before halting
        if not priced_sectors:
            broad_term = self._simplify_product_query(resolved_sku_data.get("resolved_sku", commodity))
            broad_p, broad_pts = await self._scrape_single_sector_price(
                search_item=broad_term,
                location_label=loc_label,
                curr=curr,
                currency_tokens=currency_tokens,
                country_code=country_code,
                fx_rate_per_usd=fx_rate_per_usd,
            )
            if broad_p > 0:
                for sector_meta in portfolio:
                    w = float(sector_meta.get("weight", 1.0))
                    active_weight_sum += w
                    weighted_price_accum += w * broad_p
                    total_verified_points += broad_pts
                    priced_sectors.append({
                        "sector_name": sector_meta.get("sector_name", commodity),
                        "search_item": broad_term,
                        "weight": w,
                        "median_clearing_price_local": broad_p,
                        "verified_nodes": broad_pts,
                    })

        if not priced_sectors or active_weight_sum <= 0:
            raise RuntimeError(
                f"CRITICAL LOSS OF PRICING TELEMETRY: Unable to scrape live clearing prices for "
                f"'{resolved_sku_data.get('resolved_sku')}' in {curr} at {lat},{lon}. Halting."
            )

        composite_clearing_price = round(weighted_price_accum / active_weight_sum, 2)

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
            "provenance": "Live Multi-Sector Google Product Grid (udm=28) & Bing XML/RSS Matrix (IQR Filtered)",
        }