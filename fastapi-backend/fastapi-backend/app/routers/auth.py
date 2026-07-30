"""
Auth helper endpoints for user registration and login.

Security note: The Supabase client is NOT initialised at module import time.
It is resolved lazily via dependency injection (get_supabase) so that:
  - Missing environment variables are caught at startup (see main.py fail-fast).
  - Unit tests can substitute a mock client without monkey-patching globals.
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from supabase import Client
from datetime import datetime
import os

from app.services.supabase_client import get_supabase

router = APIRouter()


# ---------------------------------------------------------------------------
# Request / Response schemas
# ---------------------------------------------------------------------------

class SignUpRequest(BaseModel):
    email: str
    password: str
    first_name: str = ""
    last_name: str = ""


class LoginRequest(BaseModel):
    email: str
    password: str


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/signup")
async def signup(
    request: SignUpRequest,
    supabase: Client = Depends(get_supabase),
) -> dict:
    """
    User signup endpoint.
    Creates auth user and associated profile.
    Includes auto-organisation creation for Travel Agency.
    """
    try:
        auth_response = supabase.auth.sign_up({
            "email": request.email,
            "password": request.password,
            "options": {
                "data": {
                    "first_name": request.first_name,
                    "last_name": request.last_name,
                    "full_name": f"{request.first_name} {request.last_name}",
                }
            },
        })

        if not auth_response.user:
            raise HTTPException(status_code=400, detail="Signup failed")

        user_id = auth_response.user.id
        organization_id = None

        try:
            default_org_name = (
                f"{request.first_name or request.email.split('@')[0]}'s Organisation"
            )
            org_response = supabase.rpc(
                "create_organization_with_admin",
                {
                    "org_name": default_org_name,
                    "org_slug": request.email.split("@")[0],
                    "org_description": f"Default organisation for {request.email}",
                    "creator_id": user_id,
                },
            ).execute()

            if org_response.data:
                organization_id = (
                    org_response.data[0]["id"]
                    if isinstance(org_response.data, list)
                    else org_response.data.get("id")
                )
                print(f"✅ Default organisation created: {organization_id}")
        except Exception as org_error:
            # Non-fatal — signup continues without an organisation
            print(f"⚠️  Organisation creation warning: {org_error}")

        try:
            profile_data = {
                "user_id":    user_id,
                "email":      request.email,
                "first_name": request.first_name,
                "last_name":  request.last_name,
                "role":       "user",
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat(),
            }
            # Include organization_id only if the column exists (non-fatal either way)
            if organization_id:
                profile_data["organization_id"] = organization_id
            supabase.table("profiles").insert(profile_data).execute()
            print(f"✅ Profile created for user: {user_id}")
        except Exception as profile_error:
            # Non-fatal — auth user was created; profile can be backfilled
            print(f"⚠️  Profile creation warning: {profile_error}")

        # Auto-login after signup so the frontend gets a usable session
        session_data = None
        try:
            login_response = supabase.auth.sign_in_with_password({
                "email": request.email,
                "password": request.password,
            })
            if login_response.session:
                session_data = {
                    "access_token":  login_response.session.access_token,
                    "refresh_token": login_response.session.refresh_token,
                }
        except Exception:
            pass  # session optional — frontend can ask user to log in manually

        return {
            "success": True,
            "user": {
                "id":    str(user_id),
                "email": request.email,
            },
            "session":         session_data,
            "organization_id": organization_id,
            "message":         "Signup successful.",
        }

    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        if "already registered" in error_msg.lower():
            raise HTTPException(status_code=400, detail="Email already registered")
        raise HTTPException(status_code=400, detail=f"Signup failed: {error_msg}")


@router.post("/login")
async def login(
    request: LoginRequest,
    supabase: Client = Depends(get_supabase),
) -> dict:
    """
    User login endpoint.
    Returns auth token if credentials are valid.
    """
    try:
        auth_response = supabase.auth.sign_in_with_password({
            "email": request.email,
            "password": request.password,
        })

        if not auth_response.user:
            raise HTTPException(status_code=401, detail="Invalid email or password")

        return {
            "success": True,
            "user": {
                "id": auth_response.user.id,
                "email": auth_response.user.email,
            },
            "session": {
                "access_token": auth_response.session.access_token,
                "refresh_token": auth_response.session.refresh_token,
            },
        }

    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        if "invalid" in error_msg.lower():
            raise HTTPException(status_code=401, detail="Invalid email or password")
        raise HTTPException(status_code=400, detail=f"Login failed: {error_msg}")


@router.get("/health")
async def auth_health(supabase: Client = Depends(get_supabase)) -> dict:
    """Health check for auth service — confirms Supabase client is reachable."""
    supabase_url = os.getenv("SUPABASE_URL", "")
    # Only expose the project hostname, never a key
    safe_url = supabase_url.split("//")[-1].split(".")[0] if supabase_url else "unknown"
    return {
        "status": "healthy",
        "service": "auth_service",
        "supabase_project": safe_url,
    }
