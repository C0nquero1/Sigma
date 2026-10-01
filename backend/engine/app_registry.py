import asyncio
import logging
import time
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from playwright.async_api import async_playwright

logger = logging.getLogger("StreetAI.AppRegistry")

class FinTechNode(BaseModel):
    rank: int
    app_name: str
    developer: str

class UniversalAppRegistry:
    def __init__(self, cache_ttl_seconds: int = 43200): # 12-hour cache
        self.base_url = "https://play.google.com/store/apps/category/FINANCE?hl=en&gl="
        self.cache_ttl = cache_ttl_seconds
        self._cache: Dict[str, Dict[str, Any]] = {}
        
        # Comprehensive global fallback matrix across informal trading hubs
        self._fallback_matrix: Dict[str, List[Dict[str, Any]]] = {
            "NG": [
                {"rank": 1, "app_name": "OPay - Beyond Banking", "developer": "OPay Digital Services"},
                {"rank": 2, "app_name": "PalmPay - Transfer & Pay", "developer": "PalmPay Ltd"},
                {"rank": 3, "app_name": "Moniepoint Business", "developer": "Moniepoint Microfinance Bank"},
                {"rank": 4, "app_name": "Kuda - Bank Free", "developer": "Kuda Microfinance Bank"},
                {"rank": 5, "app_name": "FairMoney", "developer": "FairMoney Microfinance Bank"}
            ],
            "IN": [
                {"rank": 1, "app_name": "PhonePe UPI, Recharge & Pay", "developer": "PhonePe"},
                {"rank": 2, "app_name": "Google Pay: UPI & Transfers", "developer": "Google LLC"},
                {"rank": 3, "app_name": "Paytm: Secure UPI Payments", "developer": "One97 Communications"},
                {"rank": 4, "app_name": "Navi: UPI, Loans & Mutual Funds", "developer": "Navi Technologies"},
                {"rank": 5, "app_name": "CRED: Credit Card Bills & UPI", "developer": "Dreamplug Technologies"}
            ],
            "KE": [
                {"rank": 1, "app_name": "M-PESA", "developer": "Safaricom PLC"},
                {"rank": 2, "app_name": "Tala: Instant Fast Loans", "developer": "Tala Kenya"},
                {"rank": 3, "app_name": "Branch: Loans & Mobile Banking", "developer": "Branch International"},
                {"rank": 4, "app_name": "Equity Mobile", "developer": "Equity Group Holdings"},
                {"rank": 5, "app_name": "NCBA Loop", "developer": "NCBA Group"}
            ],
            "GH": [
                {"rank": 1, "app_name": "MTN MoMo", "developer": "MTN MobileMoney Ltd"},
                {"rank": 2, "app_name": "Telecel Cash", "developer": "Telecel Ghana"},
                {"rank": 3, "app_name": "Hubtel", "developer": "Hubtel Ltd"},
                {"rank": 4, "app_name": "GCB Mobile Banking", "developer": "GCB Bank PLC"},
                {"rank": 5, "app_name": "Ecobank Mobile App", "developer": "Ecobank Transnational"}
            ],
            "BR": [
                {"rank": 1, "app_name": "Nubank: Conta, Cartão e Mais", "developer": "Nu Pagamentos S.A."},
                {"rank": 2, "app_name": "PicPay: Cartão, Pix e Mais", "developer": "PicPay"},
                {"rank": 3, "app_name": "Mercado Pago", "developer": "Mercado Pago"},
                {"rank": 4, "app_name": "Inter: Banco, Conta e Pix", "developer": "Banco Inter"},
                {"rank": 5, "app_name": "Caixa Tem", "developer": "Caixa Econômica Federal"}
            ],
            "MX": [
                {"rank": 1, "app_name": "Mercado Pago: Cuenta Digital", "developer": "Mercado Pago"},
                {"rank": 2, "app_name": "Spin by OXXO", "developer": "ComproPago"},
                {"rank": 3, "app_name": "Nu México", "developer": "Nu Mexico"},
                {"rank": 4, "app_name": "BBVA México", "developer": "BBVA México"},
                {"rank": 5, "app_name": "Klap: Pagos y Finanzas", "developer": "Klap"}
            ],
            "PH": [
                {"rank": 1, "app_name": "GCash", "developer": "Globe Fintech Innovations"},
                {"rank": 2, "app_name": "Maya: Bank, Buy & Pay", "developer": "Voyager Innovations"},
                {"rank": 3, "app_name": "SeaBank Philippines", "developer": "SeaBank Inc."},
                {"rank": 4, "app_name": "DiskarTech: Savings & Loans", "developer": "Rizal Commercial Banking"},
                {"rank": 5, "app_name": "PalawanPay", "developer": "Palawan Pawnshop Group"}
            ],
            "US": [
                {"rank": 1, "app_name": "Cash App", "developer": "Block, Inc."},
                {"rank": 2, "app_name": "Venmo", "developer": "PayPal, Inc."},
                {"rank": 3, "app_name": "PayPal - Send, Shop, Manage", "developer": "PayPal, Inc."},
                {"rank": 4, "app_name": "Chime - Mobile Banking", "developer": "Chime"},
                {"rank": 5, "app_name": "Zelle", "developer": "Early Warning Services, LLC"}
            ]
        }

    async def scrape_top_fintech(self, country_code: str = "NG") -> List[Dict[str, Any]]:
        """
        Executes headless browser scraping against Google Play's regional store
        with in-memory TTL caching and deterministic fallback fall-through.
        """
        cc = (country_code or "NG").upper().strip()
        now = time.time()

        # Check in-memory cache
        if cc in self._cache:
            entry = self._cache[cc]
            if now - entry["timestamp"] < self.cache_ttl:
                logger.info(f"Using cached fintech rails for region [{cc}]")
                return entry["data"]

        target_url = f"{self.base_url}{cc}"
        nodes: List[Dict[str, Any]] = []

        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch(
                    headless=True,
                    args=["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
                )
                context = await browser.new_context(
                    user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
                    locale="en-US"
                )
                page = await context.new_page()

                try:
                    await page.goto(target_url, timeout=12000, wait_until="domcontentloaded")
                    await page.wait_for_selector("div.ULeU3b", timeout=4000)

                    app_elements = await page.query_selector_all("div.ULeU3b")

                    for idx, el in enumerate(app_elements[:5], start=1):
                        title_el = await el.query_selector("div.EpRjbf")
                        dev_el = await el.query_selector("div.KoLSrc")

                        title = await title_el.inner_text() if title_el else f"Digital Rail {idx}"
                        dev = await dev_el.inner_text() if dev_el else "Financial Services"

                        nodes.append({"rank": idx, "app_name": title.strip(), "developer": dev.strip()})

                finally:
                    await browser.close()

        except Exception as e:
            logger.warning(f"Playwright scrape friction for region [{cc}]: {e}. Activating localized matrix fallback.")

        # Fallback if scraping yielded no results
        if not nodes:
            nodes = self._fallback_matrix.get(cc, [
                {"rank": 1, "app_name": f"Mobile Money Service ({cc})", "developer": "Regional Telecom Gateway"},
                {"rank": 2, "app_name": "WhatsApp Pay", "developer": "Meta Platforms"},
                {"rank": 3, "app_name": "Standard USSD Transfer Rail", "developer": "Central Switch Gateway"}
            ])

        # Store in cache
        self._cache[cc] = {"timestamp": now, "data": nodes}
        return nodes

    async def get_top_fintech_apps(self, country_code: str = "NG") -> List[Dict[str, Any]]:
        """Unified alias matching main.py invocation standard."""
        return await self.scrape_top_fintech(country_code)

if __name__ == "__main__":
    async def _test():
        registry = UniversalAppRegistry()
        for test_cc in ["NG", "IN", "BR", "KE"]:
            res = await registry.scrape_top_fintech(test_cc)
            print(f"\n--- Top 5 Rails for {test_cc} ---")
            for item in res:
                print(f"#{item['rank']} {item['app_name']} | Dev: {item['developer']}")

    asyncio.run(_test())