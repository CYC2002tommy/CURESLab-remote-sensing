import asyncio
import re
from camoufox.async_api import AsyncCamoufox

async def extract_contacts(url):
    """
    Template for using Camoufox to scrape contact info from a company website.
    Bypasses anti-bot protections and renders JS correctly.
    """
    async with AsyncCamoufox(headless=True) as browser:
        page = await browser.new_page(ignore_https_errors=True)
        try:
            await page.goto(url, wait_until="domcontentloaded", timeout=15000)
            await page.wait_for_timeout(3000)  # Allow JS rendering
            content = await page.content()
            
            # Extract Emails
            emails = set(re.findall(r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+', content))
            # Filter out false positives
            emails = {e for e in emails if not e.endswith(('.png', '.jpg', '.jpeg', '.gif', 'sentry.io', '.webp', '.css', '.js'))}
            
            # Extract Taiwanese Phone Numbers
            phones = set(re.findall(r'(?:0\d{1,2}\s*-\s*\d{3,4}\s*-\s*\d{4}|0\d{1,2}-\d{7,8}|\+886\s*\d{1,2}\s*\d{7,8}|\+886-\d{1,2}-\d{7,8})', content))
            
            return {
                "emails": list(emails),
                "phones": list(phones)
            }
        except Exception as e:
            print(f"Error scraping {url}: {e}")
            return {"emails": [], "phones": []}

if __name__ == "__main__":
    # Example usage
    result = asyncio.run(extract_contacts("https://example.com"))
    print(result)
