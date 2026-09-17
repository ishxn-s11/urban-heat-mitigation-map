"""Central application configuration.

All settings come from environment variables (optionally a local .env file).
No secrets are ever hard-coded; see .env.example at the repository root.
"""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "UrbanFlux API"
    version: str = "1.0.0"
    environment: str = Field(default="development")
    demo_mode: bool = Field(default=True)
    data_mode: str = Field(default="test")  # live | cached | test
    cors_origins: str = Field(
        default="http://localhost:5173,http://localhost:4173"
    )

    database_url: str = Field(default="sqlite:///./urbanflux.db")
    redis_url: str = Field(default="redis://localhost:6379/0")

    gee_project_id: str = Field(default="")
    google_application_credentials: str = Field(default="")

    openai_api_key: str = Field(default="")
    rag_embedding_model: str = Field(default="text-embedding-3-small")
    rag_llm_model: str = Field(default="gpt-4o-mini")
    qdrant_url: str = Field(default="")

    api_rate_limit: str = Field(default="120/minute")

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
