"""Auth helper endpoints for user registration and login"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from supabase import create_client
import os
from datetime import datetime

router = APIRouter()

# Supabase client
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(supabase_url, supabase_key)


class SignUpRequest(BaseModel):
    email: str
    password: str
    first_name: str = ""
    last_name: str = ""


class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/signup")
async def signup(request: SignUpRequest) -> dict:
    """
    User signup endpoint.
    Creates auth user and associated profile.
    Includes auto-organization creation for Travel Agency.
    """
    try:
        # Create auth user using correct supabase-py v2.x syntax
        auth_response = supabase.auth.sign_up({
            "email": request.email,
            "password": request.password,
            "options": {
                "data": {
                    "first_name": request.first_name,
                    "last_name": request.last_name,
                    "full_name": f"{request.first_name} {request.last_name}"
                }
            }
        })

        if not auth_response.user:
            raise HTTPException(status_code=400, detail="Signup failed")

        user_id = auth_response.user.id

        # Create profile entry
        organization_id = None
        try:
            # Create a default organization for the user
            try:
                default_org_name = f"{request.first_name or request.email.split('@')[0]}'s Organization"
                
                # Create a default organization via RPC with creator_id
                org_response = supabase.rpc('create_organization_with_admin', {
                    "org_name": default_org_name,
                    "org_slug": request.email.split('@')[0],
                    "org_description": f"Default organization for {request.email}",
                    "creator_id": user_id
                }).execute()
                
                if org_response.data:
                    organization_id = org_response.data[0]['id'] if isinstance(org_response.data, list) else org_response.data.get('id')
                    print(f"✅ Default organization created: {organization_id}")
                else:
                    print(f"⚠️  Could not create default organization: {org_response}")
            except Exception as org_error:
                print(f"⚠️  Default organization creation warning: {org_error}")
                # Don't fail signup if organization creation fails
            
            profile_data = {
                "user_id": user_id,
                "email": request.email,
                "first_name": request.first_name,
                "last_name": request.last_name,
                "role": "user",
                "organization_id": organization_id,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat(),
            }
            
            supabase.table("profiles").insert(profile_data).execute()
            print(f"✅ Profile created with organization_id: {organization_id}")
        except Exception as profile_error:
            print(f"⚠️  Profile creation warning: {profile_error}")
            # Don't fail signup if profile creation fails

        return {
            "success": True,
            "user_id": user_id,
            "email": request.email,
            "organization_id": organization_id,
            "message": "Signup successful. Check your email for confirmation."
        }

    except Exception as e:
        error_msg = str(e)
        if "already registered" in error_msg.lower():
            raise HTTPException(status_code=400, detail="Email already registered")
        raise HTTPException(status_code=400, detail=f"Signup failed: {error_msg}")


@router.post("/login")
async def login(request: LoginRequest) -> dict:
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
            }
        }

    except Exception as e:
        error_msg = str(e)
        if "invalid" in error_msg.lower():
            raise HTTPException(status_code=401, detail="Invalid email or password")
        raise HTTPException(status_code=400, detail=f"Login failed: {error_msg}")


@router.get("/health")
async def auth_health() -> dict:
    """Health check for auth service"""
    return {
        "status": "healthy",
        "service": "auth_service",
        "supabase_url": supabase_url,
    }
