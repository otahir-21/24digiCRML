"""Firebase ID token verification for Fitness API (Flutter)."""
import secrets
from typing import Annotated, Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from config import get_settings, is_production
from firebase_app import init_firebase

security = HTTPBearer(auto_error=False)


def _verify_firebase_token(id_token: str) -> Optional[dict]:
    if not init_firebase():
        return None
    try:
        import firebase_admin.auth

        return firebase_admin.auth.verify_id_token(id_token)
    except Exception:
        return None


async def require_firebase_user(
    credentials: Annotated[
        Optional[HTTPAuthorizationCredentials],
        Depends(security),
    ],
) -> dict:
    """
    Require valid Firebase ID token.
    Returns claims dict with at least 'uid' (and often 'email').
    """
    if credentials is None or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization Bearer token (Firebase ID token).",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = credentials.credentials
    settings = get_settings()
    test_bearer = (settings.FITNESS_API_TEST_BEARER or "").strip()
    if test_bearer and not is_production():
        try:
            if secrets.compare_digest(
                token.encode("utf-8"),
                test_bearer.encode("utf-8"),
            ):
                return {
                    "uid": settings.FITNESS_API_TEST_UID or "postman_test_user",
                    "email": "test@fitness-api.local",
                    "test_bearer": True,
                }
        except Exception:
            pass

    decoded = _verify_firebase_token(token)
    if not decoded or not decoded.get("uid"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired Firebase ID token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return decoded
