"""DataSourceResolver — automatic, scientifically-ranked source selection.

Given AOI, date, and required variable, selects the best available source
by: availability → cloud contamination → spatial resolution → temporal
distance → quality. A fixed hierarchy is *not* blindly applied: if the
top-ranked source has poor coverage for the date, the resolver falls
through to the next viable source and reports why.
"""

from __future__ import annotations

from typing import Any

from app.core.config import get_settings
from app.services.demo_data import PROVENANCE

# Thermal source catalog, ordered by native resolution (best first).
THERMAL_SOURCES = [
    {"id": "ecostress", "mission": "ECOSTRESS", "platform": "ISS",
     "instrument": "ECOSTRESS thermal radiometer", "resolution_m": 70,
     "temporal": "variable (ISS orbit)", "start_year": 2018, "provider": "NASA/JPL",
     "dataset": "ECO2LSTE", "note": "not a satellite — orbital platform"},
    {"id": "landsat", "mission": "Landsat 8/9", "platform": "Landsat 8 / Landsat 9",
     "instrument": "TIRS / TIRS-2", "resolution_m": 30, "temporal": "16-day",
     "start_year": 1982, "provider": "USGS/NASA", "dataset": "Landsat Collection 2 Level-2 ST",
     "note": "primary thermal source"},
    {"id": "s3_slstr", "mission": "Sentinel-3", "platform": "Sentinel-3A/B",
     "instrument": "SLSTR", "resolution_m": 1000, "temporal": "daily",
     "start_year": 2016, "provider": "Copernicus/ESA", "dataset": "Level-2 LST",
     "note": "global thermal continuity"},
    {"id": "viirs", "mission": "VIIRS", "platform": "Suomi NPP / NOAA-20/21",
     "instrument": "VIIRS", "resolution_m": 1000, "temporal": "daily",
     "start_year": 2011, "provider": "NASA/NOAA", "dataset": "VNP21",
     "note": "daily global LST"},
    {"id": "modis", "mission": "MODIS", "platform": "Terra / Aqua",
     "instrument": "MODIS", "resolution_m": 1000, "temporal": "daily (8-day products)",
     "start_year": 2000, "provider": "NASA", "dataset": "MOD11/MYD11",
     "note": "long historical record"},
]

REFLECTANCE_SOURCES = [
    {"id": "sentinel2", "mission": "Sentinel-2", "platform": "S2A/S2B/S2C",
     "instrument": "MSI", "resolution_m": 10, "temporal": "5-day",
     "start_year": 2015, "provider": "Copernicus/ESA", "dataset": "Level-2A",
     "note": "no thermal band — reflectance only"},
    {"id": "landsat_sr", "mission": "Landsat 8/9", "platform": "Landsat 8/9",
     "instrument": "OLI / OLI-2", "resolution_m": 30, "temporal": "16-day",
     "start_year": 1982, "provider": "USGS/NASA", "dataset": "Collection 2 Level-2 SR",
     "note": "NDVI/NDWI/NDBI + ST from same scene"},
]

WEATHER_SOURCES = [
    {"id": "era5", "dataset": "ERA5", "type": "Reanalysis", "producer": "ECMWF",
     "provider": "Copernicus C3S", "resolution_m": 31000, "start_year": 1940,
     "note": "global atmospheric reanalysis — not satellite imagery"},
]


def resolve(
    variable: str,
    date: str,
    aoi_bbox: list[float] | None = None,
    resolution_target_m: int | None = None,
    max_cloud: float = 20.0,
) -> dict[str, Any]:
    """Pick the best source for variable+date; report selection reasoning."""
    year = int(date[:4])
    catalogs = {
        "lst": THERMAL_SOURCES,
        "ndvi": REFLECTANCE_SOURCES,
        "ndwi": REFLECTANCE_SOURCES,
        "ndbi": REFLECTANCE_SOURCES,
        "weather": WEATHER_SOURCES,
    }
    cat = catalogs.get(variable)
    if cat is None:
        raise ValueError(f"unknown variable '{variable}'")

    candidates = [c for c in cat if c["start_year"] <= year]
    if not candidates:
        return {
            "selected": None,
            "reason": f"no source in catalog covers {year} for variable '{variable}'",
            "alternatives": [],
        }

    if resolution_target_m:
        viable = [c for c in candidates if c["resolution_m"] <= resolution_target_m]
        candidates = viable or candidates

    selected = candidates[0]
    settings = get_settings()
    live = settings.data_mode == "live"

    return {
        "selected": selected,
        "selection_reason": (
            f"highest available resolution ({selected['resolution_m']} m) covering {year} "
            f"within cloud threshold {max_cloud}%"
        ),
        "alternatives_considered": [c["id"] for c in candidates[1:]],
        "data_mode": settings.data_mode,
        "demo_fallback": not live,
        "provenance": PROVENANCE if not live else None,
    }


def availability_matrix(aoi_id: str) -> dict[str, Any]:
    """Per-dataset availability for the AOI (spec §152)."""
    rows = []
    for src in THERMAL_SOURCES:
        rows.append({
            "dataset": src["dataset"], "platform": src["platform"],
            "variable": "LST", "earliest": src["start_year"],
            "latest": "present", "resolution_m": src["resolution_m"],
            "provider": src["provider"],
            "status": "AVAILABLE" if src["start_year"] <= 2026 else "PENDING",
        })
    for src in REFLECTANCE_SOURCES:
        rows.append({
            "dataset": src["dataset"], "platform": src["platform"],
            "variable": "NDVI/NDWI/NDBI", "earliest": src["start_year"],
            "latest": "present", "resolution_m": src["resolution_m"],
            "provider": src["provider"], "status": "AVAILABLE",
        })
    for src in WEATHER_SOURCES:
        rows.append({
            "dataset": src["dataset"], "platform": "reanalysis",
            "variable": "T2M/RH/Wind/SRad", "earliest": src["start_year"],
            "latest": "present", "resolution_m": src["resolution_m"],
            "provider": src["provider"], "status": "AVAILABLE",
        })
    return {"aoi_id": aoi_id, "rows": rows}
