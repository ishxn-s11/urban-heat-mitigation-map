"""Scenario simulation routes."""

from __future__ import annotations

import uuid
from typing import Any

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.envelope import DomainError, envelope
from app.db import repo as db_repo
from app.db.session import get_session
from app.schemas import Envelope, ScenarioCreate, ScenarioRecord, ScenarioResponseData
from app.services.scenario import engine

router = APIRouter()


@router.post("/scenarios")
def create_scenario(payload: ScenarioCreate, db: Session = Depends(get_session)) -> Envelope[ScenarioResponseData]:
    scenario_id = f"scn_{uuid.uuid4().hex[:8]}"
    try:
        result = engine.simulate_scenario(
            climate=payload.climate,
            tree_canopy_percent=payload.tree_canopy_percent,
            cool_roof_percent=payload.cool_roof_percent,
            green_roof_percent=payload.green_roof_percent,
            albedo_delta=payload.albedo_delta,
            water_area_delta=payload.water_area_delta,
        )
    except ValueError as exc:
        raise DomainError("INVALID_SCENARIO", str(exc))

    db_repo.scenario_save(db, scenario_id, payload.name, payload.model_dump(), result)
    return envelope({
        "scenario_id": scenario_id,
        "summary": result["summary"],
        "provenance": result["provenance"],
        "scenario_type": result["scenario_type"],
        # Full result (arrays included) so the frontend can render the
        # simulated grid without a second round-trip.
        "result": result,
    })


@router.get("/scenarios/{scenario_id}")
def get_scenario(scenario_id: str, db: Session = Depends(get_session)) -> Envelope[ScenarioRecord]:
    rec = db_repo.scenario_get(db, scenario_id)
    if not rec:
        raise DomainError("SCENARIO_NOT_FOUND", f"Unknown scenario '{scenario_id}'")
    return envelope(rec)


@router.post("/scenarios/{scenario_id}/simulate")
def resimulate(scenario_id: str, db: Session = Depends(get_session)) -> Envelope[ScenarioResponseData]:
    rec = db_repo.scenario_get(db, scenario_id)
    if not rec:
        raise DomainError("SCENARIO_NOT_FOUND", f"Unknown scenario '{scenario_id}'")
    p = rec["params"]
    result = engine.simulate_scenario(
        climate=p.get("climate", "semi-arid"),
        tree_canopy_percent=p.get("tree_canopy_percent", 0),
        cool_roof_percent=p.get("cool_roof_percent", 0),
        green_roof_percent=p.get("green_roof_percent", 0),
        albedo_delta=p.get("albedo_delta", 0),
        water_area_delta=p.get("water_area_delta", 0),
    )
    db_repo.scenario_save(db, scenario_id, rec.get("name"), p, result)
    return envelope({
        "scenario_id": scenario_id,
        "summary": result["summary"],
        "delta_lst_preview": result["delta_lst"][:40],
        "scenario_type": result["scenario_type"],
    })


@router.post("/scenarios/compare")
def compare_scenarios(
    a_id: str = Query(alias="a_id"),
    b_id: str = Query(alias="b_id"),
    db: Session = Depends(get_session),
) -> dict[str, Any]:
    a = db_repo.scenario_get(db, a_id)
    b = db_repo.scenario_get(db, b_id)
    if not a or not b:
        raise DomainError("SCENARIO_NOT_FOUND", "Both a_id and b_id must reference stored scenarios")
    return envelope(engine.compare(a["result"], b["result"]))
