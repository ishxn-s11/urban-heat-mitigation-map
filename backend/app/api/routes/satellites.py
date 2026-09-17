"""Satellite catalog routes — full provenance for every EO dataset."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter

from app.core.envelope import DomainError, envelope
from app.services.data_source_resolver import (
    REFLECTANCE_SOURCES,
    THERMAL_SOURCES,
    WEATHER_SOURCES,
)

MISSIONS: dict[str, dict[str, Any]] = {
    "landsat": {
        "mission": "Landsat", "satellites": ["Landsat 4", "Landsat 5", "Landsat 7", "Landsat 8", "Landsat 9"],
        "sensors": ["TM", "ETM+", "OLI", "OLI-2", "TIRS", "TIRS-2"],
        "dataset": "Landsat Collection 2 Level-2", "products": ["Surface Reflectance", "Surface Temperature"],
        "provider": "USGS / NASA", "resolution": "30 m (thermal: 100–120 m resampled)",
        "temporal": "16-day", "earliest": 1982,
    },
    "sentinel-2": {
        "mission": "Copernicus Sentinel-2", "satellites": ["Sentinel-2A", "Sentinel-2B", "Sentinel-2C"],
        "sensors": ["MSI"], "dataset": "Sentinel-2 Level-2A",
        "products": ["BOA surface reflectance", "NDVI", "NDWI", "NDBI"],
        "provider": "Copernicus / ESA", "resolution": "10 m (bands 2,3,4,8)",
        "temporal": "5-day", "earliest": 2015,
        "note": "MSI has no thermal-infrared band — never used for LST",
    },
    "sentinel-3": {
        "mission": "Copernicus Sentinel-3", "satellites": ["Sentinel-3A", "Sentinel-3B"],
        "sensors": ["SLSTR"], "dataset": "Sentinel-3 Level-2 LST",
        "products": ["Land Surface Temperature"], "provider": "Copernicus / ESA",
        "resolution": "1 km", "temporal": "daily", "earliest": 2016,
    },
    "modis": {
        "mission": "EOS Terra / Aqua", "satellites": ["Terra", "Aqua"],
        "sensors": ["MODIS"], "dataset": "MOD11 / MYD11 / MOD21 / MYD21",
        "products": ["LST", "Emissivity", "Vegetation"], "provider": "NASA",
        "resolution": "1 km", "temporal": "daily / 8-day", "earliest": 2000,
    },
    "viirs": {
        "mission": "SNPP / JPSS", "satellites": ["Suomi NPP", "NOAA-20", "NOAA-21"],
        "sensors": ["VIIRS"], "dataset": "VNP21 / VJ121",
        "products": ["LST", "Emissivity", "Nighttime lights"], "provider": "NASA / NOAA",
        "resolution": "1 km", "temporal": "daily", "earliest": 2011,
    },
    "ecostress": {
        "mission": "ECOSTRESS", "platform": "International Space Station",
        "note": "ECOSTRESS is an instrument on the ISS — NOT a satellite",
        "sensors": ["ECOSTRESS thermal radiometer"], "dataset": "ECO2LSTE",
        "products": ["High-resolution LST"], "provider": "NASA / JPL",
        "resolution": "70 m", "temporal": "variable (ISS orbit)", "earliest": 2018,
    },
    "era5": {
        "mission": "ERA5", "type": "Global atmospheric reanalysis",
        "note": "ERA5 is NOT a satellite — it is a model-based reanalysis",
        "producer": "ECMWF", "service": "Copernicus Climate Change Service",
        "dataset": "ERA5 monthly/hourly", "products": ["T2M", "RH", "Wind", "Radiation", "Precipitation"],
        "resolution": "~31 km", "temporal": "hourly", "earliest": 1940,
    },
}

router = APIRouter()


@router.get("/satellites")
def list_satellites() -> dict[str, Any]:
    return envelope(list(MISSIONS.values()), meta={"count": len(MISSIONS)})


@router.get("/satellites/{mission}")
def get_mission(mission: str) -> dict[str, Any]:
    m = MISSIONS.get(mission.lower())
    if not m:
        raise DomainError("MISSION_NOT_FOUND", f"Unknown mission '{mission}'")
    return envelope(m)
