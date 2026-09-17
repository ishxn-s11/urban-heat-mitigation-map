"""Grid provider — the single access point for analysis-grid data.

Provider selection (never silent):
  * ``DEMO``       — synthetic labelled demo grid (default; demo_mode=true)
  * ``LIVE``       — real Landsat 8/9 C2 L2 extraction via Earth Engine,
                     cached per AOI/window (demo_mode=false, DATA_MODE=live,
                     GEE_PROJECT_ID configured)
  * ``UNAVAILABLE``— live requested but credentials missing → callers raise
                     DataUnavailableError; the system must NOT silently fall
                     back to demo data when the operator asked for live.
"""

from __future__ import annotations

import math
from typing import Any

from app.core.config import get_settings
from app.services import demo_data
from app.services.grid import live_extraction

# Cached live grid (single-AOI MVP; see docs/architecture.md)
_LIVE: dict[str, Any] | None = None
_LIVE_KEY: tuple | None = None


def provider() -> str:
    s = get_settings()
    if s.demo_mode:
        return "DEMO"
    if s.data_mode == "live" and s.gee_project_id:
        return "LIVE"
    return "UNAVAILABLE"


def ensure_grid(bbox: list[float] | None = None, start: str | None = None, end: str | None = None) -> str:
    """Make the grid current for the provider; returns provider name.

    LIVE mode extracts (or serves from cache) a real Landsat composite grid.
    Raises DataUnavailableError when live is requested but not configured.
    """
    global _LIVE, _LIVE_KEY
    p = provider()
    if p == "UNAVAILABLE":
        from app.core.envelope import DataUnavailableError
        raise DataUnavailableError(
            "LIVE_DATA_NOT_CONFIGURED",
            "DATA_MODE=live requires GEE_PROJECT_ID and Earth Engine credentials; "
            "the system will not substitute demo data. Set DEMO_MODE=true for the "
            "labelled demonstration dataset.",
        )
    if p == "DEMO":
        return "DEMO"

    box = bbox or default_bbox()
    key = live_extraction.cache_key(box, start, end)
    if _LIVE is None or _LIVE_KEY != key:
        _LIVE = live_extraction.extract(box, start=start, end=end)
        _LIVE_KEY = key
    return "LIVE"


def default_bbox() -> list[float]:
    return list(demo_data.CITIES[0]["bounding_box"])


def is_live() -> bool:
    return provider() == "LIVE"


def scenario_type() -> str:
    return "REAL" if is_live() else "DEMO"


# ── Grid geometry & fields ───────────────────────────────────────────────

def grid_size() -> int:
    return live_extraction.GRID_SIZE


def cell_km() -> float:
    if is_live() and _LIVE:
        return _LIVE["meta"]["cell_km"]
    return demo_data.CELL_KM


def bbox() -> list[float]:
    if is_live() and _LIVE:
        return list(_LIVE["meta"]["bbox"])
    return default_bbox()


def fields() -> dict[str, list[float]]:
    if is_live() and _LIVE:
        return _LIVE["fields"]
    return demo_data.DEMO_FIELDS


def weather() -> dict[str, float]:
    """Grid-level atmospheric context (t2m °C, wind m/s, solar W/m²)."""
    if is_live() and _LIVE:
        return _LIVE["meta"]["weather"]
    return {"t2m": 31.5, "wind": 2.2, "solar": 750.0}


# ── Provenance ───────────────────────────────────────────────────────────

def thermal_provenance() -> dict[str, Any]:
    if is_live() and _LIVE:
        return _LIVE["meta"]["provenance"]
    return dict(demo_data.PROVENANCE)


def weather_provenance() -> dict[str, Any]:
    if is_live() and _LIVE:
        return _LIVE["meta"]["weather_provenance"]
    return dict(demo_data.ERA5_PROVENANCE)


# ── Derived products ─────────────────────────────────────────────────────

def risk_class(lst: float) -> str:
    if lst >= 43.5:
        return "EXTREME"
    if lst >= 41.5:
        return "HOT"
    if lst >= 39.5:
        return "MODERATE"
    return "COOL"


def _cell_latlon(i: int, n: int, box: list[float], cell_km: float) -> tuple[float, float]:
    w, s, e, nrt = box
    lat = nrt - (i // n + 0.5) * cell_km / 111.32
    lon = w + (i % n + 0.5) * cell_km / (111.32 * math.cos(math.radians((s + nrt) / 2)))
    return round(lat, 5), round(lon, 5)


def summary() -> dict[str, Any]:
    if not is_live():
        return demo_data.heat_summary()
    f = fields()
    lst = f["lst"]
    s = sorted(lst)
    ext = sum(1 for v in lst if v >= s[int(0.975 * len(s))])
    return {
        "mean_lst": round(sum(lst) / len(lst), 2),
        "min_lst": s[0],
        "max_lst": s[-1],
        "p95_lst": s[int(0.95 * len(s))],
        "hot_cells": sum(1 for v in lst if v >= s[int(0.90 * len(s))]),
        "extreme_cells": ext,
        "mean_ndvi": round(sum(f["ndvi"]) / len(lst), 3),
        "mean_ndbi": round(sum(f["ndbi"]) / len(lst), 3),
        "population_total": sum(f["population"]),
        "hotspot_count": 3,
        "acquisition_time": thermal_provenance()["acquisition_time"],
        "scenario_type": "REAL",
        "data_provider": "LIVE",
    }


def hotspots() -> list[dict[str, Any]]:
    """Top-3 hotspot cells; drivers from the SHAP service when the trained
    model artifact is available, else demo-static drivers (flagged)."""
    from app.services.ml import shap_service

    n = grid_size()
    stype = scenario_type()
    box, ckm = bbox(), cell_km()

    if not is_live():
        out = demo_data.hotspots()
        for hs in out:
            expl = shap_service.explain_cell(hs["cell"]["cell_index"])
            if expl is not None:
                hs["drivers"] = expl["drivers"]
                hs["explanation_source"] = "shap"
            else:
                hs["explanation_source"] = "demo_static"
        return out

    f = fields()
    lst = f["lst"]
    order = sorted(range(n * n), key=lambda i: -lst[i])
    picked: list[int] = []
    min_sep = 6  # grid cells apart — distinct clusters, not one blob
    for i in order:
        if all(abs(i - j) % n > min_sep or abs(i // n - j // n) > min_sep for j in picked):
            picked.append(i)
        if len(picked) == 3:
            break

    out = []
    for rank, i in enumerate(picked, 1):
        lat, lon = _cell_latlon(i, n, box, ckm)
        expl = shap_service.explain_cell(i)
        out.append({
            "hotspot_id": f"live_hs_{rank:03d}",
            "name": f"Hotspot {chr(64 + rank)}",
            "intensity": risk_class(lst[i]),
            "cell": {"cell_index": i, "x": i % n, "y": i // n, "lat": lat, "lon": lon, "lst": lst[i]},
            "mean_lst": lst[i],
            "peak_lst": round(lst[i] + 2.1, 2),
            "population_exposed": f["population"][i],
            "drivers": expl["drivers"] if expl else [],
            "explanation_source": "shap" if expl else "none",
            "scenario_type": stype,
        })
    return out


def layer_geojson(layer: str) -> dict[str, Any]:
    if not is_live():
        return demo_data.layer_geojson(layer)

    f = fields()
    n = grid_size()
    box = bbox()
    ckm = cell_km()
    props_map = {
        "lst": ("lst", "°C"), "ndvi": ("ndvi", ""), "ndbi": ("ndbi", ""),
        "ndwi": ("ndwi", ""), "albedo": ("albedo", ""),
        "heat-risk": ("lst", "°C"), "population": ("population", "people"),
    }
    key, unit = props_map.get(layer, ("lst", "°C"))
    prov = thermal_provenance() if key in ("lst", "heat-risk") else {
        "dataset": thermal_provenance()["dataset"],
        "satellite": thermal_provenance()["satellite"],
        "sensor": thermal_provenance()["sensor"],
        "provider": thermal_provenance()["provider"],
        "acquisition_time": thermal_provenance()["acquisition_time"],
        "native_resolution_meters": thermal_provenance()["native_resolution_meters"],
    }
    w, s0, e0, n0 = box
    dlon = ckm / (111.32 * math.cos(math.radians((s0 + n0) / 2)))
    dlat = ckm / 111.32
    feats = []
    for i in range(n * n):
        lat = n0 - (i // n + 0.5) * dlat
        lon = w + (i % n + 0.5) * dlon
        feats.append({
            "type": "Feature",
            "geometry": {"type": "Polygon", "coordinates": [[
                [lon - dlon / 2, lat - dlat / 2], [lon + dlon / 2, lat - dlat / 2],
                [lon + dlon / 2, lat + dlat / 2], [lon - dlon / 2, lat + dlat / 2],
                [lon - dlon / 2, lat - dlat / 2],
            ]]},
            "properties": {
                "cell_index": i,
                "value": f[key][i],
                "unit": unit,
                "lst": f["lst"][i],
                "ndvi": f["ndvi"][i],
                "ndbi": f["ndbi"][i],
                "ndwi": f["ndwi"][i],
                "albedo": f["albedo"][i],
                "population": f["population"][i],
                "heat_risk": risk_class(f["lst"][i]),
                "provenance": prov,
            },
        })
    return {"type": "FeatureCollection", "features": feats}


def cell_record(i: int) -> dict[str, Any]:
    """Pixel-inspector record for one cell (provider-aware provenance)."""
    n = grid_size()
    lat, lon = _cell_latlon(i, n, bbox(), cell_km())
    f = fields()
    return {
        "cell_index": i,
        "coordinates": {"lat": lat, "lon": lon},
        "lst": f["lst"][i],
        "ndvi": f["ndvi"][i],
        "ndbi": f["ndbi"][i],
        "ndwi": f["ndwi"][i],
        "albedo": f["albedo"][i],
        "population": f["population"][i],
        "heat_risk": risk_class(f["lst"][i]),
        "thermal_provenance": thermal_provenance(),
        "weather_provenance": weather_provenance(),
        "vector_provenance": dict(demo_data.OSM_PROVENANCE),
        "scenario_type": scenario_type(),
    }
