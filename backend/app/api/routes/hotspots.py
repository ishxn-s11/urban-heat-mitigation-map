"""Hotspot routes with model-backed (SHAP) driver explanations."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Query

from app.core.envelope import DomainError, NotFoundError, envelope
from app.schemas import Envelope, Hotspot
from app.services import grid
from app.services import hotspots as hs_service

router = APIRouter()


@router.get("/hotspots/{city_id}")
def list_hotspots(
    city_id: str,
    method: str = Query(default="adaptive_percentile"),
) -> Envelope[list[Hotspot]]:
    grid.ensure_grid()
    try:
        if not grid.is_live() and method != "adaptive_percentile":
            # methodology configurability kept: non-default methods are
            # explicitly refused until wired (no silent substitution)
            hs = hs_service.classify_hotspots(method)
        else:
            hs = grid.hotspots()
    except NotImplementedError as exc:
        raise DomainError("METHOD_NOT_WIRED", str(exc))
    return envelope(hs, meta={
        "method": method,
        "provider": grid.provider(),
        "scenario_type": grid.scenario_type(),
    })


@router.get("/hotspots/{city_id}/{hotspot_id}")
def get_hotspot(city_id: str, hotspot_id: str) -> Envelope[Hotspot]:
    grid.ensure_grid()
    for hs in grid.hotspots():
        if hs["hotspot_id"] == hotspot_id:
            return envelope(hs)
    raise NotFoundError("HOTSPOT_NOT_FOUND", f"Unknown hotspot '{hotspot_id}'")


@router.get("/hotspots/{city_id}/{hotspot_id}/explanation")
def explain_hotspot(city_id: str, hotspot_id: str) -> dict[str, Any]:
    """Driver explanation for one hotspot.

    Served from the trained model artifact via exact tree SHAP when
    available; otherwise the demo feature contributions with explicit
    LOW-confidence caveats. Never presented as causal effects.
    """
    grid.ensure_grid()
    hs_list = grid.hotspots()
    for hs in hs_list:
        if hs["hotspot_id"] == hotspot_id:
            source = hs.get("explanation_source", "demo_static")

            if source == "shap":
                from app.services.ml import shap_service

                expl = shap_service.explain_cell(hs["cell"]["cell_index"])
                warming = [d for d in (expl or {}).get("drivers", []) if d["direction"] == "warming"]
                cooling = [d for d in (expl or {}).get("drivers", []) if d["direction"] == "cooling"]
                return envelope({
                    "hotspot_id": hs["hotspot_id"],
                    "name": hs["name"],
                    "intensity": hs["intensity"],
                    "warming_factors": warming,
                    "cooling_factors": cooling,
                    "explanation_method": "shap_tree_explainer_exact",
                    "model_id": (expl or {}).get("model_id"),
                    "model_version": (expl or {}).get("model_version"),
                    "base_value": (expl or {}).get("base_value"),
                    "predicted_lst": (expl or {}).get("predicted_lst"),
                    "feature_values": (expl or {}).get("feature_values"),
                    "methodology": (
                        "SHAP attributions from the registered model artifact "
                        f"(exact tree explainer). Values are model-associated "
                        "contributions to the predicted LST for this cell — "
                        "associations, not established causal effects."
                    ),
                    "confidence": "MEDIUM — real model attribution on "
                        f"{grid.provider()} grid",
                    "scenario_type": grid.scenario_type(),
                })

            # Demo/static path
            warming = [d for d in hs["drivers"] if d["direction"] == "warming"]
            cooling = [d for d in hs["drivers"] if d["direction"] == "cooling"]
            return envelope({
                "hotspot_id": hs["hotspot_id"],
                "name": hs["name"],
                "intensity": hs["intensity"],
                "warming_factors": warming,
                "cooling_factors": cooling,
                "explanation_method": "demo_feature_contribution",
                "methodology": (
                    "Contributions are model-associated factors from the demo feature "
                    "grid, ranked by relative magnitude. They are associations, not "
                    "established causal effects."
                ),
                "shap_available": False,
                "shap_note": "SHAP service activates when a trained model artifact is present",
                "confidence": "LOW — demo dataset",
                "scenario_type": "DEMO",
            })
    raise NotFoundError("HOTSPOT_NOT_FOUND", f"Unknown hotspot '{hotspot_id}'")
