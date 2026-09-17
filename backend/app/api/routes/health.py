"""Health and readiness endpoints."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter

from app.core.config import get_settings
from app.core.envelope import envelope

router = APIRouter()


@router.get("/health")
def health() -> dict[str, Any]:
    return {"status": "ok", "app": get_settings().app_name, "version": get_settings().version}


@router.get("/ready")
def ready() -> dict[str, Any]:
    settings = get_settings()
    checks: dict[str, str] = {"api": "ok"}
    if settings.demo_mode:
        checks["data"] = "demo dataset loaded"
    else:
        checks["data"] = "live mode requires Earth Engine configuration"
    return envelope({"status": "ready", "checks": checks, "demo_mode": settings.demo_mode})
