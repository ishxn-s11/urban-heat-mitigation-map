"""Model registry routes."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter

from app.core.envelope import envelope
from app.services.ml import predictor

router = APIRouter()


@router.get("/models")
def list_models() -> dict[str, Any]:
    entries = predictor.load_registry()
    if not entries:
        return envelope([], meta={
            "available": False,
            "note": "No trained artifacts. Train with `python -m ml.training.train_model`.",
        })
    return envelope(entries, meta={"available": True, "count": len(entries)})


@router.get("/models/{model_id}")
def get_model(model_id: str) -> dict[str, Any]:
    for e in predictor.load_registry():
        if e["model_id"] == model_id:
            return envelope(e)
    return envelope(
        {"model_id": model_id, "status": "NOT_FOUND"},
        meta={"available": False},
    )


@router.get("/models/{model_id}/validity")
def model_validity(model_id: str, climate: str = "semi-arid", latitude: float = 28.6) -> dict[str, Any]:
    try:
        _, entry = predictor.load_model(model_id)
    except predictor.ModelNotAvailableError as exc:
        return envelope({"model_id": model_id, "available": False, "reason": str(exc)})
    guard = predictor.ModelValidityGuard(entry)
    return envelope(guard.check(climate, latitude))
