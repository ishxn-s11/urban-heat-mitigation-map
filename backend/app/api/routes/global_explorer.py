"""Global explorer routes — AOI → analysis pipeline with honest job stages."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Query

from app.core.envelope import DomainError, envelope
from app.services import grid, jobs
from app.services.data_source_resolver import resolve

router = APIRouter()


@jobs.analysis_pipeline(jobs.ANALYSIS_STAGES)
def _run_analysis(aoi_id: str) -> dict[str, Any]:
    """The analysis pipeline. Stages are real: each one runs."""
    grid.ensure_grid()
    return {
        "aoi_id": aoi_id,
        "summary": grid.summary(),
        "grid": f"{grid.grid_size()}x{grid.grid_size()}",
        "provider": grid.provider(),
        "provenance": grid.thermal_provenance(),
        "status": "COMPLETED",
    }


@router.post("/analysis/{aoi_id}/run")
def run_analysis(aoi_id: str) -> dict[str, Any]:
    job_id = jobs.submit_job(_run_analysis, aoi_id, job_type="aoi_analysis")
    return envelope({"job_id": job_id, "aoi_id": aoi_id, "status": "QUEUED"})


@router.get("/analysis/job/{job_id}")
def job_status(job_id: str) -> dict[str, Any]:
    job = jobs.get_job(job_id)
    if job is None:
        raise DomainError("JOB_NOT_FOUND", f"Unknown job '{job_id}'")
    return envelope(job)


@router.get("/explorer/resolve")
def resolve_source(
    variable: str = Query(default="lst"),
    date: str = Query(default="2026-05-14"),
    max_cloud: float = Query(default=20.0, ge=0, le=100),
) -> dict[str, Any]:
    try:
        r = resolve(variable=variable, date=date, max_cloud=max_cloud)
    except ValueError as exc:
        raise DomainError("UNKNOWN_VARIABLE", str(exc))
    return envelope(r)


@router.get("/explorer/auto-resolution")
def auto_resolution(area_km2: float = Query(gt=0, le=1_000_000)) -> dict[str, Any]:
    """AUTO RESOLUTION: grid sized to AOI area and limiting source (spec §159)."""
    if area_km2 <= 25:
        grid, limiting = "30 m", "Landsat Surface Temperature"
    elif area_km2 <= 400:
        grid, limiting = "100 m", "Landsat Surface Temperature"
    elif area_km2 <= 10_000:
        grid, limiting = "1 km", "MODIS/VIIRS LST"
    else:
        grid, limiting = "10 km", "ERA5 / MODIS regional composites"
    return envelope({
        "analysis_grid": grid,
        "limiting_source": limiting,
        "note": "native sensor resolution is displayed and never upsampled silently",
    })
