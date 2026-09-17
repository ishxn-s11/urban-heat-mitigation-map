"""Repository layer for AOIs and scenarios.

Route modules stay contract-identical: they get a Session via FastAPI's
Depends, and fall back to transient behavior if the database is
unavailable (e.g. missing schema in a live-Postgres deployment) rather
than crashing.
"""

from __future__ import annotations

import logging
from typing import Any

from sqlalchemy.orm import Session

from app.db.models import AOIRecord, ScenarioRecord

logger = logging.getLogger(__name__)


def _safe(fn):
    try:
        return fn()
    except Exception:  # noqa: BLE001 - persistence is best-effort
        logger.exception("persistence layer unavailable; serving transiently")
        return None


# ── AOIs ──────────────────────────────────────────────────────────────────


def aoi_save(db: Session, aoi: dict[str, Any]) -> None:
    def _go() -> None:
        rec = db.get(AOIRecord, aoi["aoi_id"])
        if rec is None:
            rec = AOIRecord(aoi_id=aoi["aoi_id"])
            db.add(rec)
        for key, value in aoi.items():
            setattr(rec, key, value)
        db.commit()

    _safe(_go)


def aoi_get(db: Session, aoi_id: str) -> dict[str, Any] | None:
    def _go() -> dict[str, Any] | None:
        rec = db.get(AOIRecord, aoi_id)
        return rec.to_dict() if rec else None

    return _safe(_go)


def aoi_list(db: Session) -> list[dict[str, Any]]:
    def _go() -> list[dict[str, Any]]:
        return [r.to_dict() for r in db.query(AOIRecord).all()]

    return _safe(_go) or []


# ── Scenarios ─────────────────────────────────────────────────────────────


def scenario_save(
    db: Session,
    scenario_id: str,
    name: str | None,
    params: dict[str, Any],
    result: dict[str, Any],
) -> None:
    def _go() -> None:
        rec = db.get(ScenarioRecord, scenario_id)
        if rec is None:
            rec = ScenarioRecord(scenario_id=scenario_id)
            db.add(rec)
        rec.name = name
        rec.params = params
        rec.result = result
        db.commit()

    _safe(_go)


def scenario_get(db: Session, scenario_id: str) -> dict[str, Any] | None:
    def _go() -> dict[str, Any] | None:
        rec = db.get(ScenarioRecord, scenario_id)
        return rec.to_dict() if rec else None

    return _safe(_go)


def scenario_list(db: Session) -> list[dict[str, Any]]:
    def _go() -> list[dict[str, Any]]:
        return [r.to_dict() for r in db.query(ScenarioRecord).all()]

    return _safe(_go) or []
