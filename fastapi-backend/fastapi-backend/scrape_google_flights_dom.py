#!/usr/bin/env python3
"""
Google Flights DOM-Based Scraper
=================================
Instead of network interception, scrape the rendered DOM directly.
"""
import asyncio
import re
from playwright.async_api import async_playwright


async def scrape_flights_from_dom():
    """Scrape flight data from rendered DOM."""
    print("\n" + "=" * 70)
    print("DOM-BASED GOOGLE FLIGHTS SCRAPER")
    print("=" * 70)
    
    # Real search URL with proper format
    origin = "CAI"
    dest = "DXB"
    date = "2024-12-20"
    
    # Google Flights URL structure
    search_url = f"https://www.google.com/travel/flights?q=Flights%20to%20{dest}%20from%20{origin}%20on%20{date}%20one%20way"
    
    flights = []
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=False,
            args=["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
        )
        
        context = await browser.new_context(
            viewport={"width": 1920, "height": 1080},
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/120.0.0.0 Safari/537.36"
            ),
        )
        
        page = await context.new_page()
        
        print(f"\n🌐 Loading: {search_url}")
        await page.goto(search_url, wait_until="domcontentloaded", timeout=60000)
        
        print(f"⏳ Waiting for flight results to load...")
        await asyncio.sleep(12)
        
        # Take screenshot for debugging
        await page.screenshot(path="google_flights_screenshot.png")
        print(f"📸 Screenshot saved as 'google_flights_screenshot.png'")
        
        # Get page content
        content = await page.content()
        
        # Try multiple selector strategies
        print(f"\n🔍 Looking for flight result containers...")
        
        # Strategy 1: Look for flight list items
        selectors_to_try = [
            "li[jsname]",  # Generic flight items
            ".pIav2d",     # Old selector
            ".yR1fYc",     # Another old selector
            "[data-booking-id]",
            "div[jsaction*='click']",
        ]
        
        for selector in selectors_to_try:
            try:
                elements = await page.query_selector_all(selector)
                if elements:
                    print(f"   ✅ Found {len(elements)} elements with selector: {selector}")
                    
                    for i, elem in enumerate(elements[:5], 1):
                        text = await elem.text_content()
                        if text and len(text) > 20:
                            print(f"\n   Element {i} text (first 200 chars):")
                            print(f"   {text[:200]}")
            except:
                pass
        
        # Strategy 2: Search for airline names in page text
        print(f"\n🔍 Searching for airline names in page content...")
        airlines = ["Emirates", "Egyptair", "Flydubai", "Air Arabia", "Lufthansa", "Qatar"]
        
        found_airlines = []
        for airline in airlines:
            if airline.lower() in content.lower():
                found_airlines.append(airline)
                print(f"   ✅ Found: {airline}")
        
        # Strategy 3: Look for price patterns
        print(f"\n🔍 Searching for price patterns...")
        price_pattern = r'\$\d{1,4}|\d{1,4}\s*USD|EGP\s*\d{1,5}'
        prices_found = re.findall(price_pattern, content)
        
        if prices_found:
            print(f"   ✅ Found {len(prices_found)} price matches: {prices_found[:10]}")
        else:
            print(f"   ❌ No prices found")
        
        # Strategy 4: Check if page says "no results"
        no_results_indicators = ["No flights", "no results", "Try different dates"]
        for indicator in no_results_indicators:
            if indicator.lower() in content.lower():
                print(f"\n   ⚠️  Found '{indicator}' — might mean no flights available")
        
        # Save HTML for manual inspection
        with open("google_flights_page.html", "w", encoding="utf-8") as f:
            f.write(content)
        print(f"\n💾 Full HTML saved as 'google_flights_page.html'")
        
        await browser.close()
    
    print(f"\n" + "=" * 70)
    print(f"ANALYSIS COMPLETE")
    print(f"=" * 70)
    print(f"Check the screenshot and HTML file to understand the structure.")
    print(f"=" * 70 + "\n")


if __name__ == "__main__":
    asyncio.run(scrape_flights_from_dom())
