"""Firestore persistence for fitness user profile/goals (per Firebase uid)."""
from datetime import datetime, timezone
from typing import Any

from firebase_app import get_firestore

COLLECTION = "fitness_backend"


def _doc_ref(uid: str):
    db = get_firestore()
    if db is None:
        return None
    return db.collection(COLLECTION).document(uid)


def get_user_state(uid: str) -> dict[str, Any]:
    ref = _doc_ref(uid)
    if ref is None:
        return {"profile": None, "goals": None}
    snap = ref.get()
    if not snap.exists:
        return {"profile": None, "goals": None}
    data = snap.to_dict() or {}
    return {
        "profile": data.get("profile"),
        "goals": data.get("goals"),
        "updated_at": data.get("updated_at"),
    }


def merge_profile(uid: str, profile: dict[str, Any]) -> dict[str, Any]:
    ref = _doc_ref(uid)
    if ref is None:
        raise RuntimeError("Firestore not configured")
    snap = ref.get()
    existing = (snap.to_dict() or {}).get("profile") or {}
    merged = {**existing, **{k: v for k, v in profile.items() if v is not None}}
    ref.set(
        {
            "profile": merged,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        },
        merge=True,
    )
    return merged


def merge_goals(uid: str, goals: dict[str, Any]) -> dict[str, Any]:
    ref = _doc_ref(uid)
    if ref is None:
        raise RuntimeError("Firestore not configured")
    snap = ref.get()
    existing = (snap.to_dict() or {}).get("goals") or {}
    merged = {**existing, **{k: v for k, v in goals.items() if v is not None}}
    ref.set(
        {
            "goals": merged,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        },
        merge=True,
    )
    return merged
