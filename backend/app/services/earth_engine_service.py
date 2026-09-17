"""Google Earth Engine service — Landsat / Sentinel-2 / ERA5 ingestion.

Real ee API calls, activated only when ``GEE_PROJECT_ID`` and credentials
are configured. When unconfigured the service raises explicitly so callers
serve demo data with DEMO flags rather than pretending ingestion ran.
"""

from __future__ import annotations

from typing import Any

from app.core.config import get_settings


class EarthEngineUnavailableError(Exception):
    pass


def _get_ee():
    settings = get_settings()
    if not settings.gee_project_id:
        raise EarthEngineUnavailableError(
            "GEE_PROJECT_ID not configured — Earth Engine ingestion unavailable"
        )
    import ee  # heavy import deferred until needed
    try:
        ee.Initialize(project=settings.gee_project_id)
    except Exception as exc:  # noqa: BLE001
        raise EarthEngineUnavailableError(f"Earth Engine init failed: {exc}") from exc
    return ee


def landsat_st(aoi_bbox: list[float], start: str, end: str, max_cloud: float = 20.0):
    """Landsat Collection 2 Level-2 Surface Temperature composite.

    QA_PIXEL cloud masking; median composite over the window. Returns an
    ee.Image; scale native 30 m thermal (120 m → resampled to 30 m grid).
    """
    ee = _get_ee()
    region = ee.Geometry.Rectangle(aoi_bbox)
    col = (
        ee.ImageCollection("LANDSAT/LC09/C02/T1_L2")
        .merge(ee.ImageCollection("LANDSAT/LC08/C02/T1_L2"))
        .filterBounds(region)
        .filterDate(start, end)
        .filter(ee.Filter.lt("CLOUD_COVER", max_cloud))
    )
    img = col.median()
    st_band = img.select("ST_B10").multiply(0.00341802).add(149.0).subtract(273.15)
    qa = img.select("QA_PIXEL")
    clear = qa.bitwiseAnd(1 << 3).eq(0)  # cloud bit
    return st_band.updateMask(clear).clip(region), col.size().getInfo()


def sentinel2_indices(aoi_bbox: list[float], start: str, end: str, max_cloud: float = 20.0):
    """Sentinel-2 Level-2A NDVI / NDWI / NDBI with SCL cloud masking."""
    ee = _get_ee()
    region = ee.Geometry.Rectangle(aoi_bbox)
    col = (
        ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
        .filterBounds(region)
        .filterDate(start, end)
        .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", max_cloud))
    )
    img = col.median()
    ndvi = img.normalizedDifference(["B8", "B4"]).rename("NDVI")
    ndwi = img.normalizedDifference(["B3", "B8"]).rename("NDWI")
    ndbi = img.normalizedDifference(["B11", "B8"]).rename("NDBI")
    scl = img.select("SCL")
    clear = scl.neq(3).And(scl.neq(8)).And(scl.neq(9)).And(scl.neq(10))  # clouds/shadows
    return {
        "NDVI": ndvi.updateMask(clear).clip(region),
        "NDWI": ndwi.updateMask(clear).clip(region),
        "NDBI": ndbi.updateMask(clear).clip(region),
    }, col.size().getInfo()


def era5_variables(aoi_point: list[float], start: str, end: str):
    """ERA5 monthly means at 2 m temperature etc. (reanalysis, not satellite)."""
    ee = _get_ee()
    point = ee.Geometry.Point(aoi_point)
    col = (
        ee.ImageCollection("ECMWF/ERA5/MONTHLY")
        .filterBounds(point)
        .filterDate(start, end)
    )
    t2m = col.select("mean_2m_air_temperature").mean().subtract(273.15)
    return {"t2m_c": t2m}, col.size().getInfo()
