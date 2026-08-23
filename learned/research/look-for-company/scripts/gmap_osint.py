import asyncio
import urllib.parse
import re
from camoufox.async_api import AsyncCamoufox

async def scrape_gmap(company_name):
    """
    Fallback OSINT tool to extract phone numbers and website URLs
    from Google Maps business profiles when direct web searches fail.
    """
    query = urllib.parse.quote(company_name + " 台灣")
    url = f"https://www.google.com/maps/search/{query}"
    
    async with AsyncCamoufox(headless=True) as browser:
        page = await browser.new_page(ignore_https_errors=True)
        result = {"phone": None, "website": None}
        try:
            await page.goto(url, wait_until="domcontentloaded", timeout=20000)
            await page.wait_for_timeout(4000) # Allow map DOM to render
            
            # Extract phone from aria-labels or tooltips
            phone_raw = await page.evaluate('''() => {
                let btns = Array.from(document.querySelectorAll('button[data-tooltip*="phone"], button[data-tooltip*="電話"], button[aria-label*="Phone"], button[aria-label*="電話號碼"]'));
                let res = btns.map(b => b.innerText || b.getAttribute('aria-label') || '').filter(t => t.match(/[0-9\\-+ ]{8,}/));
                return res.length > 0 ? res[0] : null;
            }''')
            if phone_raw:
                m = re.search(r'([+0-9][0-9\-\s]{7,})', phone_raw)
                if m: result["phone"] = m.group(1).strip()
                    
            # Extract website from aria-labels or tooltips
            website_raw = await page.evaluate('''() => {
                let links = Array.from(document.querySelectorAll('a[data-tooltip*="website"], a[data-tooltip*="網站"], a[aria-label*="Website"], a[aria-label*="網站"]'));
                return links.length > 0 ? links[0].href : null;
            }''')
            if website_raw and 'google.com' not in website_raw:
                result["website"] = website_raw
        except Exception as e:
            print(f"Error: {e}")
        finally:
            await page.close()
        return result

if __name__ == '__main__':
    # Test execution
    print(asyncio.run(scrape_gmap("Your Target Company Name")))