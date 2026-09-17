"""Optimization routes — real pymoo NSGA-II runs."""

from __future__ import annotations

import uuid
from typing import Any

from fastapi import APIRouter

from app.core.envelope import DomainError, envelope
from app.schemas import Envelope, OptimizationRequest, OptimizationRunData
from app.services.optimization import optimizer

router = APIRouter()

_RUNS: dict[str, dict[str, Any]] = {}


@router.post("/optimization")
def run_optimization(payload: OptimizationRequest) -> Envelope[OptimizationRunData]:
    run_id = f"opt_{uuid.uuid4().hex[:8]}"
    f_w = engine_f_w(payload.climate)
    try:
        front = optimizer.run_optimization(
            budget_usd=payload.budget_usd,
            f_w=f_w,
            pop_size=payload.pop_size,
            n_gen=payload.n_gen,
            seed=payload.seed,
        )
    except Exception as exc:  # noqa: BLE001
        raise DomainError("OPTIMIZATION_FAILED", f"NSGA-II failed: {exc}")

    front["run_id"] = run_id
    front["budget_usd"] = payload.budget_usd
    front["recommendation"] = optimizer.recommendation_from_front(front, payload.budget_usd)
    _RUNS[run_id] = front
    return envelope({
        "run_id": run_id,
        "n_solutions": front["n_solutions"],
        "algorithm": front["algorithm"],
        "recommendation": front["recommendation"],
        "scenario_type": front["scenario_type"],
    })


@router.get("/optimization/{run_id}")
def get_run(run_id: str) -> dict[str, Any]:
    run = _RUNS.get(run_id)
    if not run:
        raise DomainError("RUN_NOT_FOUND", f"Unknown optimization run '{run_id}'")
    return envelope({k: v for k, v in run.items() if k != "solutions"})


@router.get("/optimization/{run_id}/solutions")
def get_solutions(run_id: str) -> dict[str, Any]:
    run = _RUNS.get(run_id)
    if not run:
        raise DomainError("RUN_NOT_FOUND", f"Unknown optimization run '{run_id}'")
    return envelope(run["solutions"], meta={
        "run_id": run_id,
        "objectives": run["objectives"],
        "n_solutions": run["n_solutions"],
    })


def engine_f_w(climate: str) -> float:
    from app.services.scenario.engine import moisture_factor
    return moisture_factor(climate)
