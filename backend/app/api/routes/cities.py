"""City and AOI routes — global-first: every analysis anchors to an AOI."""

from __future__ import annotations

import math
import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.envelope import DomainError, NotFoundError, envelope
from app.db import repo as db_repo
from app.db.session import get_session
from app.schemas import AOI, City, Envelope
from app.services import demo_data

router = APIRouter()


class AOICreate(BaseModel):
    name: str | None = None
    geometry: dict[str, Any] | None = None  # GeoJSON Polygon
    bbox: list[float] | None = Field(default=None, description="[w, s, e, n]")
    center: list[float] | None = Field(default=None, description="[lat, lon]")
    radius_km: float | None = Field(default=None, gt=0, le=200)
    country: str | None = None
    region: str | None = None
    city: str | None = None
    requested_resolution: int | None = None


def _area_km2_bbox(w: float, s: float, e: float, n: float) -> float:
    mid_lat = (s + n) / 2
    dx_km = (e - w) * 111.32 * math.cos(math.radians(mid_lat))
    dy_km = (n - s) * 110.57
    return round(abs(dx_km * dy_km), 2)


def _aoi_from_bbox(bbox: list[float]) -> dict[str, Any]:
    w, s, e, n = bbox
    return {
        "type": "Polygon",
        "coordinates": [[[w, s], [e, s], [e, n], [w, n], [w, s]]],
    }


def _register_aoi(payload: AOICreate) -> dict[str, Any]:
    if payload.geometry:
        geom = payload.geometry
        coords = geom.get("coordinates", [])
        if geom.get("type") == "Polygon" and coords:
            lons = [p[0] for p in coords[0]]
            lats = [p[1] for p in coords[0]]
            bbox = [min(lons), min(lats), max(lons), max(lats)]
        else:
            raise DomainError("INVALID_GEOMETRY", "Only Polygon geometries are supported in this build")
    elif payload.bbox and len(payload.bbox) == 4:
        bbox = payload.bbox
        geom = _aoi_from_bbox(bbox)
    elif payload.center and payload.radius_km:
        lat, lon = payload.center
        dlat = payload.radius_km / 110.57
        dlon = payload.radius_km / (111.32 * max(math.cos(math.radians(lat)), 1e-6))
        bbox = [lon - dlon, lat - dlat, lon + dlon, lat + dlat]
        geom = _aoi_from_bbox(bbox)
    else:
        raise DomainError("INVALID_AOI", "Provide geometry, bbox, or center+radius_km")

    w, s, e, n = bbox
    if not (-180 <= w < e <= 180 and -90 <= s < n <= 90):
        raise DomainError("INVALID_AOI", "Bounding box out of physical range")

    aoi_id = f"aoi_{uuid.uuid4().hex[:8]}"
    aoi = {
        "aoi_id": aoi_id,
        "name": payload.name,
        "geometry": geom,
        "centroid": [round((s + n) / 2, 5), round((w + e) / 2, 5)],
        "bounding_box": [round(v, 5) for v in bbox],
        "country": payload.country,
        "region": payload.region,
        "city": payload.city,
        "area_km2": _area_km2_bbox(w, s, e, n),
        "requested_resolution": payload.requested_resolution,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "scenario_type": "DEMO",
    }
    return aoi


@router.get("/cities")
def list_cities() -> Envelope[list[City]]:
    return envelope(demo_data.CITIES, meta={"count": len(demo_data.CITIES)})


@router.get("/cities/{city_id}")
def get_city(city_id: str) -> Envelope[City]:
    for c in demo_data.CITIES:
        if c["city_id"] == city_id:
            return envelope(c)
    raise NotFoundError("CITY_NOT_FOUND", f"Unknown city '{city_id}'")


@router.post("/aoi")
def create_aoi(payload: AOICreate, db: Session = Depends(get_session)) -> Envelope[AOI]:
    aoi = _register_aoi(payload)
    db_repo.aoi_save(db, aoi)
    return envelope(aoi, meta={"next": f"/api/v1/analysis/{aoi['aoi_id']}/run"})


@router.get("/aoi")
def list_aois(db: Session = Depends(get_session)) -> dict[str, Any]:
    aois = db_repo.aoi_list(db)
    return envelope(aois, meta={"count": len(aois)})


@router.get("/aoi/{aoi_id}")
def get_aoi(aoi_id: str, db: Session = Depends(get_session)) -> Envelope[AOI]:
    aoi = db_repo.aoi_get(db, aoi_id)
    if not aoi:
        raise NotFoundError("AOI_NOT_FOUND", f"Unknown AOI '{aoi_id}'")
    return envelope(aoi)


@router.get("/geocode")
async def geocode(q: str = Query(min_length=2, max_length=200), limit: int = 5) -> dict[str, Any]:
    from app.services import geocoding
    results = await geocoding.search_location(q, limit=min(limit, 10))
    return envelope(results, meta={"provider": results[0]["source"] if results else "none"})
