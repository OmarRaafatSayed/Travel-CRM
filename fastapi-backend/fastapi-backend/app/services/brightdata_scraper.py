"""
Flight Scraper – Network Interception Engine (Primary) + Bright Data (Optional)
================================================================================
Primary path  : Network Interception via Playwright (zero-cost, permanent)
Secondary path: Bright Data Cloud Browser (if credentials are configured)

CSS selectors are NOT used anywhere in this module.
All data comes from intercepted XHR/Fetch responses.
"""
from __future__ import annotations

import asyncio
import logging
import os
from datetime import datetime
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


class BrightDataFlightScraper:
    """
    Unified flight scraper.

    Priority order:
      1. Network Interception Engine  ← always available, zero cost
      2. Bright Data Cloud Browser    ← optional, used when env vars are set
    """

    def __init__(self) -> None:
        self.customer_id = os.getenv("BRIGHTDATA_CUSTOMER_ID")
        self.zone = os.getenv("BRIGHTDATA_ZONE", "scraping_browser")
        self.password = os.getenv("BRIGHTDATA_PASSWORD")
        self.cache_ttl_hours = int(os.getenv("FLIGHT_CACHE_TTL_HOURS", "12"))

        self.brightdata_enabled = bool(self.customer_id and self.password)

        if self.brightdata_enabled:
            logger.info("Bright Data credentials found – available as secondary provider")
        else:
            logger.info(
                "Bright Data not configured – using Network Interception Engine (primary)"
            )

        # Always enabled – Network Interception requires no credentials
        self.enabled = True

    # ──────────────────────────────────────────
    #  Public search method
    # ──────────────────────────────────────────

    async def search_flights(
        self,
        origin: str,
        destination: str,
        departure_date: str,
        return_date: Optional[str] = None,
        passenger_count: int = 1,
        travel_class: str = "economy",
    ) -> Dict[str, Any]:
        """
        Search for flights.

        Tries the cache first, then Network Interception, then
        Bright Data if configured and interception yields nothing.
        """
        # 1. Cache check
        try:
            from app.services.flight_cache import get_cached_results
            cached = await get_cached_results(
                origin, destination, departure_date, return_date
            )
            if cached:
                logger.info("Returning cached flight results")
                return cached
        except Exception as e:
            logger.warning(f"Cache check failed (non-fatal): {e}")

        # 2. Primary: Network Interception Engine
        logger.info(f"[PRIMARY] Network Interception: {origin} → {destination}")
        try:
            from app.services.flight_interceptor import intercept_google_flights

            print(f"DEBUG: Starting intercept_google_flights for {origin}→{destination}")
            result = await intercept_google_flights(
                origin=origin,
                destination=destination,
                departure_date=departure_date,
                return_date=return_date,
                passenger_count=passenger_count,
                travel_class=travel_class,
                max_retries=3,
            )

            if result.get("success") and result.get("flights"):
                logger.info(
                    f"[PRIMARY] ✅ Interception succeeded: "
                    f"{result['total_results']} flights"
                )
                await self._try_cache(
                    origin, destination, departure_date, return_date, result
                )
                return result
            else:
                logger.warning(
                    f"[PRIMARY] Interception returned no flights: "
                    f"{result.get('error', 'empty result')}"
                )

        except Exception as e:
            error_msg = str(e)
            logger.error(
                f"[PRIMARY] Network Interception failed for "
                f"{origin}->{destination} on {departure_date}: {error_msg}"
            )
            # Do NOT return fake data. Fall through to Bright Data or
            # the exhausted-methods response below.

        # 3. Secondary: Bright Data (only if configured)
        # Reached here because interception returned no flights or raised.
        if self.brightdata_enabled:
            logger.info("[SECONDARY] Falling back to Bright Data Cloud Browser")
            try:
                result = await self._scrape_via_brightdata(
                    origin, destination, departure_date,
                    return_date, passenger_count, travel_class
                )
                if result.get("success") and result.get("flights"):
                    await self._try_cache(
                        origin, destination, departure_date, return_date, result
                    )
                    return result
            except Exception as e:
                logger.error(
                    f"[SECONDARY] Bright Data failed for "
                    f"{origin}->{destination}: {e}"
                )

        # 4. All methods exhausted
        return {
            "success": False,
            "provider": "all_methods_failed",
            "origin": origin,
            "destination": destination,
            "departure_date": departure_date,
            "return_date": return_date,
            "flights": [],
            "total_results": 0,
            "cached": False,
            "error": (
                "All flight search methods exhausted. "
                "The interceptor requires a local Chromium install "
                "(run: playwright install chromium). "
                "Alternatively configure Bright Data credentials."
            ),
            "error_type": "all_methods_failed",
            "timestamp": datetime.utcnow().isoformat(),
        }

    # ──────────────────────────────────────────
    #  Bright Data secondary path
    # ──────────────────────────────────────────

    def _get_brightdata_endpoint(self) -> str:
        return (
            f"wss://brd-customer-{self.customer_id}-zone-{self.zone}:"
            f"{self.password}@brd.superproxy.io:9222"
        )

    async def _scrape_via_brightdata(
        self,
        origin: str,
        destination: str,
        departure_date: str,
        return_date: Optional[str],
        passenger_count: int,
        travel_class: str,
    ) -> Dict[str, Any]:
        """
        Use Bright Data's remote browser as a proxy layer.
        Still uses Network Interception – no CSS selectors.
        """
        from playwright.async_api import async_playwright
        from app.services.flight_interceptor import (
            _apply_stealth,
            _build_search_url,
            _parse_google_response_body,
            _is_flight_response,
        )

        endpoint = self._get_brightdata_endpoint()
        search_url = _build_search_url(
            origin, destination, departure_date, return_date,
            passenger_count, travel_class
        )
        captured_flights: List[Dict] = []

        async with async_playwright() as p:
            browser = await p.chromium.connect_over_cdp(endpoint)
            try:
                ctx = (
                    browser.contexts[0]
                    if browser.contexts
                    else await browser.new_context()
                )
                page = await ctx.new_page()
                await _apply_stealth(page)

                async def on_response(response) -> None:
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

                await page.goto(search_url, wait_until="domcontentloaded", timeout=30000)
                await asyncio.sleep(15)  # Bright Data needs more time
            finally:
                await browser.close()

        if captured_flights:
            captured_flights.sort(key=lambda f: f.get("price") or 9999999)
            return {
                "success": True,
                "provider": "brightdata_interception",
                "origin": origin,
                "destination": destination,
                "departure_date": departure_date,
                "return_date": return_date,
                "flights": captured_flights[:20],
                "total_results": len(captured_flights),
                "cached": False,
                "timestamp": datetime.utcnow().isoformat(),
            }

        return {
            "success": False,
            "provider": "brightdata_interception",
            "error": "No flights captured via Bright Data",
            "flights": [],
            "total_results": 0,
            "cached": False,
            "timestamp": datetime.utcnow().isoformat(),
        }

    # ──────────────────────────────────────────
    #  Connection test (for /test-connection endpoint)
    # ──────────────────────────────────────────

    async def test_connection(self) -> Dict[str, Any]:
        """
        Test connectivity.
        Returns status of both interception engine and Bright Data.
        """
        result: Dict[str, Any] = {
            "connected": False,
            "interception_engine": "available",
            "brightdata_configured": self.brightdata_enabled,
        }

        # Quick smoke-test: launch headless Chromium and load a page
        try:
            from playwright.async_api import async_playwright
            import subprocess
            import sys
            
            # Ensure playwright browsers are installed with dependencies
            try:
                install_result = subprocess.run(
                    [sys.executable, "-m", "playwright", "install", "chromium"], 
                    capture_output=True, text=True, timeout=60
                )
                print(f"DEBUG: Playwright install result: {install_result.returncode}")
                if install_result.returncode != 0:
                    print(f"⚠️  Playwright install output: {install_result.stdout}")
                    print(f"⚠️  Playwright install error: {install_result.stderr}")
            except Exception as e:
                print(f"⚠️  Could not auto-install playwright: {e}")

            # Test Chromium with detailed debugging
            print("DEBUG: Testing Chromium launch...")
            async with async_playwright() as p:
                try:
                    chromium_path = p.chromium.executable_path
                    print(f"DEBUG: Chromium executable found at: {chromium_path}")
                except Exception as e:
                    print(f"DEBUG: Cannot get Chromium path: {e}")
                    raise Exception("Chromium not found")

                browser = await p.chromium.launch(
                    headless=True,
                    args=[
                        "--no-sandbox", 
                        "--disable-setuid-sandbox",
                        "--disable-blink-features=AutomationControlled",
                        "--disable-web-security",
                        "--disable-dev-shm-usage",
                        "--no-first-run",
                        "--disable-gpu",
                    ],
                )
                print("DEBUG: Chromium launched successfully")
                page = await browser.new_page()
                await page.goto("https://www.google.com", timeout=15000)
                title = await page.title()
                await browser.close()
                print(f"DEBUG: Test page loaded with title: {title}")

            result.update(
                {
                    "connected": True,
                    "test_page_title": title,
                    "primary_provider": "network_interception",
                    "message": (
                        "Local Chromium reachable. "
                        "Network Interception Engine ready."
                    ),
                }
            )
        except Exception as e:
            result.update(
                {
                    "connected": False,
                    "error": str(e),
                    "message": f"Chromium failed: {str(e)}. Try: playwright install chromium",
                }
            )

        # Also test Bright Data if configured
        if self.brightdata_enabled:
            try:
                from playwright.async_api import async_playwright

                async with async_playwright() as p:
                    browser = await p.chromium.connect_over_cdp(
                        self._get_brightdata_endpoint()
                    )
                    ctx = (
                        browser.contexts[0]
                        if browser.contexts
                        else await browser.new_context()
                    )
                    page = await ctx.new_page()
                    await page.goto("https://www.google.com", timeout=15000)
                    bd_title = await page.title()
                    await browser.close()

                result["brightdata_status"] = "connected"
                result["brightdata_test_page"] = bd_title
            except Exception as e:
                result["brightdata_status"] = f"error: {e}"

        return result

    # ──────────────────────────────────────────
    #  Internal helpers
    # ──────────────────────────────────────────

    async def _try_cache(
        self,
        origin: str,
        destination: str,
        departure_date: str,
        return_date: Optional[str],
        result: Dict[str, Any],
    ) -> None:
        """
        Write a successful result to the cache.
        Failed results (success=False) and legacy mock_data are never cached
        so that a transient scraper outage cannot poison the cache.
        """
        if not result.get("success"):
            logger.debug("Skipping cache write: result is not successful")
            return
        if result.get("provider") == "mock_data":
            logger.warning("Refusing to cache result from mock_data provider")
            return
        try:
            from app.services.flight_cache import cache_results
            await cache_results(origin, destination, departure_date, return_date, result)
            logger.info(f"Cached {result.get('total_results', 0)} flight results")
        except Exception as e:
            logger.warning(f"Cache write failed (non-fatal): {e}")


# Singleton
_scraper_instance: Optional[BrightDataFlightScraper] = None


def get_brightdata_scraper() -> BrightDataFlightScraper:
    """Get or create the unified flight scraper instance."""
    global _scraper_instance
    if _scraper_instance is None:
        _scraper_instance = BrightDataFlightScraper()
    return _scraper_instance
