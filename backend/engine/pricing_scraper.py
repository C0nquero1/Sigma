from playwright.async_api import async_playwright
import re

class StreetPricingScraper:
    async def extract_global_commodity_price(self, base_url: str, search_path: str, commodity: str) -> float:
        """Mounts a localized headless browser dynamically based on the GeoContext."""
        search_url = f"{base_url}{search_path}{commodity.replace(' ', '%20')}"
        prices = []
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()
            await page.set_extra_http_headers({"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
            
            try:
                await page.goto(search_url, wait_until="domcontentloaded", timeout=10000)
                # Universal regex extraction for price nodes across different DOM structures
                content = await page.content()
                raw_prices = re.findall(r'[$₦KShR$₹]\s*([\d,.]+)', content)
                
                for price_str in raw_prices[:15]:
                    clean_price = float(price_str.replace(',', ''))
                    if clean_price > 0:
                        prices.append(clean_price)
            except Exception as e:
                pass
            finally:
                await browser.close()
            
        if not prices:
            return 0.0
            
        prices.sort()
        return prices[len(prices) // 2]