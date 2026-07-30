"""
Flight Search Router – Network Interception Engine
===================================================
All flight data comes from intercepted Google Flights XHR responses.
No CSS selectors. No brittle HTML parsing.

Authentication
--------------
All mutating and search endpoints require a valid Supabase Bearer token.
Public read-only endpoints (/health, /test-connection) are intentionally
left open for monitoring tooling.
"""
from __future__ import annotations

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import Any, Dict, Optional

from app.core.security import AuthToken, require_auth
from app.services.brightdata_scraper import get_brightdata_scraper

router = APIRouter()


# ─── Request / Response models ───────────────────────────────────────────────

class FlightSearchRequest(BaseModel):
    origin: str = Field(..., min_length=3, max_length=3, description="IATA code, e.g. CAI")
    destination: str = Field(..., min_length=3, max_length=3, description="IATA code, e.g. DXB")
    departure_date: str = Field(..., description="YYYY-MM-DD")
    return_date: Optional[str] = Field(None, description="YYYY-MM-DD (round trip)")
    passenger_count: int = Field(1, ge=1, le=9)
    travel_class: str = Field(
        "economy",
        description="economy | premium_economy | business | first",
    )


class ConnectionTestResponse(BaseModel):
    connected: bool
    primary_provider: Optional[str] = None
    interception_engine: Optional[str] = None
    brightdata_configured: Optional[bool] = None
    brightdata_status: Optional[str] = None
    test_page_title: Optional[str] = None
    message: Optional[str] = None
    error: Optional[str] = None


# ─── Protected endpoints ─────────────────────────────────────────────────────

@router.post("/search")
async def search_flights(
    request: FlightSearchRequest,
    token: AuthToken = Depends(require_auth),
) -> Dict[str, Any]:
    """
    Search for real-time flights via the Network Interception Engine.

    **Requires:** ``Authorization: Bearer <supabase_access_token>``

    The ``user_id`` extracted from the token is attached to every result so
    that search history can be scoped per user (multi-tenancy).
    """
    print(
        f"✈️  Flight search: {request.origin} → {request.destination} "
        f"on {request.departure_date}  [user={token.user_id}]"
    )

    scraper = get_brightdata_scraper()

    result = await scraper.search_flights(
        origin=request.origin.upper(),
        destination=request.destination.upper(),
        departure_date=request.departure_date,
        return_date=request.return_date,
        passenger_count=request.passenger_count,
        travel_class=request.travel_class,
    )

    if not result.get("success"):
        # Return a structured 200 response instead of raising an HTTP exception.
        # The frontend already handles success=False gracefully — no need for
        # a 503/500 that causes error object serialisation issues.
        error_type = result.get("error_type", "unknown_error")

        if error_type == "all_methods_failed":
            result["error"] = (
                "Flight search is unavailable: the scraper requires Playwright/Chromium "
                "or Bright Data credentials. Contact your administrator."
            )

        result["requested_by"] = token.user_id
        return result

    # Attach requesting user context to the result for audit / data isolation
    result["requested_by"] = token.user_id
    return result


@router.post("/clear-cache")
async def clear_expired_cache(
    background_tasks: BackgroundTasks,
    token: AuthToken = Depends(require_auth),
) -> Dict[str, str]:
    """
    Schedule a background task to purge expired cache rows.

    **Requires:** ``Authorization: Bearer <supabase_access_token>``
    """
    from app.services.flight_cache import clear_expired_cache as _clear

    background_tasks.add_task(_clear)
    return {"message": "Cache cleanup scheduled", "status": "processing"}


# ─── Public / monitoring endpoints ───────────────────────────────────────────

@router.get("/test-connection", response_model=ConnectionTestResponse)
async def test_connection() -> Dict[str, Any]:
    """
    Verify the Network Interception Engine (and optionally Bright Data) are
    reachable. Public endpoint — used by monitoring tools.
    """
    scraper = get_brightdata_scraper()
    return await scraper.test_connection()


@router.get("/health")
async def flight_service_health() -> Dict[str, Any]:
    """Quick health check — does NOT launch a browser. Public endpoint."""
    scraper = get_brightdata_scraper()
    return {
        "status": "operational",
        "service": "flight_search",
        "primary_provider": "network_interception",
        "brightdata_available": scraper.brightdata_enabled,
        "cache_ttl_hours": scraper.cache_ttl_hours,
        "css_selectors_used": False,
    }
