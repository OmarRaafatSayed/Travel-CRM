"""
Flight Scraper Service – thin wrapper around the Network Interception Engine.

All search logic lives in flight_interceptor.py.
This module exists for backward compatibility with any code that imports
FlightScraperService directly.
"""
from __future__ import annotations

import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


class FlightScraperService:
    """
    Delegates all flight searches to the Network Interception Engine.
    Bright Data is used automatically if credentials are configured.
    """

    def __init__(self) -> None:
        self.cache_ttl_hours = 12

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
        Delegate to the unified BrightDataFlightScraper which uses
        Network Interception as primary and Bright Data as optional secondary.
        """
        from app.services.brightdata_scraper import get_brightdata_scraper

        scraper = get_brightdata_scraper()
        return await scraper.search_flights(
            origin=origin,
            destination=destination,
            departure_date=departure_date,
            return_date=return_date,
            passenger_count=passenger_count,
            travel_class=travel_class,
        )

    async def get_cached_results(
        self,
        origin: str,
        destination: str,
        departure_date: str,
        return_date: Optional[str],
    ) -> Optional[Dict[str, Any]]:
        """Check cache before scraping."""
        try:
            from app.services.flight_cache import get_cached_results
            return await get_cached_results(
                origin, destination, departure_date, return_date
            )
        except Exception as e:
            logger.warning(f"Cache read failed: {e}")
            return None


# Singleton
_flight_scraper_instance: Optional[FlightScraperService] = None


def get_flight_scraper() -> FlightScraperService:
    """Get or create the flight scraper service instance."""
    global _flight_scraper_instance
    if _flight_scraper_instance is None:
        _flight_scraper_instance = FlightScraperService()
    return _flight_scraper_instance
