"""Heat data routes: layer GeoJSON, summary, per-cell pixel inspector.

All grid access goes through the grid provider — DEMO (labelled synthetic)
or LIVE (Earth Engine extraction with real scene provenance).
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Query

from app.core.envelope import DomainError, envelope
from app.schemas import Envelope, HeatSummary
from app.services import demo_data
from app.services import grid
from app.services.data_source_resolver import availability_matrix

router = APIRouter()

KNOWN_LAYERS = ["lst", "heat-risk", "ndvi", "ndbi", "ndwi", "albedo", "population"]


@router.get("/heat/{city_id}")
def heat_layer(city_id: str, layer: str = Query(default="lst")) -> dict[str, Any]:
    grid.ensure_grid()
    _require_city(city_id)
    if layer not in KNOWN_LAYERS:
        raise DomainError("UNKNOWN_LAYER", f"layer '{layer}' not in {KNOWN_LAYERS}")
    fc = grid.layer_geojson(layer)
    return envelope(fc, meta={
        "layer": layer,
        "city": city_id,
        "grid": f"{grid.grid_size()}x{grid.grid_size()}",
        "provider": grid.provider(),
        "scenario_type": grid.scenario_type(),
    })


@router.get("/heat/{city_id}/summary")
def heat_summary(city_id: str) -> Envelope[HeatSummary]:
    grid.ensure_grid()
    _require_city(city_id)
    return envelope(grid.summary())


@router.get("/heat/{city_id}/cell")
def inspect_cell(city_id: str, index: int = Query(ge=0, lt=1600)) -> dict[str, Any]:
    """Pixel inspector: coordinates, values, and full provenance per cell."""
    grid.ensure_grid()
    _require_city(city_id)
    rec = grid.cell_record(index)
    rec["model"] = _model_status()
    return envelope(rec)


@router.get("/data-sources/{aoi_id}")
def data_sources(aoi_id: str) -> dict[str, Any]:
    return envelope(availability_matrix(aoi_id))


def _model_status() -> dict[str, Any]:
    from app.services.ml import predictor

    entries = predictor.load_registry()
    if not entries:
        return {"status": "NOT_TRAINED", "note": "no trained artifact in registry — observed values only"}
    e = entries[0]
    return {"status": "REGISTERED", "model_id": e["model_id"], "version": e["version"]}


def _require_city(city_id: str) -> None:
    if city_id not in {c["city_id"] for c in demo_data.CITIES}:
        raise DomainError("CITY_NOT_FOUND", f"Unknown city '{city_id}'")
