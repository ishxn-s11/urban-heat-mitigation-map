"""Demo datasets.

These are synthetic demonstration datasets used when Earth Engine is not
configured (``DEMO_MODE=true``). Every value derived from them is flagged
``scenario_type="DEMO"`` downstream and the UI labels it DEMO SCENARIO.
Nothing in this module may be presented as observational data.

Demo Delhi AOI: 40×40 grid, ~0.5 km spacing, centered 28.6139°N 77.2090°E.
"""

from __future__ import annotations

import math
from typing import Any

# ── City catalog ─────────────────────────────────────────────────────────
CITIES: list[dict[str, Any]] = [
    {
        "city_id": "delhi",
        "name": "Delhi",
        "country": "India",
        "latitude": 28.6139,
        "longitude": 77.2090,
        "bounding_box": [76.8387, 28.4046, 77.3486, 28.8834],
        "timezone": "Asia/Kolkata",
        "default_zoom": 11,
        "available_datasets": ["landsat9", "sentinel2", "modis", "viirs", "era5", "osm"],
    },
    {
        "city_id": "tokyo",
        "name": "Tokyo",
        "country": "Japan",
        "latitude": 35.6762,
        "longitude": 139.6503,
        "bounding_box": [139.3451, 35.5011, 139.9160, 35.8984],
        "timezone": "Asia/Tokyo",
        "default_zoom": 11,
        "available_datasets": ["landsat9", "sentinel2", "modis", "viirs", "era5", "osm"],
    },
    {
        "city_id": "phoenix",
        "name": "Phoenix",
        "country": "USA",
        "latitude": 33.4484,
        "longitude": -112.0740,
        "bounding_box": [-112.3239, 33.2650, -111.8250, 33.6960],
        "timezone": "America/Phoenix",
        "default_zoom": 11,
        "available_datasets": ["landsat9", "sentinel2", "modis", "viirs", "era5", "osm"],
    },
    {
        "city_id": "lagos",
        "name": "Lagos",
        "country": "Nigeria",
        "latitude": 6.5244,
        "longitude": 3.3792,
        "bounding_box": [3.0386, 6.3342, 3.7199, 6.7357],
        "timezone": "Africa/Lagos",
        "default_zoom": 11,
        "available_datasets": ["landsat9", "sentinel2", "modis", "viirs", "era5", "osm"],
    },
    {
        "city_id": "dubai",
        "name": "Dubai",
        "country": "UAE",
        "latitude": 25.2048,
        "longitude": 55.2708,
        "bounding_box": [54.9419, 24.7901, 55.4650, 25.3400],
        "timezone": "Asia/Dubai",
        "default_zoom": 11,
        "available_datasets": ["landsat9", "sentinel2", "modis", "viirs", "era5", "osm"],
    },
    {
        "city_id": "london",
        "name": "London",
        "country": "UK",
        "latitude": 51.5074,
        "longitude": -0.1278,
        "bounding_box": [-0.5103, 51.2867, 0.3340, 51.6918],
        "timezone": "Europe/London",
        "default_zoom": 11,
        "available_datasets": ["landsat9", "sentinel2", "modis", "viirs", "era5", "osm"],
    },
    {
        "city_id": "singapore",
        "name": "Singapore",
        "country": "Singapore",
        "latitude": 1.3521,
        "longitude": 103.8198,
        "bounding_box": [103.6056, 1.1292, 104.0331, 1.4714],
        "timezone": "Asia/Singapore",
        "default_zoom": 11,
        "available_datasets": ["landsat9", "sentinel2", "modis", "viirs", "era5", "osm"],
    },
]

# ── Mission eras for the historical timeline (real product boundaries) ───
MISSION_ERAS: list[dict[str, Any]] = [
    {"label": "LANDSAT ARCHIVE", "start_year": 1972, "end_year": 1981,
     "satellite": "Landsat 1–3", "sensor": "MSS", "dataset": "Landsat MSS Archive",
     "resolution": "80 m", "note": "imagery only — no surface-temperature product"},
    {"label": "LANDSAT THERMAL PRODUCTS", "start_year": 1982, "end_year": 1998,
     "satellite": "Landsat 4/5", "sensor": "TM Band 6", "dataset": "Landsat Collection 2 Level-2",
     "resolution": "60–120 m", "note": "surface temperature from TM thermal band"},
    {"label": "LANDSAT 7 ERA", "start_year": 1999, "end_year": 2012,
     "satellite": "Landsat 7", "sensor": "ETM+ Band 6", "dataset": "Landsat Collection 2 Level-2",
     "resolution": "60 m", "note": "SLC-off after 2003 lowers usable scenes"},
    {"label": "TERRA / MODIS", "start_year": 2000, "end_year": None,
     "satellite": "Terra", "sensor": "MODIS", "dataset": "MOD11A2",
     "resolution": "1 km", "note": "8-day LST/emissivity, twice-daily overpass"},
    {"label": "AQUA / MODIS", "start_year": 2002, "end_year": None,
     "satellite": "Aqua", "sensor": "MODIS", "dataset": "MYD11A2",
     "resolution": "1 km", "note": "afternoon overpass complements Terra"},
    {"label": "SUOMI NPP / VIIRS", "start_year": 2011, "end_year": None,
     "satellite": "Suomi NPP", "sensor": "VIIRS", "dataset": "VNP21A2",
     "resolution": "1 km", "note": "daily global LST at moderate resolution"},
    {"label": "SENTINEL-2", "start_year": 2015, "end_year": None,
     "satellite": "Sentinel-2A/B/C", "sensor": "MSI", "dataset": "Level-2A",
     "resolution": "10 m", "note": "optical only — MSI has no thermal band"},
    {"label": "SENTINEL-3", "start_year": 2016, "end_year": None,
     "satellite": "Sentinel-3A/B", "sensor": "SLSTR", "dataset": "Level-2 LST",
     "resolution": "1 km", "note": "global thermal continuity"},
    {"label": "ECOSTRESS / ISS", "start_year": 2018, "end_year": None,
     "satellite": "ISS (platform, not satellite)", "sensor": "ECOSTRESS",
     "dataset": "ECO2LSTE", "resolution": "70 m",
     "note": "non-sun-synchronous orbit — availability checked dynamically"},
]

# ── Spacecraft active per year (demo selection, mirrors real lifetimes) ──
_SAT_TIMELINE: list[tuple[int, str, str]] = [
    (1982, "Landsat 4", "TM"),
    (1984, "Landsat 5", "TM"),
    (1999, "Landsat 7", "ETM+"),
    (1999, "Terra", "MODIS"),
    (2002, "Aqua", "MODIS"),
    (2013, "Landsat 8", "OLI / TIRS"),
    (2015, "Sentinel-2A", "MSI"),
    (2016, "Sentinel-3A", "SLSTR"),
    (2017, "Sentinel-2B", "MSI"),
    (2018, "ISS / ECOSTRESS", "ECOSTRESS"),
    (2018, "Sentinel-3B", "SLSTR"),
    (2021, "Landsat 9", "OLI-2 / TIRS-2"),
]


def satellite_for_year(year: int) -> tuple[str, str]:
    """Most recently launched platform still operating in the given year."""
    candidates = [(y, s, sn) for (y, s, sn) in _SAT_TIMELINE if y <= year]
    if not candidates:
        return ("Landsat 4", "TM")
    _, sat, sensor = max(candidates, key=lambda t: t[0])
    return (sat, sensor)


# ── Historical summer-LST anomaly (°C vs 1982–1990 mean), synthetic ──────
_HIST_TREND: list[tuple[int, float]] = [
    (1982, -0.62), (1984, -0.55), (1986, -0.48), (1988, -0.39), (1990, -0.30),
    (1992, -0.25), (1994, -0.14), (1996, -0.08), (1998, 0.02), (2000, 0.10),
    (2002, 0.18), (2004, 0.28), (2006, 0.35), (2008, 0.46), (2010, 0.58),
    (2012, 0.62), (2014, 0.70), (2016, 0.84), (2018, 0.95), (2020, 1.08),
    (2022, 1.24), (2024, 1.38), (2026, 1.52),
]


class _Rng:
    """Tiny deterministic RNG so demo data is stable across processes."""

    def __init__(self, seed: int) -> None:
        self.state = seed & 0xFFFFFFFF

    def next(self) -> float:
        self.state = (1103515245 * self.state + 12345) & 0x7FFFFFFF
        return self.state / 0x7FFFFFFF

    def uniform(self, a: float, b: float) -> float:
        return a + (b - a) * self.next()


def _demo_fields(seed: int) -> dict[str, list[float]]:
    """Generate the 40×40 demo feature grid, deterministic by seed."""
    rng = _Rng(seed)
    n = 40
    center = (20, 22)

    fields: dict[str, list[float]] = {}
    specs = [
        ("ndvi", 0.35, 0.25, -0.18, 0.08),
        ("ndbi", 0.20, 0.18, 0.20, 0.07),
        ("ndwi", 0.05, 0.12, -0.04, 0.05),
        ("albedo", 0.18, 0.06, -0.03, 0.02),
    ]
    for name, base, spread, center_boost, jitter in specs:
        vals: list[float] = []
        for i in range(n * n):
            ix, iy = i % n, i // n
            d = math.hypot(ix - center[0], iy - center[1]) / 28.0
            v = base + center_boost * (1.0 - min(d, 1.0)) + rng.uniform(-jitter, jitter)
            vals.append(round(min(max(v, -0.98), 0.98), 3))
        fields[name] = vals

    # LST driven by the same fields — demo surface-energy logic (34–46 °C).
    lst: list[float] = []
    for i in range(n * n):
        ix, iy = i % n, i // n
        d = math.hypot(ix - center[0], iy - center[1]) / 28.0
        v = (
            40.5
            - fields["ndvi"][i] * 4.5
            + fields["ndbi"][i] * 6.0
            - fields["ndwi"][i] * 3.0
            - (fields["albedo"][i] - 0.18) * 8.0
            - d * 3.2
            + rng.uniform(-0.6, 0.6)
        )
        lst.append(round(min(max(v, 33.5), 46.0), 2))
    fields["lst"] = lst

    pop = [round(max(0.0, (1.0 - min(math.hypot((i % n) - center[0], (i // n) - center[1]) / 20.0, 1.0)) * 9500 + rng.uniform(-900, 900))) for i in range(n * n)]
    fields["population"] = pop

    return fields


# Precomputed once at import; identical for every request.
DEMO_FIELDS: dict[str, list[float]] = _demo_fields(seed=42)
GRID_SIZE = 40
CELL_KM = 0.5

PROVENANCE = {
    "mission": "Landsat 9",
    "satellite": "Landsat 9",
    "platform": "Landsat 9",
    "instrument": "OLI-2 / TIRS-2",
    "sensor": "OLI-2 / TIRS-2",
    "dataset": "Landsat Collection 2 Level-2",
    "product": "Surface Temperature",
    "acquisition_time": "2026-05-14T10:35:00Z",
    "native_resolution_meters": 30,
    "provider": "USGS",
    "cloud_cover": 4.8,
    "quality_flags": ["clear"],
    "scene_id": "LC09_L2SP_146040_20260514_02_T1",
    "processing_level": "L2SP",
}

ERA5_PROVENANCE = {
    "dataset": "ERA5",
    "type": "Global atmospheric reanalysis",
    "producer": "ECMWF",
    "service": "Copernicus Climate Change Service",
    "native_resolution_meters": 31000,
    "variables": ["2m_temperature", "relative_humidity", "wind_speed", "surface_solar_radiation_downwards"],
    "note": "Not satellite imagery.",
}

OSM_PROVENANCE = {
    "dataset": "OpenStreetMap",
    "type": "Vector infrastructure",
    "provider": "© OpenStreetMap contributors (ODbL)",
    "variables": ["buildings", "roads", "parks", "waterways"],
}


def hotspots() -> list[dict[str, Any]]:
    """Three demo hotspots with cell-anchored metrics (all DEMO values)."""
    fields = DEMO_FIELDS
    lst = fields["lst"]
    n = GRID_SIZE

    def cell(i: int) -> dict[str, Any]:
        ix, iy = i % n, i // n
        return {
            "cell_index": i,
            "x": ix,
            "y": iy,
            "lat": round(28.8834 - (iy + 0.5) * CELL_KM / 111.32, 5),
            "lon": round(76.8387 + (ix + 0.5) * CELL_KM / (111.32 * math.cos(math.radians(28.6))), 5),
            "lst": lst[i],
        }

    picks = [
        {"i": 14 * 40 + 27, "id": "hs_001", "name": "Industrial Core", "intensity": "EXTREME",
         "drivers": [
             {"feature": "Built-up Density", "contribution": 31.0, "direction": "warming"},
             {"feature": "Low Vegetation", "contribution": 24.0, "direction": "warming"},
             {"feature": "Air Temperature", "contribution": 18.0, "direction": "warming"},
             {"feature": "Low Surface Albedo", "contribution": 13.0, "direction": "warming"},
             {"feature": "Water Proximity", "contribution": 7.0, "direction": "cooling"},
             {"feature": "Wind Speed", "contribution": 6.0, "direction": "cooling"},
         ]},
        {"i": 26 * 40 + 12, "id": "hs_002", "name": "Transport Interchange", "intensity": "HOT",
         "drivers": [
             {"feature": "Road Density", "contribution": 28.0, "direction": "warming"},
             {"feature": "Built-up Density", "contribution": 22.0, "direction": "warming"},
             {"feature": "Low Albedo Pavement", "contribution": 19.0, "direction": "warming"},
             {"feature": "Impervious Surface", "contribution": 15.0, "direction": "warming"},
             {"feature": "Park Distance", "contribution": 9.0, "direction": "warming"},
             {"feature": "Vegetation Cooling", "contribution": 7.0, "direction": "cooling"},
         ]},
        {"i": 9 * 40 + 33, "id": "hs_003", "name": "Dense Low-Rise", "intensity": "HOT",
         "drivers": [
             {"feature": "Building Density", "contribution": 27.0, "direction": "warming"},
             {"feature": "Tree Canopy Deficit", "contribution": 23.0, "direction": "warming"},
             {"feature": "Anthropogenic Heat", "contribution": 17.0, "direction": "warming"},
             {"feature": "Air Temperature", "contribution": 14.0, "direction": "warming"},
             {"feature": "Water Proximity", "contribution": 11.0, "direction": "cooling"},
             {"feature": "Wind Speed", "contribution": 8.0, "direction": "cooling"},
         ]},
    ]

    out = []
    for p in picks:
        c = cell(p["i"])
        out.append({
            "hotspot_id": p["id"],
            "name": p["name"],
            "intensity": p["intensity"],
            "cell": c,
            "mean_lst": c["lst"],
            "peak_lst": round(c["lst"] + 2.1, 2),
            "population_exposed": fields["population"][p["i"]],
            "drivers": p["drivers"],
            "scenario_type": "DEMO",
        })
    return out


def heat_summary() -> dict[str, Any]:
    lst = DEMO_FIELDS["lst"]
    s = sorted(lst)
    mean = sum(lst) / len(lst)
    return {
        "mean_lst": round(mean, 2),
        "min_lst": s[0],
        "max_lst": s[-1],
        "p95_lst": s[int(0.95 * len(s))],
        "hot_cells": sum(1 for v in lst if v >= s[int(0.90 * len(s))]),
        "extreme_cells": sum(1 for v in lst if v >= s[int(0.975 * len(s))]),
        "mean_ndvi": round(sum(DEMO_FIELDS["ndvi"]) / len(lst), 3),
        "mean_ndbi": round(sum(DEMO_FIELDS["ndbi"]) / len(lst), 3),
        "population_total": sum(DEMO_FIELDS["population"]),
        "hotspot_count": 3,
        "acquisition_time": PROVENANCE["acquisition_time"],
        "scenario_type": "DEMO",
    }


def timeseries() -> list[dict[str, Any]]:
    base = heat_summary()["mean_lst"] - _HIST_TREND[0][1]
    return [
        {"year": y, "anomaly": a, "mean_summer_lst": round(base + a, 2),
         "satellite": satellite_for_year(y)[0], "sensor": satellite_for_year(y)[1],
         "scenario_type": "DEMO"}
        for (y, a) in _HIST_TREND
    ]


def history_availability() -> dict[str, Any]:
    return {
        "earliest_year": 1972,
        "lst_earliest_year": 1982,
        "eras": MISSION_ERAS,
        "scenario_type": "DEMO",
    }


def layer_geojson(layer: str) -> dict[str, Any]:
    """GeoJSON FeatureCollection of demo cells for the requested layer."""
    fields = DEMO_FIELDS
    n = GRID_SIZE
    props_map = {
        "lst": ("lst", "°C"),
        "ndvi": ("ndvi", ""),
        "ndbi": ("ndbi", ""),
        "ndwi": ("ndwi", ""),
        "albedo": ("albedo", ""),
        "heat-risk": ("lst", "°C"),
        "population": ("population", "people"),
    }
    key, unit = props_map.get(layer, ("lst", "°C"))
    feats = []
    for i in range(n * n):
        ix, iy = i % n, i // n
        lat = 28.8834 - (iy + 0.5) * CELL_KM / 111.32
        lon = 76.8387 + (ix + 0.5) * CELL_KM / (111.32 * math.cos(math.radians(28.6)))
        feats.append({
            "type": "Feature",
            "geometry": {"type": "Polygon", "coordinates": [[
                [lon, lat], [lon + CELL_KM / (111.32 * math.cos(math.radians(28.6))), lat],
                [lon + CELL_KM / (111.32 * math.cos(math.radians(28.6))), lat + CELL_KM / 111.32],
                [lon, lat + CELL_KM / 111.32], [lon, lat],
            ]]},
            "properties": {
                "cell_index": i,
                "value": fields[key][i],
                "unit": unit,
                "lst": fields["lst"][i],
                "ndvi": fields["ndvi"][i],
                "ndbi": fields["ndbi"][i],
                "ndwi": fields["ndwi"][i],
                "albedo": fields["albedo"][i],
                "population": fields["population"][i],
                "heat_risk": _risk_class(fields["lst"][i]),
                "provenance": PROVENANCE if key in ("lst", "heat-risk") else {"dataset": "Sentinel-2 Level-2A", "instrument": "MSI", "satellite": "Sentinel-2A/B", "sensor": "MSI", "provider": "Copernicus", "acquisition_time": "2026-05-12T10:20:00Z", "native_resolution_meters": 10},
            },
        })
    return {"type": "FeatureCollection", "features": feats}


def _risk_class(lst: float) -> str:
    if lst >= 43.5:
        return "EXTREME"
    if lst >= 41.5:
        return "HOT"
    if lst >= 39.5:
        return "MODERATE"
    return "COOL"
