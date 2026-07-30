#!/usr/bin/env python3
"""
Debug Google Flights JSON Responses
====================================
Captures and logs all network responses from Google Flights to understand structure.
"""
import asyncio
import json
import re
from playwright.async_api import async_playwright


async def debug_google_flights():
    """Capture all Google Flights network traffic."""
    print("\n" + "=" * 70)
    print("DEBUGGING GOOGLE FLIGHTS JSON STRUCTURE")
    print("=" * 70)
    
    search_url = "https://www.google.com/travel/flights/search?q=Flights+from+CAI+to+DXB+on+2024-12-20&hl=en&curr=USD"
    
    captured_responses = []
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=False,  # Show browser to see what's happening
            args=[
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-blink-features=AutomationControlled",
            ],
        )
        
        page = await browser.new_page()
        
        # Set viewport and user agent
        await page.set_viewport_size({"width": 1920, "height": 1080})
        await page.set_extra_http_headers({
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/120.0.0.0 Safari/537.36"
            ),
            "Accept-Language": "en-US,en;q=0.9",
        })
        
        async def on_response(response):
            url = response.url
            
            # Look for Google Flights API endpoints
            if any(keyword in url for keyword in [
                "batchexecute", "travel/flights", "/_/TravelFrontendUi",
                "rpc/", "batch", "flight"
            ]):
                try:
                    status = response.status
                    content_type = response.headers.get("content-type", "")
                    
                    if 200 <= status < 300 and "json" in content_type.lower():
                        body = await response.text()
                        
                        print(f"\n{'='*70}")
                        print(f"🎯 CAPTURED RESPONSE:")
                        print(f"URL: {url[:100]}...")
                        print(f"Status: {status}")
                        print(f"Content-Type: {content_type}")
                        print(f"Body Length: {len(body)} chars")
                        print(f"First 300 chars:")
                        print(body[:300])
                        
                        captured_responses.append({
                            "url": url,
                            "status": status,
                            "body": body,
                            "content_type": content_type,
                        })
                        
                except Exception as e:
                    print(f"⚠️  Failed to read response from {url[:50]}...: {e}")
        
        page.on("response", on_response)
        
        print(f"\n🌐 Navigating to: {search_url}")
        await page.goto(search_url, wait_until="domcontentloaded", timeout=60000)
        
        print(f"\n⏳ Waiting 15 seconds for dynamic content...")
        await asyncio.sleep(15)
        
        # Try to find flight results on page
        try:
            # Look for flight cards/results
            await page.wait_for_selector("[data-booking-id], .pIav2d, .yR1fYc", timeout=5000)
            print(f"\n✅ Flight results detected on page!")
        except:
            print(f"\n⚠️  No flight results selector found (might still be loading)")
        
        await browser.close()
    
    print(f"\n" + "=" * 70)
    print(f"📊 SUMMARY")
    print(f"=" * 70)
    print(f"Total responses captured: {len(captured_responses)}")
    
    if captured_responses:
        print(f"\n📝 Saving responses to 'google_flights_debug.json'...")
        
        # Save to file for analysis
        with open("google_flights_debug.json", "w", encoding="utf-8") as f:
            json.dump(captured_responses, f, indent=2, ensure_ascii=False)
        
        print(f"✅ Saved {len(captured_responses)} responses")
        
        # Try to identify which response has flight data
        print(f"\n🔍 ANALYZING RESPONSES:")
        for i, resp in enumerate(captured_responses, 1):
            body = resp["body"]
            
            # Common indicators of flight data
            indicators = {
                "airline": any(word in body.lower() for word in ["emirates", "egyptair", "lufthansa", "airline"]),
                "price": "$" in body or "USD" in body or "EGP" in body,
                "duration": "h " in body or "min" in body,
                "flight_number": re.search(r"[A-Z]{2}\d{3,4}", body) is not None,
            }
            
            score = sum(indicators.values())
            
            if score >= 2:
                print(f"\n   Response #{i}: 🎯 LIKELY HAS FLIGHT DATA (score: {score}/4)")
                print(f"   URL: {resp['url'][:80]}...")
                print(f"   Indicators: {indicators}")
                print(f"   Sample: {body[:200]}...")
    else:
        print(f"\n❌ No responses captured!")
        print(f"   Google Flights might be blocking requests or structure changed.")
    
    print(f"\n" + "=" * 70 + "\n")


if __name__ == "__main__":
    asyncio.run(debug_google_flights())
