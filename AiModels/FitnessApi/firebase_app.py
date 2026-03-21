"""Firebase Admin init + Firestore client (lazy)."""
import json
import os
from typing import Optional

from config import firebase_credentials_dict


_firebase_app = None
_firestore_db = None


def init_firebase() -> bool:
    """Initialize Firebase Admin if credentials are available. Returns True if ready."""
    global _firebase_app, _firestore_db
    if _firebase_app is not None:
        return True
    try:
        import firebase_admin
        from firebase_admin import credentials

        cred = None
        d = firebase_credentials_dict()
        if d:
            cred = credentials.Certificate(d)
        elif os.environ.get("GOOGLE_APPLICATION_CREDENTIALS"):
            cred = credentials.Certificate(os.environ["GOOGLE_APPLICATION_CREDENTIALS"])
        if cred is None:
            return False
        _firebase_app = firebase_admin.initialize_app(cred)
        from firebase_admin import firestore

        _firestore_db = firestore.client()
        return True
    except Exception:
        return False


def firestore_available() -> bool:
    return _firestore_db is not None


def get_firestore():
    """Return Firestore client or None if not configured."""
    if _firestore_db is not None:
        return _firestore_db
    init_firebase()
    return _firestore_db
