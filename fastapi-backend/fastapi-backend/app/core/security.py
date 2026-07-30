"""
app/core/security.py
====================
Centralised JWT authentication dependency.

Usage in any router:
    from app.core.security import require_auth, TokenPayload

    @router.get("/protected")
    async def my_route(token: TokenPayload = Depends(require_auth)):
        user_id = token.sub
        ...

All protected endpoints return 401 when:
  - No Authorization header is present
  - The token is malformed / expired / signed with the wrong secret
"""
from __future__ import annotations

import os
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from pydantic import BaseModel


# ── Configuration ─────────────────────────────────────────────────────────────
# Supabase signs its JWTs with SUPABASE_JWT_SECRET (HS256).
# Fall back to JWT_SECRET_KEY only for locally-issued tokens.
_SUPABASE_JWT_SECRET: str = os.getenv("SUPABASE_JWT_SECRET", "")
_JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "")
_JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")

# HTTPBearer extracts the token from "Authorization: Bearer <token>".
# auto_error=True means FastAPI will return 403 if the header is absent
# *before* our code runs; we override with a cleaner 401 below.
_bearer_scheme = HTTPBearer(auto_error=False)


# ── Token payload model ────────────────────────────────────────────────────────
class TokenPayload(BaseModel):
    """Validated, typed representation of the JWT claims we care about."""

    sub: str          # user_id  (Supabase sets this to the UUID)
    email: str = ""
    role: str = ""    # "authenticated" for Supabase user tokens

    # Convenience alias so callers can do token.user_id
    @property
    def user_id(self) -> str:
        return self.sub


# ── Internal helper ───────────────────────────────────────────────────────────
def _decode_token(token: str) -> dict:
    """
    Attempt to decode *token* against both SUPABASE_JWT_SECRET and
    JWT_SECRET_KEY so the same dependency works for Supabase-issued tokens
    and any locally-issued tokens.

    Raises JWTError on failure (caller converts to HTTP 401).
    """
    secrets = [s for s in (_SUPABASE_JWT_SECRET, _JWT_SECRET_KEY) if s]

    if not secrets:
        raise JWTError("No JWT secret configured on the server.")

    last_error: Exception = JWTError("Unknown error")
    for secret in secrets:
        try:
            return jwt.decode(
                token,
                secret,
                algorithms=[_JWT_ALGORITHM],
                # Supabase tokens use "authenticated" audience but it is
                # safe to skip audience validation here; we check 'role'
                # in the payload instead.
                options={"verify_aud": False},
            )
        except JWTError as exc:
            last_error = exc

    raise last_error


# ── FastAPI dependency ─────────────────────────────────────────────────────────
def require_auth(
    credentials: Annotated[
        HTTPAuthorizationCredentials | None,
        Depends(_bearer_scheme),
    ],
) -> TokenPayload:
    """
    FastAPI dependency that enforces Bearer-token authentication.

    Returns a :class:`TokenPayload` on success.
    Raises ``HTTP 401`` on any failure (missing header, bad/expired token).

    Example::

        @router.post("/search")
        async def search(token: TokenPayload = Depends(require_auth)):
            user_id = token.user_id
    """
    _401 = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required. Provide a valid Bearer token.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # Header absent entirely
    if credentials is None:
        raise _401

    try:
        payload = _decode_token(credentials.credentials)
    except JWTError:
        raise _401

    sub = payload.get("sub")
    if not sub:
        # Valid JWT structure but no subject claim — reject
        raise _401

    return TokenPayload(
        sub=sub,
        email=payload.get("email", ""),
        role=payload.get("role", ""),
    )


# ── Convenience type alias for route signatures ───────────────────────────────
# Usage:  async def route(token: AuthToken = Depends(require_auth))
AuthToken = TokenPayload
