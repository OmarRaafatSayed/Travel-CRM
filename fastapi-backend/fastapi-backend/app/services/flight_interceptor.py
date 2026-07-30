"""
Flight Interceptor — Google Flights Network Interception
=========================================================
Requires Playwright + Chromium to be installed in the environment.

IMPORTANT: Google Flights structure changes frequently and uses anti-bot
protection. This interceptor attempts to extract data but may fail.

For reliable production flight data, integrate with:
- Amadeus Flight Offers API (https://developers.amadeus.com/)
- Skyscanner API
- Kiwi.com Tequila API
- SerpAPI Google Flights endpoint
"""
from __future__ import annotations

import json
import os
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

USE_REMOTE_BROWSER = os.getenv("USE_REMOTE_BROWSER", "true").lower() == "true"
SKIP_BROWSER       = os.getenv("PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD", "1") == "1"
USE_MOCK_FLIGHTS   = os.getenv("USE_MOCK_FLIGHT_DATA", "false").lower() == "true"


def _build_search_url(
    origin: str,
    destination: str,
    departure_date: str,
    return_date: Optional[str],
    passenger_count: int = 1,
    travel_class: str = "economy",
) -> str:
    """Build a Google Flights URL."""
    class_map = {"economy": "1", "premium_economy": "2", "business": "3", "first": "4"}
    cls = class_map.get(travel_class, "1")
    date_fmt = departure_date.replace("-", "")
    url = (
        f"https://www.google.com/travel/flights/search"
        f"?tfs=CBwQAhoeEgoyMDI2LTA4LTAyagcIARIDQ0FJcgcIARIDREhCGh4SCjIwMjYtMDgtMDJqBwgBEgNESEJyBwgBEgNDQUk"
    )
    return (
        f"https://www.google.com/travel/flights/search"
        f"?q=Flights+from+{origin}+to+{destination}+on+{departure_date}"
        f"&hl=en&curr=USD"
    )


def _is_flight_response(url: str) -> bool:
    return "travel/flights" in url or "google.com/travel" in url


def _parse_google_response_body(body: str) -> List[Dict]:
    """
    Parse intercepted Google Flights JSON body into flight dicts.
    
    NOTE: Google Flights uses a complex, frequently-changing JSON structure
    that is difficult to parse reliably. This function attempts to extract
    flight data using multiple strategies.
    
    For production use, consider using:
    - Amadeus Flight Offers API (free tier available)
    - SerpAPI Google Flights scraper
    - Skyscanner API
    """
    flights = []
    
    try:
        # Remove Google's XSSI protection prefix
        if body.startswith(")]}'"):
            body = body[4:]
        
        # Try to parse as JSON
        try:
            data = json.loads(body)
        except json.JSONDecodeError:
            logger.debug(f"Failed to parse response body as JSON (length: {len(body)})")
            return []
        
        # Strategy 1: Look for nested arrays with flight-like structures
        # Google Flights often nests data in arrays like [[["key"], [data]]]
        def recursive_flight_search(obj, depth=0, max_depth=15):
            """Recursively search for flight-like data structures."""
            if depth > max_depth:
                return
            
            if isinstance(obj, dict):
                # Look for price indicators
                has_price = any(k in obj for k in ["price", "cost", "fare", "amount"])
                has_airline = any(k in obj for k in ["airline", "carrier", "operator"])
                has_time = any(k in obj for k in ["departure", "arrival", "time", "duration"])
                
                if (has_price or has_airline) and has_time:
                    # Potential flight object
                    flight = {
                        "flight_id": obj.get("id") or obj.get("offer_id") or f"flight_{len(flights)+1}",
                        "airline": obj.get("airline") or obj.get("carrier") or "Unknown",
                        "flight_number": obj.get("flight_number") or obj.get("number") or "",
                        "departure_time": obj.get("departure") or obj.get("departure_time") or "",
                        "arrival_time": obj.get("arrival") or obj.get("arrival_time") or "",
                        "duration": obj.get("duration") or "",
                        "price": obj.get("price") or obj.get("amount") or 0,
                        "price_currency": obj.get("currency") or "USD",
                        "stops": obj.get("stops") or 0,
                        "raw_text": str(obj)[:200],
                    }
                    flights.append(flight)
                    return
                
                for value in obj.values():
                    recursive_flight_search(value, depth + 1, max_depth)
            
            elif isinstance(obj, list):
                for item in obj:
                    recursive_flight_search(item, depth + 1, max_depth)
        
        recursive_flight_search(data)
        
        if flights:
            logger.info(f"[parser] Extracted {len(flights)} flights from response")
        
    except Exception as exc:
        logger.warning(f"[parser] Failed to parse response: {exc}")
        logger.debug(f"[parser] Body sample: {body[:500]}")
    
    return flights


async def _apply_stealth(page: Any) -> None:
    """Apply anti-detection measures to a Playwright page."""
    await page.set_extra_http_headers({
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36"
        )
    })


async def intercept_google_flights(
    origin: str,
    destination: str,
    departure_date: str,
    return_date: Optional[str] = None,
    passenger_count: int = 1,
    travel_class: str = "economy",
    max_retries: int = 3,
) -> Dict[str, Any]:
    """
    Intercept Google Flights network responses to extract real flight data.

    Returns success=False with a clear message when Playwright/Chromium
    is not available (as in the current Docker environment).
    
    FALLBACK: If USE_MOCK_FLIGHT_DATA=true, returns realistic mock data.
    """
    # Check if mock mode is enabled
    if USE_MOCK_FLIGHTS:
        logger.info(f"[mock] Generating mock flight data for {origin} → {destination}")
        mock_flights = _generate_mock_flights(origin, destination, departure_date, count=8)
        return {
            "success": True,
            "provider": "mock_data",
            "origin": origin,
            "destination": destination,
            "departure_date": departure_date,
            "return_date": return_date,
            "flights": mock_flights,
            "total_results": len(mock_flights),
            "cached": False,
            "timestamp": datetime.utcnow().isoformat(),
        }
    
    # Check if Playwright is available
    if SKIP_BROWSER:
        logger.warning(
            "Playwright browser download was skipped (PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1). "
            "Flight scraping is disabled in this Docker environment."
        )
        return {
            "success": False,
            "provider": "network_interception",
            "origin": origin,
            "destination": destination,
            "departure_date": departure_date,
            "return_date": return_date,
            "flights": [],
            "total_results": 0,
            "cached": False,
            "error": (
                "Flight scraping is disabled: Playwright/Chromium is not installed "
                "in this environment. Configure Bright Data credentials in .env "
                "to enable live flight search."
            ),
            "error_type": "scraper_unavailable",
            "timestamp": datetime.utcnow().isoformat(),
        }

    # Try to import and run Playwright
    try:
        from playwright.async_api import async_playwright
    except ImportError:
        return {
            "success": False,
            "provider": "network_interception",
            "origin": origin,
            "destination": destination,
            "departure_date": departure_date,
            "flights": [],
            "total_results": 0,
            "cached": False,
            "error": "Playwright is not installed. Run: pip install playwright && playwright install chromium",
            "error_type": "scraper_unavailable",
            "timestamp": datetime.utcnow().isoformat(),
        }

    import asyncio
    captured_flights: List[Dict] = []
    search_url = _build_search_url(
        origin, destination, departure_date, return_date,
        passenger_count, travel_class,
    )

    for attempt in range(max_retries):
        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch(
                    headless=True,
                    args=[
                        "--no-sandbox",
                        "--disable-setuid-sandbox",
                        "--disable-dev-shm-usage",
                        "--disable-gpu",
                        "--disable-blink-features=AutomationControlled",
                    ],
                )
                page = await browser.new_page()
                await _apply_stealth(page)

                async def on_response(response: Any) -> None:
                    if not _is_flight_response(response.url):
                        return
                    if not (200 <= response.status < 300):
                        return
                    try:
                        body = await response.text()
                        parsed = _parse_google_response_body(body)
                        captured_flights.extend(parsed)
                    except Exception:
                        pass

                page.on("response", on_response)
                await page.goto(search_url, wait_until="networkidle", timeout=30000)
                await asyncio.sleep(8)
                await browser.close()

            if captured_flights:
                captured_flights.sort(key=lambda f: f.get("price") or 9_999_999)
                return {
                    "success": True,
                    "provider": "network_interception",
                    "origin": origin,
                    "destination": destination,
                    "departure_date": departure_date,
                    "return_date": return_date,
                    "flights": captured_flights[:20],
                    "total_results": len(captured_flights),
                    "cached": False,
                    "timestamp": datetime.utcnow().isoformat(),
                }

            logger.warning(f"[interceptor] Attempt {attempt+1}: no flights captured")

        except Exception as exc:
            logger.error(f"[interceptor] Attempt {attempt+1} failed: {exc}")
            if attempt == max_retries - 1:
                return {
                    "success": False,
                    "provider": "network_interception",
                    "origin": origin,
                    "destination": destination,
                    "departure_date": departure_date,
                    "flights": [],
                    "total_results": 0,
                    "cached": False,
                    "error": f"Scraper failed after {max_retries} attempts: {exc}",
                    "error_type": "scraper_error",
                    "timestamp": datetime.utcnow().isoformat(),
                }

    return {
        "success": False,
        "provider": "network_interception",
        "origin": origin,
        "destination": destination,
        "departure_date": departure_date,
        "flights": [],
        "total_results": 0,
        "cached": False,
        "error": "No flights captured after all retries.",
        "error_type": "no_results",
        "timestamp": datetime.utcnow().isoformat(),
    }


# ── Fallback: Mock Data Generator (for development/demo) ──────────────────────

def _generate_mock_flights(
    origin: str,
    destination: str,
    departure_date: str,
    count: int = 8,
) -> List[Dict]:
    """
    Generate realistic mock flight data for testing/demo purposes.
    
    NOTE: This is a DEVELOPMENT fallback only. For production, integrate
    with a real flight API (Amadeus, Skyscanner, etc.).
    """
    import random
    from datetime import datetime, timedelta
    
    airlines = [
        {"code": "EK", "name": "Emirates", "base_price": 450},
        {"code": "MS", "name": "EgyptAir", "base_price": 380},
        {"code": "FZ", "name": "flydubai", "base_price": 320},
        {"code": "G9", "name": "Air Arabia", "base_price": 280},
        {"code": "LH", "name": "Lufthansa", "base_price": 520},
        {"code": "QR", "name": "Qatar Airways", "base_price": 480},
    ]
    
    flights = []
    base_time = datetime.strptime(departure_date, "%Y-%m-%d")
    
    for i in range(count):
        airline = random.choice(airlines)
        stops = random.choice([0, 0, 0, 1, 1])  # More direct flights
        
        # Random departure time
        hour = random.randint(6, 22)
        minute = random.choice([0, 15, 30, 45])
        dep_time = base_time.replace(hour=hour, minute=minute)
        
        # Duration based on stops
        if stops == 0:
            duration_minutes = random.randint(200, 260)  # ~3.5-4.5h for CAI-DXB
        else:
            duration_minutes = random.randint(360, 540)  # 6-9h with stop
        
        arr_time = dep_time + timedelta(minutes=duration_minutes)
        
        # Price variation
        price = airline["base_price"] + random.randint(-50, 100)
        if stops > 0:
            price -= random.randint(30, 80)  # Cheaper with stops
        
        flight = {
            "flight_id": f"{airline['code']}{random.randint(100, 999)}_{i}",
            "airline": airline["name"],
            "flight_number": f"{airline['code']}{random.randint(100, 999)}",
            "departure_time": dep_time.strftime("%H:%M"),
            "arrival_time": arr_time.strftime("%H:%M"),
            "duration": f"{duration_minutes // 60}h {duration_minutes % 60}m",
            "price": price,
            "price_currency": "USD",
            "stops": stops,
            "raw_text": f"Mock flight data for {origin} to {destination}",
        }
        
        flights.append(flight)
    
    # Sort by price
    flights.sort(key=lambda f: f["price"])
    
    return flights
