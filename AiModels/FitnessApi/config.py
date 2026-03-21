"""Fitness API configuration (OpenAI + Firebase)."""
import json
import os
from functools import lru_cache
from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    OPENAI_API_KEY: str = ""
    # Same as RecoveryAI: JSON string of service account (App Runner env var)
    FIREBASE_CREDENTIALS_JSON: Optional[str] = None
    # Optional: override OpenAI model (default gpt-3.5-turbo to match Streamlit app)
    OPENAI_MODEL: str = "gpt-3.5-turbo"

    # Dev/Postman only: if set, Authorization: Bearer <this exact value> acts as a fake user
    # (no Firebase). Do NOT use a weak value in production; leave empty to disable.
    FITNESS_API_TEST_BEARER: str = ""
    # Synthetic Firebase uid used when FITNESS_API_TEST_BEARER matches (Firestore path)
    FITNESS_API_TEST_UID: str = "postman_test_user"

    # Set to "production" on App Runner: test bearer is ignored; only real Firebase ID tokens work.
    FITNESS_API_ENV: str = "development"


@lru_cache
def get_settings() -> Settings:
    return Settings()


def is_production() -> bool:
    return (get_settings().FITNESS_API_ENV or "").strip().lower() == "production"


def test_bearer_effective() -> bool:
    """True only if test bearer is configured and allowed (not production)."""
    if is_production():
        return False
    return bool((get_settings().FITNESS_API_TEST_BEARER or "").strip())


def firebase_credentials_dict() -> Optional[dict]:
    raw = get_settings().FIREBASE_CREDENTIALS_JSON
    if not raw or not str(raw).strip():
        return None
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return None
