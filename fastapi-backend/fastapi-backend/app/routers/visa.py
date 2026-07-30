"""
Visa Applications Router
=========================
Full CRUD implementation for visa application tracking backed by Supabase.

Table: public.visa_applications
RLS: authenticated users have full access to their own applications

7-Step Workflow:
1. Documents Collected (تم جمع المستندات)
2. In Review (قيد المراجعة)
3. Embassy Appointment (موعد السفارة)
4. Submitted to Consulate (مقدّم للقنصلية)
5. Approved (تمت الموافقة)
6. Rejected (مرفوض)
7. Cancelled (ملغي)
"""
from __future__ import annotations

import logging
from datetime import date, datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field, field_validator

from app.core.security import AuthToken, require_auth
from app.services.supabase_client import get_supabase

logger = logging.getLogger(__name__)
router = APIRouter()

# ─── Constants ────────────────────────────────────────────────────────────────

_TABLE = "visa_applications"
_PROFILES_TABLE = "profiles"

# Valid status values (1-7)
_VALID_STATUSES = frozenset({1, 2, 3, 4, 5, 6, 7})

_STATUS_NAMES = {
    1: "Documents Collected",
    2: "In Review",
    3: "Embassy Appointment",
    4: "Submitted to Consulate",
    5: "Approved",
    6: "Rejected",
    7: "Cancelled",
}


# ─── Pydantic schemas ─────────────────────────────────────────────────────────

class VisaApplicationCreate(BaseModel):
    """Inbound schema for creating a visa application."""
    client_name: str = Field(..., min_length=1, max_length=255)
    passport_number: str = Field(..., min_length=1, max_length=50)
    destination_country: str = Field(..., min_length=1, max_length=100)
    email: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=50)
    visa_type: Optional[str] = Field(None, max_length=100)
    application_notes: Optional[str] = None
    status: int = Field(1, ge=1, le=7)
    appointment_date: Optional[str] = Field(None, description="YYYY-MM-DD")
    appointment_notes: Optional[str] = None

    @field_validator("status")
    @classmethod
    def status_must_be_valid(cls, v: int) -> int:
        if v not in _VALID_STATUSES:
            raise ValueError(f"Invalid status '{v}'. Must be between 1 and 7.")
        return v


class VisaApplicationUpdate(BaseModel):
    """Inbound schema for updating a visa application."""
    client_name: Optional[str] = Field(None, min_length=1, max_length=255)
    passport_number: Optional[str] = Field(None, min_length=1, max_length=50)
    destination_country: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=50)
    visa_type: Optional[str] = Field(None, max_length=100)
    application_notes: Optional[str] = None
    status: Optional[int] = Field(None, ge=1, le=7)
    appointment_date: Optional[str] = Field(None, description="YYYY-MM-DD")
    appointment_notes: Optional[str] = None

    @field_validator("status")
    @classmethod
    def status_must_be_valid(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and v not in _VALID_STATUSES:
            raise ValueError(f"Invalid status '{v}'. Must be between 1 and 7.")
        return v


class VisaApplicationResponse(BaseModel):
    """Outbound schema for visa applications."""
    id: str
    client_name: str
    passport_number: str
    destination_country: str
    status: int
    status_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    visa_type: Optional[str] = None
    application_notes: Optional[str] = None
    appointment_date: Optional[str] = None
    appointment_notes: Optional[str] = None
    organization_id: Optional[str] = None
    created_by: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    model_config = {"extra": "allow"}


class SearchResponse(BaseModel):
    results: List[Dict[str, Any]]
    count: int
    filters_applied: Dict[str, Any]


class StatusUpdateResponse(BaseModel):
    success: bool
    application_id: str
    new_status: int
    status_name: str
    message: str


# ─── Internal helpers ─────────────────────────────────────────────────────────

def _resolve_profile_id(supabase: Any, auth_user_id: str) -> Optional[str]:
    """Look up the profiles.id (PK) for the given auth user UUID."""
    try:
        resp = (
            supabase.table(_PROFILES_TABLE)
            .select("id")
            .eq("user_id", auth_user_id)
            .limit(1)
            .execute()
        )
        if resp.data:
            return str(resp.data[0]["id"])
    except Exception as exc:
        logger.warning(f"Profile lookup failed for user {auth_user_id}: {exc}")
    return None


def _classify_db_error(exc: Exception, context: str) -> HTTPException:
    """Translate Supabase/PostgREST exceptions into meaningful HTTP errors."""
    msg = str(exc)
    logger.error(f"[visa] DB error in {context}: {msg}")

    if "violates foreign key constraint" in msg:
        return HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Operation failed: related record does not exist.",
        )
    if "violates not-null constraint" in msg:
        return HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Operation failed: a required field is missing. Detail: {msg}",
        )
    if "duplicate key" in msg or "unique constraint" in msg:
        return HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Application with this passport number already exists for your organization.",
        )
    if "permission denied" in msg or "row-level security" in msg.lower():
        return HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Database permission denied. Check RLS policies.",
        )
    return HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail=f"Database operation failed in {context}: {msg}",
    )


# ─── POST /applications ───────────────────────────────────────────────────────

@router.post(
    "/applications",
    response_model=VisaApplicationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_visa_application(
    application: VisaApplicationCreate,
    token: AuthToken = Depends(require_auth),
    supabase: Any = Depends(get_supabase),
) -> VisaApplicationResponse:
    """
    Create a new visa application.
    
    **Requires:** ``Authorization: Bearer <supabase_access_token>``
    
    Default status is 1 (Documents Collected).
    """
    profile_id = _resolve_profile_id(supabase, token.user_id)
    if not profile_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No profile found for this account.",
        )

    data = application.model_dump(exclude_none=False)
    data["created_by"] = profile_id
    # Remove fields managed by DB
    for col in ("id", "created_at", "updated_at"):
        data.pop(col, None)

    try:
        response = supabase.table(_TABLE).insert(data).execute()
        inserted = response.data[0] if response.data else None
        
        if not inserted:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create visa application.",
            )
        
        # Add status name
        inserted["status_name"] = _STATUS_NAMES.get(inserted["status"])
        
        logger.info(
            f"[visa] Created application {inserted['id']} for "
            f"{application.client_name} by user={token.user_id}"
        )
        
        return VisaApplicationResponse(**inserted)
        
    except HTTPException:
        raise
    except Exception as exc:
        raise _classify_db_error(exc, "create_visa_application")


# ─── GET /applications ────────────────────────────────────────────────────────

@router.get("/applications", response_model=SearchResponse)
async def search_visa_applications(
    token: AuthToken = Depends(require_auth),
    supabase: Any = Depends(get_supabase),
    # Filters
    client_name: Optional[str] = Query(None, description="Filter by client name (partial match)"),
    passport_number: Optional[str] = Query(None, description="Filter by passport number (exact match)"),
    destination_country: Optional[str] = Query(None, description="Filter by destination country (partial match)"),
    status: Optional[int] = Query(None, ge=1, le=7, description="Filter by status (1-7)"),
    # Pagination
    limit: int = Query(50, ge=1, le=200, description="Max records to return"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
) -> SearchResponse:
    """
    Search visa applications belonging to the authenticated user.
    
    **Requires:** ``Authorization: Bearer <supabase_access_token>``
    """
    profile_id = _resolve_profile_id(supabase, token.user_id)

    try:
        query = supabase.table(_TABLE).select("*", count="exact")

        # Ownership filter
        if profile_id:
            query = query.eq("created_by", profile_id)
        else:
            logger.warning(
                f"Profile not found for auth user {token.user_id}; "
                "returning empty search results."
            )
            return SearchResponse(
                results=[],
                count=0,
                filters_applied={"warning": "No profile found for this user."},
            )

        # Optional filters
        if client_name:
            query = query.ilike("client_name", f"%{client_name}%")
        if passport_number:
            query = query.eq("passport_number", passport_number)
        if destination_country:
            query = query.ilike("destination_country", f"%{destination_country}%")
        if status is not None:
            query = query.eq("status", status)

        # Ordering & pagination
        query = (
            query
            .order("created_at", desc=True)
            .range(offset, offset + limit - 1)
        )

        response = query.execute()
        results: List[Dict[str, Any]] = response.data or []
        total_count: int = response.count if response.count is not None else len(results)

        # Add status names to results
        for result in results:
            result["status_name"] = _STATUS_NAMES.get(result["status"])

        logger.info(
            f"[visa] search: {len(results)} results (total={total_count}) "
            f"for user={token.user_id}"
        )

        return SearchResponse(
            results=results,
            count=total_count,
            filters_applied={
                "client_name": client_name,
                "passport_number": passport_number,
                "destination_country": destination_country,
                "status": status,
                "limit": limit,
                "offset": offset,
            },
        )

    except HTTPException:
        raise
    except Exception as exc:
        raise _classify_db_error(exc, "search_visa_applications")


# ─── GET /applications/{id} ───────────────────────────────────────────────────

@router.get("/applications/{application_id}", response_model=VisaApplicationResponse)
async def get_visa_application(
    application_id: str,
    token: AuthToken = Depends(require_auth),
    supabase: Any = Depends(get_supabase),
) -> VisaApplicationResponse:
    """
    Get a single visa application by ID.
    
    **Requires:** ``Authorization: Bearer <supabase_access_token>``
    """
    profile_id = _resolve_profile_id(supabase, token.user_id)
    if not profile_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No profile found for this account.",
        )

    try:
        response = (
            supabase.table(_TABLE)
            .select("*")
            .eq("id", application_id)
            .eq("created_by", profile_id)
            .limit(1)
            .execute()
        )
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Visa application {application_id} not found.",
            )
        
        result = response.data[0]
        result["status_name"] = _STATUS_NAMES.get(result["status"])
        
        return VisaApplicationResponse(**result)
        
    except HTTPException:
        raise
    except Exception as exc:
        raise _classify_db_error(exc, f"get_visa_application({application_id})")


# ─── PATCH /applications/{id} ─────────────────────────────────────────────────

@router.patch("/applications/{application_id}", response_model=VisaApplicationResponse)
async def update_visa_application(
    application_id: str,
    updates: VisaApplicationUpdate,
    token: AuthToken = Depends(require_auth),
    supabase: Any = Depends(get_supabase),
) -> VisaApplicationResponse:
    """
    Update a visa application (partial update).
    
    **Requires:** ``Authorization: Bearer <supabase_access_token>``
    """
    profile_id = _resolve_profile_id(supabase, token.user_id)
    if not profile_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No profile found for this account.",
        )

    data = updates.model_dump(exclude_none=True)
    if not data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields provided to update.",
        )

    try:
        response = (
            supabase.table(_TABLE)
            .update(data)
            .eq("id", application_id)
            .eq("created_by", profile_id)
            .execute()
        )
        
        updated = response.data or []
        if not updated:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Visa application {application_id} not found or not owned by this account.",
            )
        
        result = updated[0]
        result["status_name"] = _STATUS_NAMES.get(result["status"])
        
        logger.info(f"[visa] Updated application {application_id} by user={token.user_id}")
        
        return VisaApplicationResponse(**result)
        
    except HTTPException:
        raise
    except Exception as exc:
        raise _classify_db_error(exc, f"update_visa_application({application_id})")


# ─── PATCH /applications/{id}/status ──────────────────────────────────────────

@router.patch("/applications/{application_id}/status", response_model=StatusUpdateResponse)
async def update_visa_status(
    application_id: str,
    new_status: int = Query(..., ge=1, le=7, description="New status (1-7)"),
    token: AuthToken = Depends(require_auth),
    supabase: Any = Depends(get_supabase),
) -> StatusUpdateResponse:
    """
    Update only the status of a visa application.
    
    **Requires:** ``Authorization: Bearer <supabase_access_token>``
    
    This is a convenience endpoint for the status tracking workflow.
    """
    profile_id = _resolve_profile_id(supabase, token.user_id)
    if not profile_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No profile found for this account.",
        )

    if new_status not in _VALID_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status {new_status}. Must be between 1 and 7.",
        )

    try:
        response = (
            supabase.table(_TABLE)
            .update({"status": new_status})
            .eq("id", application_id)
            .eq("created_by", profile_id)
            .execute()
        )
        
        updated = response.data or []
        if not updated:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Visa application {application_id} not found or not owned by this account.",
            )
        
        logger.info(
            f"[visa] Updated status of {application_id} to {new_status} "
            f"by user={token.user_id}"
        )
        
        return StatusUpdateResponse(
            success=True,
            application_id=application_id,
            new_status=new_status,
            status_name=_STATUS_NAMES[new_status],
            message=f"Status updated to: {_STATUS_NAMES[new_status]}",
        )
        
    except HTTPException:
        raise
    except Exception as exc:
        raise _classify_db_error(exc, f"update_visa_status({application_id})")


# ─── PATCH /applications/{id}/appointment ─────────────────────────────────────

@router.patch("/applications/{application_id}/appointment")
async def update_appointment_date(
    application_id: str,
    appointment_date: str = Query(..., description="Appointment date (YYYY-MM-DD)"),
    appointment_notes: Optional[str] = Query(None, description="Optional notes"),
    token: AuthToken = Depends(require_auth),
    supabase: Any = Depends(get_supabase),
) -> Dict[str, Any]:
    """
    Update the embassy appointment date for a visa application.
    
    **Requires:** ``Authorization: Bearer <supabase_access_token>``
    """
    profile_id = _resolve_profile_id(supabase, token.user_id)
    if not profile_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No profile found for this account.",
        )

    data = {"appointment_date": appointment_date}
    if appointment_notes:
        data["appointment_notes"] = appointment_notes

    try:
        response = (
            supabase.table(_TABLE)
            .update(data)
            .eq("id", application_id)
            .eq("created_by", profile_id)
            .execute()
        )
        
        updated = response.data or []
        if not updated:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Visa application {application_id} not found or not owned by this account.",
            )
        
        logger.info(
            f"[visa] Updated appointment date of {application_id} to {appointment_date} "
            f"by user={token.user_id}"
        )
        
        return {
            "success": True,
            "application_id": application_id,
            "appointment_date": appointment_date,
            "message": "Appointment date updated successfully.",
        }
        
    except HTTPException:
        raise
    except Exception as exc:
        raise _classify_db_error(exc, f"update_appointment_date({application_id})")


# ─── DELETE /applications/{id} ────────────────────────────────────────────────

@router.delete("/applications/{application_id}", status_code=status.HTTP_200_OK)
async def delete_visa_application(
    application_id: str,
    token: AuthToken = Depends(require_auth),
    supabase: Any = Depends(get_supabase),
) -> Dict[str, Any]:
    """
    Delete a visa application.
    
    **Requires:** ``Authorization: Bearer <supabase_access_token>``
    
    Only the owner can delete an application.
    """
    profile_id = _resolve_profile_id(supabase, token.user_id)
    if not profile_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No profile found for this account.",
        )

    try:
        response = (
            supabase.table(_TABLE)
            .delete()
            .eq("id", application_id)
            .eq("created_by", profile_id)
            .execute()
        )
        
        deleted = response.data or []
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Visa application {application_id} not found or not owned by this account.",
            )
        
        logger.info(f"[visa] Deleted application {application_id} by user={token.user_id}")
        
        return {"success": True, "deleted_id": application_id}
        
    except HTTPException:
        raise
    except Exception as exc:
        raise _classify_db_error(exc, f"delete_visa_application({application_id})")


# ─── GET /status-summary ──────────────────────────────────────────────────────

@router.get("/status-summary")
async def get_status_summary(
    token: AuthToken = Depends(require_auth),
    supabase: Any = Depends(get_supabase),
) -> Dict[str, Any]:
    """
    Get a count of applications by status for the authenticated user.
    
    **Requires:** ``Authorization: Bearer <supabase_access_token>``
    
    Returns counts for each status (1-7).
    """
    profile_id = _resolve_profile_id(supabase, token.user_id)

    try:
        response = (
            supabase.table(_TABLE)
            .select("status", count="exact")
            .eq("created_by", profile_id)
            .execute()
        )
        
        applications = response.data or []
        
        # Count by status
        status_counts = {i: 0 for i in range(1, 8)}
        for app in applications:
            status_counts[app["status"]] = status_counts.get(app["status"], 0) + 1
        
        return {
            "total": len(applications),
            "by_status": {
                _STATUS_NAMES[status]: count
                for status, count in status_counts.items()
            },
            "status_counts": status_counts,
        }
        
    except Exception as exc:
        raise _classify_db_error(exc, "get_status_summary")


# ─── Public / monitoring ──────────────────────────────────────────────────────

@router.get("/health")
async def visa_health() -> Dict[str, Any]:
    """Visa service health check. Public endpoint — no auth required."""
    return {"status": "operational", "service": "visa_management"}
