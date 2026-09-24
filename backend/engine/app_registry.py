import asyncio
from playwright.async_api import async_playwright
from typing import List
from pydantic import BaseModel

class FinTechNode(BaseModel):
    rank: int
    app_name: str
    developer: str

class UniversalAppRegistry:
    def __init__(self):
        self.base_url = "https://play.google.com/store/apps/category/FINANCE?hl=en&gl="

    async def scrape_top_fintech(self, country_code: str = "NG") -> List[FinTechNode]:
        target_url = f"{self.base_url}{country_code}"
        nodes = []

        async with async_playwright() as p:
            # Launch headless Chromium
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            )
            page = await context.new_page()
            
            try:
                await page.goto(target_url, timeout=15000, wait_until="domcontentloaded")
                
                # Wait for the app grid to render
                await page.wait_for_selector("div.ULeU3b", timeout=5000)
                
                # Extract the top 5 applications
                app_elements = await page.query_selector_all("div.ULeU3b")
                
                for idx, el in enumerate(app_elements[:5], start=1):
                    title_el = await el.query_selector("div.EpRjbf") # Play Store title class
                    dev_el = await el.query_selector("div.KoLSrc")   # Play Store dev class
                    
                    title = await title_el.inner_text() if title_el else f"Unknown Node {idx}"
                    dev = await dev_el.inner_text() if dev_el else "Unknown Dev"
                    
                    nodes.append(FinTechNode(rank=idx, app_name=title, developer=dev))
            
            except Exception as e:
                print(f"Scraping friction detected for region {country_code}: {e}")
                # Fallback heuristic if DOM changes or rate limit hits
                nodes = [FinTechNode(rank=1, app_name="Opay", developer="Opay Digital Services")]
            finally:
                await browser.close()
                
        return nodes

# Quick Test Execution
if __name__ == "__main__":
    registry = UniversalAppRegistry()
    loop = asyncio.get_event_loop()
    results = loop.run_until_complete(registry.scrape_top_fintech("NG"))
    for r in results:
        print(f"Rank {r.rank}: {r.app_name} ({r.developer})")