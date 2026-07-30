"""
Document Processing Router
==========================
Handles Excel / CSV / DOCX parsing for hotel-data ingestion.

Authentication
--------------
The /parse-hotel-data endpoint requires a valid Supabase Bearer token.
The parsed result is tagged with the authenticated user_id so downstream
bulk-insert calls can maintain data-isolation.
"""
from __future__ import annotations

import io
import re
from typing import Any, Dict, List, Optional, Tuple

import pandas as pd
from docx import Document
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel

from app.core.security import AuthToken, require_auth

router = APIRouter()


# ─── Schemas ─────────────────────────────────────────────────────────────────

class HotelDataRecord(BaseModel):
    hotel_name: str
    hotel_location: Optional[str] = None
    hotel_city: str
    hotel_country: str
    hotel_rating: Optional[float] = None
    hotel_category: Optional[str] = None
    room_type: str
    board_basis: Optional[str] = None
    price_per_night: float
    price_currency: str = "EGP"
    special_offer_price: Optional[float] = None
    available_from: str
    available_to: str
    booking_deadline: Optional[str] = None
    max_occupancy: Optional[int] = None
    available_rooms: Optional[int] = None
    description: Optional[str] = None
    terms_conditions: Optional[str] = None
    cancellation_policy: Optional[str] = None


class DocumentParseResponse(BaseModel):
    success: bool
    file_name: str
    file_type: str
    records_count: int
    records: List[HotelDataRecord]
    errors: List[str]
    # Caller can forward this user_id to the bulk-insert endpoint
    parsed_by: str


# ─── Column mapping (shared by all parsers) ──────────────────────────────────

_COLUMN_MAP: Dict[str, str] = {
    "hotel name": "hotel_name",
    "location": "hotel_location",
    "city": "hotel_city",
    "country": "hotel_country",
    "rating": "hotel_rating",
    "category": "hotel_category",
    "room type": "room_type",
    "board basis": "board_basis",
    "price per night": "price_per_night",
    "price": "price_per_night",
    "currency": "price_currency",
    "special price": "special_offer_price",
    "available from": "available_from",
    "available to": "available_to",
    "booking deadline": "booking_deadline",
    "max occupancy": "max_occupancy",
    "available rooms": "available_rooms",
    "description": "description",
    "terms": "terms_conditions",
    "cancellation policy": "cancellation_policy",
}

_DEFAULTS: Dict[str, Any] = {
    "hotel_city": "Cairo",
    "hotel_country": "Egypt",
    "price_currency": "EGP",
    "price_per_night": 0.0,
    "available_from": "2025-01-01",
    "available_to": "2025-12-31",
}


# ─── Protected endpoint ───────────────────────────────────────────────────────

@router.post("/parse-hotel-data", response_model=DocumentParseResponse)
async def parse_hotel_data(
    file: UploadFile = File(...),
    token: AuthToken = Depends(require_auth),
) -> DocumentParseResponse:
    """
    Parse an uploaded Excel / CSV / DOCX file and extract hotel data.

    **Requires:** ``Authorization: Bearer <supabase_access_token>``

    The ``parsed_by`` field in the response contains the authenticated
    ``user_id`` so the caller can pass it straight to ``POST /hotels/bulk-insert``.

    Supported formats: ``.xlsx``, ``.xls``, ``.csv``, ``.docx``
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided.")

    file_extension = file.filename.rsplit(".", 1)[-1].lower()
    content = await file.read()

    records: List[HotelDataRecord] = []
    errors: List[str] = []

    if file_extension in ("xlsx", "xls"):
        records, errors = await _parse_excel(content, file.filename)
    elif file_extension == "csv":
        records, errors = await _parse_csv(content, file.filename)
    elif file_extension == "docx":
        records, errors = await _parse_docx(content, file.filename)
    else:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Unsupported file format: .{file_extension}. "
                "Supported formats: xlsx, xls, csv, docx"
            ),
        )

    return DocumentParseResponse(
        success=len(errors) == 0,
        file_name=file.filename,
        file_type=file_extension,
        records_count=len(records),
        records=records,
        errors=errors,
        parsed_by=token.user_id,
    )


# ─── Public / monitoring ──────────────────────────────────────────────────────

@router.get("/health")
async def documents_health() -> dict:
    """Document processing health check. Public endpoint."""
    return {"status": "operational", "service": "document_processing"}


# ─── Internal parser helpers ─────────────────────────────────────────────────

def _df_to_records(
    df: pd.DataFrame, filename: str
) -> Tuple[List[HotelDataRecord], List[str]]:
    """Convert a normalised DataFrame into validated HotelDataRecord objects."""
    errors: List[str] = []
    records: List[HotelDataRecord] = []

    df.columns = df.columns.str.lower().str.strip()

    for idx, row in df.iterrows():
        try:
            record_data: Dict[str, Any] = {}

            for col in df.columns:
                if col in _COLUMN_MAP:
                    val = row[col]
                    record_data[_COLUMN_MAP[col]] = (
                        val if (not isinstance(val, float) or not pd.isna(val)) else None
                    )

            if not record_data.get("hotel_name") or not record_data.get("room_type"):
                errors.append(
                    f"Row {idx + 2}: Missing required fields (hotel_name or room_type)"
                )
                continue

            for key, default in _DEFAULTS.items():
                record_data.setdefault(key, default)

            records.append(HotelDataRecord(**record_data))

        except Exception as exc:
            errors.append(f"Row {idx + 2}: {exc}")

    return records, errors


async def _parse_excel(
    content: bytes, filename: str
) -> Tuple[List[HotelDataRecord], List[str]]:
    try:
        df = pd.read_excel(io.BytesIO(content), engine="openpyxl")
        return _df_to_records(df, filename)
    except Exception as exc:
        return [], [f"Excel parsing error: {exc}"]


async def _parse_csv(
    content: bytes, filename: str
) -> Tuple[List[HotelDataRecord], List[str]]:
    try:
        df = pd.read_csv(io.BytesIO(content))
        return _df_to_records(df, filename)
    except Exception as exc:
        return [], [f"CSV parsing error: {exc}"]


async def _parse_docx(
    content: bytes, filename: str
) -> Tuple[List[HotelDataRecord], List[str]]:
    all_records: List[HotelDataRecord] = []
    all_errors: List[str] = []

    try:
        doc = Document(io.BytesIO(content))

        for table_idx, table in enumerate(doc.tables):
            try:
                keys: Optional[List[str]] = None
                data: List[Dict[str, str]] = []

                for i, row in enumerate(table.rows):
                    text = [cell.text.strip() for cell in row.cells]
                    if i == 0:
                        keys = [k.lower() for k in text]
                    elif keys:
                        data.append(dict(zip(keys, text)))

                if not data:
                    continue

                df = pd.DataFrame(data)
                t_records, t_errors = _df_to_records(df, f"{filename}_table_{table_idx}")
                all_records.extend(t_records)
                all_errors.extend(t_errors)

            except Exception as exc:
                all_errors.append(f"Table {table_idx + 1}: {exc}")

    except Exception as exc:
        all_errors.append(f"DOCX parsing error: {exc}")

    return all_records, all_errors
