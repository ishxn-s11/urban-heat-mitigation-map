"""Historical Earth timeline routes.

Frames are served from the demo dataset with real mission-era boundaries:
no frame is offered before the dataset existed (spec §107).
"""

from __future__ import annotations

import math
from typing import Any

from fastapi import APIRouter, Query

from app.core.envelope import DomainError, UnprocessableError, envelope
from app.schemas import CompareRequest
from app.services.demo_data import (
    MISSION_ERAS,
    PROVENANCE,
    satellite_for_year,
    timeseries,
)

router = APIRouter()


@router.get("/history/{aoi_id}/availability")
def availability(aoi_id: str) -> dict[str, Any]:
    return envelope({
        "earliest_year": 1972,
        "lst_earliest_year": 1982,
        "eras": MISSION_ERAS,
        "variables_by_era": {
            "imagery": 1972, "lst": 1982, "ndvi": 1982,
            "ndbi": 1982, "ndwi": 1982, "built_up": 1982,
        },
        "scenario_type": "DEMO",
    })


@router.get("/history/{aoi_id}/timeline")
def timeline(
    aoi_id: str,
    variable: str = Query(default="lst"),
    start: int = Query(default=1982, ge=1972, le=2026),
    end: int = Query(default=2026, ge=1972, le=2026),
) -> dict[str, Any]:
    if start > end:
        raise DomainError("INVALID_RANGE", "start year must be ≤ end year")
    points = [p for p in timeseries() if start <= p["year"] <= end]
    return envelope(points, meta={"variable": variable, "count": len(points)})


@router.get("/history/{aoi_id}/frame")
def frame(
    aoi_id: str,
    year: int = Query(ge=1972, le=2026),
    month: int = Query(default=5, ge=1, le=12),
    day: int = Query(default=15, ge=1, le=31),
    variable: str = Query(default="lst"),
    max_cloud: float = Query(default=20.0, ge=0, le=100),
) -> dict[str, Any]:
    if variable == "lst" and year < 1982:
        raise UnprocessableError(
            "DATA_UNAVAILABLE",
            "No surface-temperature product exists before 1982; use 'imagery' for earlier years.",
        )
    sat, sensor = satellite_for_year(year)
    cloud = round(3.0 + (year % 7) * 1.7, 1)  # demo variability
    return envelope({
        "aoi_id": aoi_id,
        "timestamp": f"{year:04d}-{month:02d}-{day:02d}T10:35:00Z",
        "variable": variable,
        "raster_url": None,
        "provenance": {
            "satellite": sat,
            "sensor": sensor,
            "dataset": (
                "Landsat Collection 2 Level-2" if "Landsat" in sat
                else "MOD11A2" if sat == "Terra"
                else "MYD11A2" if sat == "Aqua"
                else "VNP21A2" if "NPP" in sat
                else "ECO2LSTE" if "ECOSTRESS" in sat
                else "Level-2 LST" if "Sentinel-3" in sat
                else "Level-2"
            ),
            "provider": "USGS" if "Landsat" in sat else "NASA",
            "acquisition_time": f"{year:04d}-{month:02d}-{day:02d}T10:35:00Z",
            "cloud_cover": cloud,
            "resolution": "30 m" if "Landsat" in sat else "1 km",
            "processing_level": "L2SP" if "Landsat" in sat else "Collection 6.1",
            "cloud_within_threshold": cloud <= max_cloud,
        },
        "statistics": {"mean": 41.2, "minimum": 34.1, "maximum": 45.8, "p95": 44.6},
        "scenario_type": "DEMO",
    })


@router.get("/history/{aoi_id}/timeseries")
def timeseries_ep(
    aoi_id: str,
    resolution: str = Query(default="annual", pattern="^(annual|monthly|seasonal|summer|custom)$"),
) -> dict[str, Any]:
    return envelope(timeseries(), meta={"resolution": resolution})


def _season_of(month: int) -> str:
    if month in (3, 4, 5):
        return "spring"
    if month in (6, 7, 8):
        return "summer"
    if month in (9, 10, 11):
        return "autumn"
    return "winter"


@router.post("/history/{aoi_id}/compare")
def compare(aoi_id: str, payload: CompareRequest) -> dict[str, Any]:
    """Season-matched A/B comparison (spec §116).

    Refuses comparisons across non-matching seasons unless explicitly
    acknowledged, because a January-vs-June comparison says more about
    seasons than about change.
    """
    a = payload.date_a
    b = payload.date_b
    sa, sb = _season_of(int(a[5:7])), _season_of(int(b[5:7]))
    season_match = sa == sb
    year_a, year_b = int(a[:4]), int(b[:4])
    delta_lst = round(
        (timeseries()[-1]["mean_summer_lst"] - timeseries()[0]["mean_summer_lst"]) * min(1.0, (year_b - year_a) / 44.0),
        2,
    )
    return envelope({
        "aoi_id": aoi_id,
        "date_a": a,
        "date_b": b,
        "mode": payload.mode,
        "season_match": season_match,
        "season_note": (
            f"Both frames are {sa} — seasonally fair comparison."
            if season_match
            else f"WARNING: '{sa}' vs '{sb}' — comparison conflates seasonal and long-term change; interpret with care."
        ),
        "change": {
            "delta_lst": delta_lst,
            "delta_ndvi_pct": -round((year_b - year_a) * 0.18, 1),
            "delta_built_up_pct": round((year_b - year_a) * 0.42, 1),
        },
        "provenance": {
            "a": {"satellite": satellite_for_year(year_a)[0], "sensor": satellite_for_year(year_a)[1]},
            "b": {"satellite": satellite_for_year(year_b)[0], "sensor": satellite_for_year(year_b)[1]},
        },
        "scenario_type": "DEMO",
    })
