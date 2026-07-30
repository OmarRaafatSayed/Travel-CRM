"""
Payments Router
===============
Full CRUD for payment_records table.

Table: public.payment_records
Statuses: pending | partial | full | refunded | cancelled
Methods:  cash | bank | pos | cheque
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field, field_validator

from app.core.security import AuthToken, require_auth
from app.services.supabase_client import get_supabase

logger = logging.getLogger(__name__)
router = APIRouter()

_TABLE          = "payment_records"
_PROFILES_TABLE = "profiles"

_VALID_STATUSES = {"pending", "partial", "full", "refunded", "cancelled"}
_VALID_METHODS  = {"cash", "bank", "pos", "cheque"}


# ── Schemas ───────────────────────────────────────────────────────────────────

class PaymentCreate(BaseModel):
    client_name:       str            = Field(..., min_length=1, max_length=255)
    booking_reference: Optional[str]  = Field(None, max_length=100)
    amount:            float          = Field(..., gt=0)
    payment_method:    str            = Field(..., description="cash | bank | pos | cheque")
    status:            str            = Field("pending", description="pending | partial | full | refunded | cancelled")
    payment_date:      Optional[str]  = Field(None, description="YYYY-MM-DD")
    notes:             Optional[str]  = None

    @field_validator("payment_method")
    @classmethod
    def method_valid(cls, v: str) -> str:
        if v not in _VALID_METHODS:
            raise ValueError(f"payment_method must be one of {_VALID_METHODS}")
        return v

    @field_validator("status")
    @classmethod
    def status_valid(cls, v: str) -> str:
        if v not in _VALID_STATUSES:
            raise ValueError(f"status must be one of {_VALID_STATUSES}")
        return v


class PaymentUpdate(BaseModel):
    client_name:       Optional[str]   = Field(None, min_length=1, max_length=255)
    booking_reference: Optional[str]   = Field(None, max_length=100)
    amount:            Optional[float] = Field(None, gt=0)
    payment_method:    Optional[str]   = None
    status:            Optional[str]   = None
    payment_date:      Optional[str]   = None
    notes:             Optional[str]   = None

    @field_validator("payment_method")
    @classmethod
    def method_valid(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in _VALID_METHODS:
            raise ValueError(f"payment_method must be one of {_VALID_METHODS}")
        return v

    @field_validator("status")
    @classmethod
    def status_valid(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in _VALID_STATUSES:
            raise ValueError(f"status must be one of {_VALID_STATUSES}")
        return v


class PaymentResponse(BaseModel):
    id:                str
    client_name:       str
    booking_reference: Optional[str]  = None
    amount:            float
    payment_method:    str
    status:            str
    payment_date:      Optional[str]  = None
    notes:             Optional[str]  = None
    organization_id:   Optional[str]  = None
    created_by:        Optional[str]  = None
    created_at:        Optional[str]  = None
    updated_at:        Optional[str]  = None
    model_config = {"extra": "allow"}


class PaymentSearchResponse(BaseModel):
    results: List[Dict[str, Any]]
    count:   int
    filters_applied: Dict[str, Any]


class StatusSummaryResponse(BaseModel):
    total: int
    by_status: Dict[str, int]


# ── Helpers ───────────────────────────────────────────────────────────────────

def _profile_id(supabase: Any, user_id: str) -> Optional[str]:
    try:
        r = supabase.table(_PROFILES_TABLE).select("id").eq("user_id", user_id).limit(1).execute()
        if r.data:
            return str(r.data[0]["id"])
    except Exception as e:
        logger.warning(f"Profile lookup failed: {e}")
    return None


def _db_error(exc: Exception, ctx: str) -> HTTPException:
    msg = str(exc)
    logger.error(f"[payments] DB error in {ctx}: {msg}")
    if "duplicate key" in msg or "unique constraint" in msg:
        return HTTPException(status_code=409, detail="Duplicate booking reference.")
    if "permission denied" in msg:
        return HTTPException(status_code=403, detail="Permission denied.")
    return HTTPException(status_code=500, detail=f"Database error in {ctx}: {msg}")


# ── POST /payments ────────────────────────────────────────────────────────────

@router.post("/payments", response_model=PaymentResponse, status_code=201)
async def create_payment(
    body: PaymentCreate,
    token: AuthToken = Depends(require_auth),
    supabase: Any = Depends(get_supabase),
):
    pid = _profile_id(supabase, token.user_id)
    if not pid:
        raise HTTPException(403, "No profile found for this account.")
    data = body.model_dump(exclude_none=False)
    data["created_by"] = pid
    for col in ("id", "created_at", "updated_at"):
        data.pop(col, None)
    try:
        r = supabase.table(_TABLE).insert(data).execute()
        row = r.data[0] if r.data else None
        if not row:
            raise HTTPException(500, "Insert returned no data.")
        logger.info(f"[payments] created {row['id']} by {token.user_id}")
        return PaymentResponse(**row)
    except HTTPException:
        raise
    except Exception as exc:
        raise _db_error(exc, "create_payment")


# ── GET /payments ─────────────────────────────────────────────────────────────

@router.get("/payments", response_model=PaymentSearchResponse)
async def search_payments(
    token: AuthToken = Depends(require_auth),
    supabase: Any = Depends(get_supabase),
    client_name:       Optional[str]   = Query(None),
    booking_reference: Optional[str]   = Query(None),
    status:            Optional[str]   = Query(None),
    payment_method:    Optional[str]   = Query(None),
    date_from:         Optional[str]   = Query(None, description="YYYY-MM-DD"),
    date_to:           Optional[str]   = Query(None, description="YYYY-MM-DD"),
    limit:             int             = Query(100, ge=1, le=500),
    offset:            int             = Query(0, ge=0),
):
    pid = _profile_id(supabase, token.user_id)
    if not pid:
        return PaymentSearchResponse(results=[], count=0, filters_applied={})
    try:
        q = supabase.table(_TABLE).select("*", count="exact").eq("created_by", pid)
        if client_name:       q = q.ilike("client_name", f"%{client_name}%")
        if booking_reference: q = q.ilike("booking_reference", f"%{booking_reference}%")
        if status:            q = q.eq("status", status)
        if payment_method:    q = q.eq("payment_method", payment_method)
        if date_from:         q = q.gte("payment_date", date_from)
        if date_to:           q = q.lte("payment_date", date_to)
        q = q.order("created_at", desc=True).range(offset, offset + limit - 1)
        r = q.execute()
        results = r.data or []
        total   = r.count if r.count is not None else len(results)
        return PaymentSearchResponse(
            results=results, count=total,
            filters_applied=dict(client_name=client_name, booking_reference=booking_reference,
                                 status=status, payment_method=payment_method,
                                 date_from=date_from, date_to=date_to),
        )
    except Exception as exc:
        raise _db_error(exc, "search_payments")


# ── GET /payments/summary ─────────────────────────────────────────────────────

@router.get("/payments/summary", response_model=StatusSummaryResponse)
async def payments_summary(
    token: AuthToken = Depends(require_auth),
    supabase: Any = Depends(get_supabase),
):
    pid = _profile_id(supabase, token.user_id)
    try:
        r = supabase.table(_TABLE).select("status").eq("created_by", pid).execute()
        rows = r.data or []
        by_status: Dict[str, int] = {s: 0 for s in _VALID_STATUSES}
        for row in rows:
            s = row.get("status", "")
            if s in by_status:
                by_status[s] += 1
        return StatusSummaryResponse(total=len(rows), by_status=by_status)
    except Exception as exc:
        raise _db_error(exc, "payments_summary")


# ── PATCH /payments/{id} ──────────────────────────────────────────────────────

@router.patch("/payments/{payment_id}", response_model=PaymentResponse)
async def update_payment(
    payment_id: str,
    body: PaymentUpdate,
    token: AuthToken = Depends(require_auth),
    supabase: Any = Depends(get_supabase),
):
    pid = _profile_id(supabase, token.user_id)
    if not pid:
        raise HTTPException(403, "No profile found.")
    data = body.model_dump(exclude_none=True)
    if not data:
        raise HTTPException(400, "No fields to update.")
    try:
        r = supabase.table(_TABLE).update(data).eq("id", payment_id).eq("created_by", pid).execute()
        rows = r.data or []
        if not rows:
            raise HTTPException(404, f"Payment {payment_id} not found.")
        return PaymentResponse(**rows[0])
    except HTTPException:
        raise
    except Exception as exc:
        raise _db_error(exc, f"update_payment({payment_id})")


# ── DELETE /payments/{id} ─────────────────────────────────────────────────────

@router.delete("/payments/{payment_id}", status_code=200)
async def delete_payment(
    payment_id: str,
    token: AuthToken = Depends(require_auth),
    supabase: Any = Depends(get_supabase),
) -> Dict[str, Any]:
    pid = _profile_id(supabase, token.user_id)
    if not pid:
        raise HTTPException(403, "No profile found.")
    try:
        r = supabase.table(_TABLE).delete().eq("id", payment_id).eq("created_by", pid).execute()
        if not r.data:
            raise HTTPException(404, f"Payment {payment_id} not found.")
        return {"success": True, "deleted_id": payment_id}
    except HTTPException:
        raise
    except Exception as exc:
        raise _db_error(exc, f"delete_payment({payment_id})")


# ── GET /payments/health ──────────────────────────────────────────────────────

@router.get("/payments/health")
async def payments_health() -> Dict[str, Any]:
    return {"status": "operational", "service": "payments"}
