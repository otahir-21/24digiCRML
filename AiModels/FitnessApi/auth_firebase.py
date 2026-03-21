"""Firebase ID token verification for Fitness API (Flutter)."""
from typing import Annotated, Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

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
    decoded = _verify_firebase_token(credentials.credentials)
    if not decoded or not decoded.get("uid"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired Firebase ID token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return decoded
