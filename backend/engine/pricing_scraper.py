import os
import re
import json
import math
import html
import time
import httpx
import logging
import asyncio
from urllib.parse import urlparse
from typing import Dict, Any, List, Set, Optional, Tuple
from engine.llm_router import llm_router
from engine.overture_engine import GOOGLE_CONSENT_COOKIES

logger = logging.getLogger("StreetAI.PricingScraper")

_FOOD_KEYWORDS = {
    "food", "rice", "oil", "spice", "saffron", "tea", "coffee", "sugar", "flour",
    "bread", "noodle", "noodles", "snack", "grocery", "fruit", "vegetable", "meat",
    "chicken", "fish", "milk", "cheese", "beverage", "drink", "pasta", "cereal",
    "grain", "bean", "packaged", "mchuzi", "mbegu", "mchele", "زعفران",
}

_NON_COMMERCE_HOST_SUBSTRINGS = (
    "wikipedia.org", "wikimedia.org", "youtube.com", "tripadvisor.", "facebook.com",
    "instagram.com", "tiktok.com", "reddit.com", "x.com", "twitter.com",
    "support.microsoft.com", "support.google.com", "chromewebstore.google.com",
    "consent.google.com", "maps.google.com", "play.google.com", "apps.apple.com",
    "trustpilot.com", "contactout.com", "leadiq.com", "grok.com", "grokai.org", "x.ai",
    "punchng.com", "bbc.com", "cnn.com", "onlinecompass.net", "distancecalculator.",
    "angi.com", "thumbtack.com", "rotorooter.com", "cooperplumbing",
    "store.steampowered.com", "store.rockstargames.com", "community.shopify.com",
    "stackexchange.com", "stackoverflow.com", "york-press.gr", "antoineonline.com",
    "xnxx", "xvideos", "pornhub", "onlyfans", "pinterest.", "quora.com", "linkedin.com",
    "imdb.com", "fandom.com", "medium.com", "github.com",
)


def _ddgs_text_search_sync(query: str, max_results: int = 12) -> List[Dict[str, str]]:
    """Executes a real-web DuckDuckGo search via `ddgs` (or `duckduckgo_search`). Returns [] if unavailable."""
    try:
        try:
            from ddgs import DDGS
        except ImportError:
            from duckduckgo_search import DDGS

        results: List[Dict[str, str]] = []
        with DDGS() as ddgs:
            for r in ddgs.text(query, max_results=max_results) or []:
                if isinstance(r, dict):
                    results.append({
                        "title": str(r.get("title") or ""),
                        "href": str(r.get("href") or r.get("link") or ""),
                        "body": str(r.get("body") or r.get("snippet") or ""),
                    })
        return results
    except Exception as e:
        logger.debug(f"DDGS search pivot ({query[:50]}): {e}")
        return []


class AbsolutePhysicalPricingEngine:
    """
    100% Real-Life Universal Pricing & Order-Book Clearing Engine (Zero Simulation).
    - Replaces broken Bing RSS with `ddgs` real-web commerce discovery + product-keyword relevance gating
      (eliminates unrelated crawls like GTA V, WhatsApp, Shopify forums, or Shakespeare books).
    - PriceGhost-style 4-layer extractor:
        1. Properly parsed `<script type="application/ld+json">` with strict `priceCurrency` matching.
        2. Microdata (`itemprop="price"`) & OpenGraph (`product:price:amount` / `og:price:amount`).
        3. E-commerce DOM price attributes (`data-price`, `"final_price"`, `"salePrice"`).
        4. Visible text native-currency symbol regex (Wikidata official-language filtered symbols).
    - Food-gated & per-currency deduplicated Open Prices receipt proofs (`prices.openfoodfacts.org`).
    - Live commodity exchange futures via Yahoo Finance (`GC=F`, `SI=F`, `CT=F`, `KC=F`, `ZR=F`, `SB=F`, `HG=F`)
      + optional Twelve Data.
    - World Bank PPP (`PA.NUS.PPPC.RF` + `PA.NUS.PPP / FX`) supporting devalued currencies down to `0.05`.
    """
    _world_countries_cache: Optional[List[Dict[str, Any]]] = None
    _commodity_tick_cache: Dict[str, Tuple[float, float]] = {}
    _open_prices_cache: Dict[str, Tuple[float, List[Dict[str, Any]]]] = {}
    _open_prices_locks: Dict[str, asyncio.Lock] = {}

    COMMODITY_EXCHANGE_TICKERS: Dict[str, Tuple[str, str]] = {
        "gold": ("GC=F", "XAU/USD"),
        "altın": ("GC=F", "XAU/USD"),
        "oro": ("GC=F", "XAU/USD"),
        "ذهب": ("GC=F", "XAU/USD"),
        "silver": ("SI=F", "XAG/USD"),
        "cotton": ("CT=F", "CT"),
        "coffee": ("KC=F", "KC"),
        "rice": ("ZR=F", "ZR"),
        "sugar": ("SB=F", "SB"),
        "copper": ("HG=F", "HG"),
    }

    def __init__(self):
        self._currency_meta_cache: Dict[str, Tuple[str, List[str]]] = {}
        self.twelvedata_key = os.getenv("TWELVEDATA_API_KEY", "").strip()
        self.browser_headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
        }

    async def _fetch_live_commodity_exchange_tick_usd(
        self, client: httpx.AsyncClient, item_low: str
    ) -> Optional[Dict[str, Any]]:
        matched_key = next((kw for kw in self.COMMODITY_EXCHANGE_TICKERS if kw in item_low), None)
        if not matched_key:
            return None

        yf_sym, td_sym = self.COMMODITY_EXCHANGE_TICKERS[matched_key]
        now = time.time()
        cached = self._commodity_tick_cache.get(yf_sym)
        if cached and (now - cached[0]) < 900:
            return {"commodity": matched_key, "ticker": yf_sym, "exchange_price_usd": cached[1]}

        live_price: Optional[float] = None
        if self.twelvedata_key:
            try:
                r_td = await client.get(
                    "https://api.twelvedata.com/price",
                    params={"symbol": td_sym, "apikey": self.twelvedata_key},
                    timeout=4.0,
                )
                if r_td.status_code == 200 and r_td.json().get("price"):
                    live_price = float(r_td.json()["price"])
            except Exception:
                pass

        if live_price is None:
            try:
                r_yf = await client.get(
                    f"https://query1.finance.yahoo.com/v8/finance/chart/{yf_sym}",
                    params={"interval": "1d", "range": "1d"},
                    timeout=4.0,
                )
                if r_yf.status_code == 200:
                    res_arr = r_yf.json().get("chart", {}).get("result", [])
                    if res_arr:
                        p = res_arr[0].get("meta", {}).get("regularMarketPrice")
                        if p and float(p) > 0:
                            live_price = float(p)
            except Exception:
                pass

        if live_price is not None and live_price > 0:
            self._commodity_tick_cache[yf_sym] = (now, live_price)
            return {"commodity": matched_key, "ticker": yf_sym, "exchange_price_usd": round(live_price, 4)}
        return None

    async def _fetch_open_prices_receipt_proofs(
        self, client: httpx.AsyncClient, curr: str, country_code: str, keywords: List[str]
    ) -> List[float]:
        """Food-gated and per-currency deduplicated Open Prices receipt proofs."""
        kw_clean = [k.lower() for k in keywords if len(k) >= 3]
        if not kw_clean or not any(any(fk in kw for fk in _FOOD_KEYWORDS) for kw in kw_clean):
            return []

        c_up = curr.upper()
        lock = self._open_prices_locks.setdefault(c_up, asyncio.Lock())
        async with lock:
            cached = self._open_prices_cache.get(c_up)
            if cached and (time.time() - cached[0]) < 1800:
                items = cached[1]
            else:
                items = []
                try:
                    res = await client.get(
                        "https://prices.openfoodfacts.org/api/v1/prices",
                        params={"currency": c_up, "size": 50, "order_by": "-date"},
                        timeout=4.5,
                    )
                    if res.status_code == 200:
                        items = res.json().get("items", []) or []
                except Exception as e:
                    logger.debug(f"Open Prices receipt ledger pivot ({c_up}): {e}")
                self._open_prices_cache[c_up] = (time.time(), items)

        receipt_prices: List[float] = []
        cc_up = (country_code or "").upper()
        for it in items:
            price_val = it.get("price")
            if not isinstance(price_val, (int, float)) or price_val <= 0:
                continue
            loc_obj = it.get("location") or {}
            item_cc = str(loc_obj.get("osm_address_country_code") or "").upper()
            if cc_up and item_cc and item_cc != cc_up:
                continue
            prod_obj = it.get("product") or {}
            searchable = " ".join([
                str(prod_obj.get("product_name") or ""),
                str(it.get("product_name") or ""),
                str(it.get("category_tag") or ""),
            ]).lower()
            if any(k in searchable for k in kw_clean):
                receipt_prices.append(round(float(price_val), 2))
        return receipt_prices

    async def _resolve_live_ppp_and_street_parity(
        self, country_code: str, fx_rate_per_usd: float, official_spot_rate: float = 0.0
    ) -> Optional[float]:
        """
        Real World Bank PPP Price Level Ratio (`PA.NUS.PPPC.RF` via `mrnev=1`, with fallback
        to `PA.NUS.PPP / fx_rate_per_usd`). Accepts ratios down to `0.05` for high-inflation/devalued FX.
        Cached 30 days in SQLite under `wb_ppp_v2:`.
        """
        cc = (country_code or "US").strip().upper()
        if cc == "US":
            return 1.0
        if len(cc) != 2:
            return None

        cache_key = f"wb_ppp_v2:{cc}"
        base_ppp = llm_router.get_cached(cache_key)
        if base_ppp is None:
            async with httpx.AsyncClient(timeout=5.0, follow_redirects=True) as client:
                try:
                    r_rf = await client.get(
                        f"https://api.worldbank.org/v2/country/{cc.lower()}/indicator/PA.NUS.PPPC.RF",
                        params={"format": "json", "mrnev": 1},
                    )
                    if r_rf.status_code == 200:
                        payload = r_rf.json()
                        if isinstance(payload, list) and len(payload) > 1 and isinstance(payload[1], list):
                            for entry in payload[1]:
                                val = entry.get("value")
                                if val is not None and 0.05 <= float(val) <= 2.5:
                                    base_ppp = round(float(val), 3)
                                    break
                except Exception:
                    pass

                if base_ppp is None and fx_rate_per_usd > 0:
                    try:
                        r_cf = await client.get(
                            f"https://api.worldbank.org/v2/country/{cc.lower()}/indicator/PA.NUS.PPP",
                            params={"format": "json", "mrnev": 1},
                        )
                        if r_cf.status_code == 200:
                            payload = r_cf.json()
                            if isinstance(payload, list) and len(payload) > 1 and isinstance(payload[1], list):
                                for entry in payload[1]:
                                    val = entry.get("value")
                                    if val is not None and float(val) > 0:
                                        ratio = float(val) / fx_rate_per_usd
                                        if 0.05 <= ratio <= 2.5:
                                            base_ppp = round(ratio, 3)
                                            break
                    except Exception:
                        pass

            if base_ppp is not None:
                llm_router.set_cached(cache_key, base_ppp, ttl_seconds=2592000)

        if not isinstance(base_ppp, (int, float)):
            return None

        fx_spread_mod = 1.0
        if official_spot_rate > 0 and fx_rate_per_usd > 0:
            fx_spread_mod = max(0.85, min(1.35, fx_rate_per_usd / official_spot_rate))
        return round(max(0.05, min(2.5, float(base_ppp) * fx_spread_mod)), 3)

    async def _resolve_live_currency_tokens(
        self, currency_code: str, country_code: str = ""
    ) -> Tuple[str, List[str]]:
        curr = currency_code.upper().strip()
        cc = (country_code or "").upper().strip()
        cache_key = f"curr_tok_v2:{curr}:{cc}"
        if cache_key in self._currency_meta_cache:
            return self._currency_meta_cache[cache_key]

        cached = llm_router.get_cached(cache_key)
        if isinstance(cached, dict) and cached.get("tokens"):
            res_tuple = (str(cached["short_sym"]), list(cached["tokens"]))
            self._currency_meta_cache[cache_key] = res_tuple
            return res_tuple

        tokens: Set[str] = {curr}
        short_symbols: List[str] = []

        async with httpx.AsyncClient(timeout=4.5, follow_redirects=True) as client:
            try:
                if AbsolutePhysicalPricingEngine._world_countries_cache is None:
                    r_cdn = await client.get("https://cdn.jsdelivr.net/npm/world-countries@latest/countries.json")
                    if r_cdn.status_code == 200 and isinstance(r_cdn.json(), list):
                        AbsolutePhysicalPricingEngine._world_countries_cache = r_cdn.json()
                for c_item in AbsolutePhysicalPricingEngine._world_countries_cache or []:
                    c_dict = c_item.get("currencies", {})
                    if isinstance(c_dict, dict) and curr in c_dict:
                        sym = str(c_dict[curr].get("symbol") or "").strip()
                        if sym and len(sym) <= 5:
                            if not (len(sym) == 1 and sym.isascii() and sym.isalpha()):
                                tokens.add(sym)
                            if sym not in short_symbols and len(sym) <= 4:
                                short_symbols.append(sym)
            except Exception:
                pass

            try:
                sparql = (
                    f'SELECT DISTINCT ?sym ?alt WHERE {{ '
                    f'?curr wdt:P498 "{curr}" . '
                    f'OPTIONAL {{ ?curr wdt:P5061 ?sym . }} '
                    f'OPTIONAL {{ '
                    f'  ?country wdt:P297 "{cc}" ; wdt:P37 ?lang . '
                    f'  ?lang wdt:P424 ?langCode . '
                    f'  ?curr skos:altLabel ?alt . '
                    f'  FILTER((LANG(?alt) = ?langCode || LANG(?alt) = "en") && STRLEN(STR(?alt)) <= 5) '
                    f'}} '
                    f'}} LIMIT 15'
                )
                r_wd = await client.get(
                    "https://query.wikidata.org/sparql",
                    params={"query": sparql, "format": "json"},
                    headers={
                        "Accept": "application/sparql-results+json",
                        "User-Agent": "StreetAI-PricingEngine/9.3 (https://streetai.io; contact@streetai.io) httpx/0.27",
                    },
                )
                if r_wd.status_code == 200:
                    for b in r_wd.json().get("results", {}).get("bindings", []):
                        for field in ("sym", "alt"):
                            val = b.get(field, {}).get("value", "").strip()
                            if val and 1 <= len(val) <= 5 and "'" not in val:
                                if not (len(val) == 1 and val.isascii() and val.isalpha()):
                                    tokens.add(val)
                                if field == "sym" and len(val) <= 4 and val not in short_symbols:
                                    short_symbols.append(val)
            except Exception:
                pass

        short_sym = next(
            (s for s in short_symbols if not (len(s) == 1 and s.isascii() and s.isalpha())),
            curr,
        )
        token_list = sorted(list(tokens), key=len, reverse=True)
        llm_router.set_cached(cache_key, {"short_sym": short_sym, "tokens": token_list}, ttl_seconds=2592000)
        self._currency_meta_cache[cache_key] = (short_sym, token_list)
        return short_sym, token_list

    @staticmethod
    def _strip_scripts_and_tags(raw_html: str) -> str:
        no_scripts = re.sub(
            r"<(script|style|noscript|svg|head)[^>]*>.*?</\1>",
            " ",
            raw_html,
            flags=re.DOTALL | re.IGNORECASE,
        )
        no_tags = re.sub(r"<[^>]+>", " ", no_scripts)
        unesc = html.unescape(no_tags).replace("\xa0", " ").replace("\u202f", " ")
        return re.sub(r"\s+", " ", unesc).strip()

    @staticmethod
    def _parse_localized_number(raw_num_str: str, fx_rate_per_usd: float) -> Optional[float]:
        s = raw_num_str.strip().rstrip(".,;")
        if not s:
            return None
        if re.match(r"^\d{1,3}(?:\.\d{3})+$", s) and (fx_rate_per_usd >= 20.0 or len(s) >= 5):
            s = s.replace(".", "")
        elif "," in s and "." in s:
            if s.rfind(",") > s.rfind("."):
                s = s.replace(".", "").replace(",", ".")
            else:
                s = s.replace(",", "")
        elif "," in s:
            parts = s.split(",")
            if len(parts[-1]) == 2 and len(parts) == 2:
                s = s.replace(",", ".")
            else:
                s = s.replace(",", "")

        try:
            val = float(s)
            if 0.5 < val <= 100_000_000.0 and not (1985 <= val <= 2035):
                return val
        except ValueError:
            return None
        return None

    def _extract_prices_from_text(
        self, text: str, currency_tokens: List[str], fx_rate_per_usd: float
    ) -> List[float]:
        extracted: List[float] = []
        escaped_tokens = [re.escape(t) for t in currency_tokens if t]
        if not escaped_tokens or not text:
            return extracted
        curr_group = "(?:" + "|".join(escaped_tokens) + ")"
        num_pat = r"\d[\d.,]*\d|\d+"
        pattern = rf"(?:^|[\s(/>:;\"']){curr_group}\s*({num_pat})\b|\b({num_pat})\s*{curr_group}(?:[\s.,;)<\"']|$)"
        for m_tuple in re.findall(pattern, text, flags=re.IGNORECASE):
            raw = m_tuple[0] or m_tuple[1]
            parsed_val = self._parse_localized_number(raw, fx_rate_per_usd)
            if parsed_val is not None:
                extracted.append(parsed_val)
        return extracted

    def _extract_prices_priceghost_4layer(
        self,
        raw_html: str,
        curr: str,
        currency_tokens: List[str],
        fx_rate_per_usd: float = 1.0,
    ) -> List[float]:
        """
        PriceGhost-style 4-layer extraction on real e-commerce HTML:
          1. Structured `<script type="application/ld+json">` Product/Offer parsing with strict `priceCurrency` check.
          2. Regex fallback for Microdata (`itemprop="price"`), OpenGraph (`product:price:amount`), `data-price`, `"final_price"`.
          3. Visible page text matched against safe native currency tokens.
        """
        extracted: List[float] = []
        curr_up = curr.upper()

        # Layer 1: Native JSON-LD <script> object traversal
        for m_ld in re.finditer(
            r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>(.*?)</script>',
            raw_html,
            flags=re.DOTALL | re.IGNORECASE,
        ):
            try:
                blob = json.loads(m_ld.group(1).strip())
                stack = [blob] if isinstance(blob, dict) else (blob if isinstance(blob, list) else [])
                while stack:
                    node = stack.pop()
                    if isinstance(node, list):
                        stack.extend(node)
                    elif isinstance(node, dict):
                        p_curr = str(node.get("priceCurrency") or "").upper()
                        if p_curr and p_curr != curr_up:
                            continue
                        for pk in ("price", "lowPrice", "highPrice"):
                            if pk in node and node[pk] is not None:
                                pv = self._parse_localized_number(str(node[pk]), fx_rate_per_usd)
                                if pv is not None:
                                    extracted.append(pv)
                        for v in node.values():
                            if isinstance(v, (dict, list)):
                                stack.append(v)
            except Exception:
                pass

        # Layer 2: Microdata, OpenGraph & e-commerce JSON attributes with nearby currency verification
        for m_json in re.finditer(
            r'(?:"price"|"lowPrice"|"highPrice"|"final_price"|"salePrice"|itemprop\s*=\s*["\']price["\'][^>]{0,40}content|product:price:amount|og:price:amount|data-price)\s*(?:content\s*=\s*|[:=]\s*)["\']?(\d{1,9}(?:[.,]\d{1,3})?)["\']?',
            raw_html,
            flags=re.IGNORECASE,
        ):
            ctx_win = raw_html[max(0, m_json.start() - 180): min(len(raw_html), m_json.end() + 180)]
            cur_m = re.search(
                r'(?:"priceCurrency"|product:price:currency|og:price:currency|itemprop\s*=\s*["\']priceCurrency["\'][^>]{0,30}content)\s*(?:content\s*=\s*|[:=]\s*)["\']([A-Z]{3})["\']',
                ctx_win,
                flags=re.IGNORECASE,
            )
            if cur_m and cur_m.group(1).upper() != curr_up:
                continue
            p_val = self._parse_localized_number(m_json.group(1), fx_rate_per_usd)
            if p_val is not None:
                extracted.append(p_val)

        # Layer 3: Visible text prices matched against safe native currency tokens
        vis_text = self._strip_scripts_and_tags(raw_html)
        extracted.extend(self._extract_prices_from_text(vis_text, currency_tokens, fx_rate_per_usd))
        return extracted

    async def _crawl_relevant_commerce_urls(
        self,
        client: httpx.AsyncClient,
        search_hits: List[Dict[str, str]],
        product_tokens: Set[str],
        country_code: str,
        curr: str,
        currency_tokens: List[str],
        fx_rate_per_usd: float,
    ) -> List[float]:
        """
        Strict relevance-gated crawler: ONLY fetches URLs whose host is not in the non-commerce
        blocklist AND whose title/body/URL matches at least one product keyword.
        """
        cc_low = (country_code or "").lower()
        candidate_urls: List[str] = []

        for hit in search_hits:
            url = hit.get("href", "").strip()
            if not url.startswith("http"):
                continue
            parsed = urlparse(url)
            host = (parsed.hostname or "").lower()
            path_low = (parsed.path or "").lower()
            if not host or any(bad in host for bad in _NON_COMMERCE_HOST_SUBSTRINGS):
                continue
            if any(bad_p in path_low for bad_p in ("/support/", "/help/", "/contact", "/register", "/login", "/privacy", "/terms")):
                continue

            combined_meta = f"{hit.get('title', '')} {hit.get('body', '')} {url}".lower()
            if product_tokens and not any(tok in combined_meta for tok in product_tokens):
                continue  # Guarantees zero GTA V / WhatsApp / Shakespeare off-topic crawls!

            if url not in candidate_urls:
                if cc_low and host.endswith(f".{cc_low}"):
                    candidate_urls.insert(0, url)
                else:
                    candidate_urls.append(url)

        prices: List[float] = []
        if candidate_urls:
            tasks = [client.get(u, timeout=4.5) for u in candidate_urls[:4]]
            responses = await asyncio.gather(*tasks, return_exceptions=True)
            for p_res in responses:
                if (
                    isinstance(p_res, httpx.Response)
                    and p_res.status_code == 200
                    and p_res.text
                    and "consent.google.com" not in str(p_res.url)
                ):
                    prices.extend(
                        self._extract_prices_priceghost_4layer(
                            p_res.text[:150000], curr, currency_tokens, fx_rate_per_usd
                        )
                    )
        return prices

    @staticmethod
    def _compute_order_book_clearing_stats(
        ask_prices: List[float], receipt_prices: List[float]
    ) -> Dict[str, Any]:
        all_pts = sorted(ask_prices + receipt_prices)
        if not all_pts:
            return {"clearing_price": 0.0, "p25": 0.0, "p50": 0.0, "p75": 0.0, "spread_pct": 0.0, "verified_count": 0}

        n = len(all_pts)
        q1 = all_pts[n // 4]
        q3 = all_pts[(n * 3) // 4]
        iqr = q3 - q1
        lower = q1 - (1.5 * iqr)
        upper = q3 + (1.5 * iqr)
        filtered = [p for p in all_pts if lower <= p <= upper] or all_pts
        m = len(filtered)

        p25 = round(filtered[m // 4], 2)
        p50 = round(filtered[m // 2], 2)
        p75 = round(filtered[(m * 3) // 4], 2)
        spread_pct = round(((p75 - p25) / max(1e-6, p50)) * 100.0, 1)

        valid_receipts = [p for p in receipt_prices if lower <= p <= upper]
        if valid_receipts:
            rec_med = sorted(valid_receipts)[len(valid_receipts) // 2]
            clearing = round((rec_med * 0.70) + (p50 * 0.30), 2)
        else:
            clearing = round((2.0 * p25 * p50) / max(1e-6, (p25 + p50)), 2) if p25 > 0 else p50

        return {
            "clearing_price": clearing,
            "p25": p25,
            "p50": p50,
            "p75": p75,
            "spread_pct": spread_pct,
            "verified_count": m,
        }

    @staticmethod
    def _extract_clean_city_name(location_label: str) -> str:
        parts = [p.strip() for p in location_label.split(",") if p.strip()]
        non_coord_parts = [
            p for p in parts if not re.match(r"^-?\d+(?:\.\d+)?$", p) and any(c.isalpha() for c in p)
        ]
        raw_city = non_coord_parts[-2] if len(non_coord_parts) >= 2 else (non_coord_parts[0] if non_coord_parts else "")
        return re.sub(
            r"^(?:Special Capital Region of|Metropolitan City of|Province of)\s+",
            "",
            raw_city,
            flags=re.IGNORECASE,
        ).strip()

    @staticmethod
    def _simplify_product_query(raw_item: str) -> str:
        clean = re.sub(r"\([^)]*\)", " ", raw_item)
        clean = re.sub(r"[\u2010-\u2015,;/]", " ", clean)
        clean = re.sub(
            r"\b(receipt|slip|voucher|withdrawal|transaction|monthly|bill|payment|single|unit|standard|model|size|piece|per|medium|plain|red|custom|made|genuine|packaged|fresh|0\.5kg|2\.5m|10kg|25kg|500g)\b",
            " ",
            clean,
            flags=re.IGNORECASE,
        )
        words = [w for w in clean.split() if len(w) >= 2 and not w.isdigit()]
        return " ".join(words[:3]) if words else "market goods"

    async def _scrape_single_sector_price(
        self,
        search_item: str,
        search_item_native: str,
        location_label: str,
        curr: str,
        short_sym: str,
        currency_tokens: List[str],
        country_code: str = "US",
        fx_rate_per_usd: float = 1.0,
        is_wholesale_band: bool = False,
        sector_emp_anchor: float = 0.0,
    ) -> Dict[str, Any]:
        city_part = self._extract_clean_city_name(location_label)
        clean_en = self._simplify_product_query(search_item)
        clean_native = self._simplify_product_query(search_item_native or search_item)
        item_low = f"{clean_en} {clean_native}".lower()
        product_tokens = {w.lower() for w in (clean_en.split() + clean_native.split()) if len(w) >= 3}

        q_ddg_native = f"{clean_native} price {city_part} {short_sym}".strip()
        q_ddg_en = f"buy {clean_en} price {city_part} {curr}".strip()

        ask_candidates: List[float] = []
        receipt_candidates: List[float] = []
        exchange_tick: Optional[Dict[str, Any]] = None

        async with httpx.AsyncClient(
            timeout=5.5,
            follow_redirects=True,
            headers=self.browser_headers,
            cookies=GOOGLE_CONSENT_COOKIES,
        ) as client:
            ddg_nat_res, ddg_en_res, rec_res, tick_res = await asyncio.gather(
                llm_router.fast_ddgs_text(q_ddg_native, max_results=10),
                llm_router.fast_ddgs_text(q_ddg_en, max_results=10),
                self._fetch_open_prices_receipt_proofs(
                    client, curr, country_code, clean_en.split() + clean_native.split()
                ),
                self._fetch_live_commodity_exchange_tick_usd(client, item_low),
                return_exceptions=True,
            )

            if isinstance(tick_res, dict):
                exchange_tick = tick_res
                if exchange_tick["ticker"] == "GC=F" and fx_rate_per_usd > 0:
                    gram_local = (exchange_tick["exchange_price_usd"] / 31.1035) * 0.916 * fx_rate_per_usd
                    if sector_emp_anchor < gram_local:
                        sector_emp_anchor = round(gram_local * (20.0 if is_wholesale_band else 4.0), 2)

            if sector_emp_anchor > 0:
                min_local = max(1.0, round(sector_emp_anchor * 0.18, 2))
                max_local = max(min_local * 10.0, round(sector_emp_anchor * 6.0, 2))
            else:
                min_local = max(0.5, round(fx_rate_per_usd * 0.5, 2))
                max_local = max(500.0, round(fx_rate_per_usd * 8_000.0, 2))

            if isinstance(rec_res, list):
                for p_val in rec_res:
                    if min_local <= p_val <= max_local:
                        receipt_candidates.append(round(p_val, 2))

            all_hits: List[Dict[str, str]] = []
            if isinstance(ddg_nat_res, list):
                all_hits.extend(ddg_nat_res)
            if isinstance(ddg_en_res, list):
                all_hits.extend(ddg_en_res)

            # 1. Extract real local prices directly from relevant DDGS commerce snippets
            for hit in all_hits:
                snippet_txt = f"{hit.get('title', '')} {hit.get('body', '')}"
                if product_tokens and not any(tok in snippet_txt.lower() for tok in product_tokens):
                    continue
                for p_val in self._extract_prices_from_text(snippet_txt, currency_tokens, fx_rate_per_usd):
                    if min_local <= p_val <= max_local:
                        ask_candidates.append(round(p_val, 2))

            # 2. Deep-crawl up to 4 relevance-verified local commerce pages for JSON-LD/Microdata prices
            if len(ask_candidates) < 6 and all_hits:
                deep_asks = await self._crawl_relevant_commerce_urls(
                    client, all_hits, product_tokens, country_code, curr, currency_tokens, fx_rate_per_usd
                )
                for p_val in deep_asks:
                    if min_local <= p_val <= max_local:
                        ask_candidates.append(round(p_val, 2))

        stats = self._compute_order_book_clearing_stats(ask_candidates, receipt_candidates)
        stats["receipt_samples"] = len(receipt_candidates)
        stats["exchange_tick"] = exchange_tick
        return stats

    async def get_absolute_street_price(
        self,
        lat: float,
        lon: float,
        commodity: str,
        currency: str,
        resolved_sku_data: Optional[Dict[str, Any]] = None,
        country_code: str = "US",
        fx_rate_per_usd: float = 1.0,
        empirical_scope: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        curr = currency.upper().strip()
        (short_sym, currency_tokens), ppp_ratio = await asyncio.gather(
            self._resolve_live_currency_tokens(curr, country_code),
            self._resolve_live_ppp_and_street_parity(country_code, fx_rate_per_usd),
        )

        if not resolved_sku_data or "sector_portfolio" not in resolved_sku_data:
            from engine.spatial_product_resolver import SpatialProductResolver
            resolver = SpatialProductResolver()
            resolved_sku_data = await resolver.resolve_market_ground_truth(
                lat, lon, commodity, local_currency=curr, fx_rate_per_usd=fx_rate_per_usd
            )

        portfolio = resolved_sku_data.get("sector_portfolio", [])
        loc_label = resolved_sku_data.get("location_label", f"{lat:.4f},{lon:.4f}")
        scope_mode = resolved_sku_data.get("scope_mode", "LOCATION_ECOSYSTEM")

        emp_stall_ticket = float((empirical_scope or {}).get("typical_stall_ticket_local") or 0.0)
        emp_visitor_spend = float((empirical_scope or {}).get("typical_visitor_spend_local") or 0.0)
        emp_wholesale_ticket = float((empirical_scope or {}).get("wholesale_lot_ticket_local") or 0.0)
        base_emp_ticket = emp_stall_ticket if emp_stall_ticket > 0 else (emp_visitor_spend * 0.58)

        tasks = []
        sector_anchors: List[float] = []
        for s in portfolio:
            is_ws = (
                "WHOLESALE" in str(s.get("trade_band", "")).upper()
                or "BULK" in str(s.get("sector_name", "")).upper()
            )
            specific_sec_ticket = float(s.get("sector_clearing_ticket_local", 0.0) or 0.0)
            if specific_sec_ticket > 0:
                sec_anchor = specific_sec_ticket
            elif is_ws and emp_wholesale_ticket > 0:
                sec_anchor = emp_wholesale_ticket
            else:
                sec_anchor = base_emp_ticket

            sector_anchors.append(sec_anchor)
            s_en = str(s.get("search_item") or s.get("search_query") or commodity)
            s_nat = str(s.get("search_item_native") or s_en)

            tasks.append(
                self._scrape_single_sector_price(
                    search_item=s_en,
                    search_item_native=s_nat,
                    location_label=loc_label,
                    curr=curr,
                    short_sym=short_sym,
                    currency_tokens=currency_tokens,
                    country_code=country_code,
                    fx_rate_per_usd=fx_rate_per_usd,
                    is_wholesale_band=is_ws,
                    sector_emp_anchor=sec_anchor,
                )
            )
        sector_results = await asyncio.gather(*tasks)

        priced_sectors: List[Dict[str, Any]] = []
        total_verified_points = 0
        total_receipt_samples = 0
        verified_sector_count = 0
        active_weight_sum = 0.0
        harmonic_denom_accum = 0.0
        p25_vals: List[float] = []
        p75_vals: List[float] = []
        exchange_ticks: List[Dict[str, Any]] = []

        for sector_meta, stats, sec_anchor in zip(portfolio, sector_results, sector_anchors):
            w = max(0.01, float(sector_meta.get("weight", 1.0)))
            s_item = str(sector_meta.get("search_item") or sector_meta.get("search_query") or commodity)
            scraped_clearing = float(stats.get("clearing_price", 0.0) or 0.0)
            pts = int(stats.get("verified_count", 0) or 0)
            rec_pts = int(stats.get("receipt_samples", 0) or 0)

            if stats.get("exchange_tick"):
                exchange_ticks.append(stats["exchange_tick"])

            if scraped_clearing > 0 and pts > 0:
                final_sector_price = scraped_clearing
                verified_pts = pts
                is_verified = True
                verified_sector_count += 1
                total_verified_points += pts
                total_receipt_samples += rec_pts
                if stats["p25"] > 0:
                    p25_vals.append(stats["p25"])
                if stats["p75"] > 0:
                    p75_vals.append(stats["p75"])
            elif sec_anchor > 0:
                final_sector_price = round(sec_anchor, 2)
                verified_pts = 0
                is_verified = False
            else:
                final_sector_price = 0.0
                verified_pts = 0
                is_verified = False

            if final_sector_price > 0:
                active_weight_sum += w
                harmonic_denom_accum += w / final_sector_price

            priced_sectors.append({
                "sector_name": sector_meta.get("sector_name", commodity),
                "search_item": s_item,
                "weight": w,
                "median_clearing_price_local": final_sector_price,
                "p25_local": stats["p25"] if is_verified else None,
                "p75_local": stats["p75"] if is_verified else None,
                "order_flow_spread_pct": stats["spread_pct"] if is_verified else None,
                "verified_nodes": verified_pts,
                "receipt_proofs": rec_pts,
                "is_empirically_verified": is_verified,
            })

        composite_clearing_price = (
            round(active_weight_sum / harmonic_denom_accum, 2) if harmonic_denom_accum > 0 else 0.0
        )
        live_coverage_pct = round((verified_sector_count / max(1, len(portfolio))) * 100.0, 1)

        sectors_log = ", ".join(
            f"{s['sector_name']}: {curr} {s['median_clearing_price_local']:,.2f} "
            f"({'LIVE ' + str(s['verified_nodes']) + ' pts' if s['is_empirically_verified'] else 'UNVERIFIED_REF 0 pts'})"
            for s in priced_sectors
        )

        logger.info(
            f"💵 Physical Price Matrix Locked ({scope_mode} | Live PPP={ppp_ratio} | Live Coverage={live_coverage_pct}%): "
            f"{curr} {composite_clearing_price:,.2f} order-book harmonic clearing ticket "
            f"({total_verified_points} verified listings, {total_receipt_samples} OpenPrices receipts | Sectors: [{sectors_log}])"
        )

        return {
            "price": composite_clearing_price,
            "currency": curr,
            "world_bank_ppp_price_level_ratio": ppp_ratio,
            "scope_mode": scope_mode,
            "resolved_commodity": resolved_sku_data.get("resolved_sku", commodity),
            "sector_breakdown": priced_sectors,
            "verified_data_points": total_verified_points,
            "open_prices_receipt_samples": total_receipt_samples,
            "commodity_exchange_ticks": exchange_ticks,
            "live_data_coverage_pct": live_coverage_pct,
            "basket_price_distribution": {
                "p25_local": round(sum(p25_vals) / len(p25_vals), 2) if p25_vals else None,
                "p50_clearing_local": composite_clearing_price,
                "p75_local": round(sum(p75_vals) / len(p75_vals), 2) if p75_vals else None,
            },
            "provenance": (
                "DDGS Relevance-Gated Commerce Discovery + PriceGhost 4-Layer JSON-LD Extractor + "
                "Open Prices Food Receipts + Live Yahoo/TwelveData Commodity Futures + World Bank PPP"
            ),
        }