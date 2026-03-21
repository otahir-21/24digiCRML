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


@lru_cache
def get_settings() -> Settings:
    return Settings()


def firebase_credentials_dict() -> Optional[dict]:
    raw = get_settings().FIREBASE_CREDENTIALS_JSON
    if not raw or not str(raw).strip():
        return None
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return None
