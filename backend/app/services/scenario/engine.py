"""Scenario engine — documented first-order surface energy-balance heuristics.

METHOD (see docs/physics-informed-ai.md for the full derivation):

Surface energy balance:  Rn = H + LE + G

Interventions alter the partition:

* Vegetation (canopy / green roofs) raises the latent-heat fraction LE via
  evapotranspiration. Cooling scales with a moisture-availability factor
  ``f_w`` — arid regions receive less evaporative cooling per unit of new
  vegetation because evapotranspiration is moisture-limited.
* Albedo increase reduces absorbed shortwave: ΔRn = -Δα · S↓.
* Water bodies add evaporative cooling with distance-decayed advection
  (oasis effect), capped to avoid over-claiming.

All coefficients are literature-motivated, normalized, and clearly labelled
as first-order heuristics — never as calibrated local physics. Outputs are
always returned with ``scenario_type`` so callers can flag DEMO vs REAL.
"""

from __future__ import annotations

import math
from typing import Any

from app.services import grid

# ── Documented, literature-motivated coefficients ────────────────────────
K_VEG = 1.8          # max °C cooling from full canopy (moist, closed canopy)
K_GREEN_ROOF = 1.1   # max °C from full green-roof coverage (extensive)
S_DOWN = 780.0       # typical clear-sky midday downwelling shortwave, W/m²
W_M2_TO_DEG_C = 0.015  # rough W/m² → °C surface-response factor (documented)
OASIS_KM = 1.2       # water-body advective influence radius (km)
WATER_K = 2.2        # max °C at the water edge, fully open surface
F_W_HUMID = 1.0
F_W_ARID = 0.55      # moisture limitation factor for arid/semi-arid climates
EPS_VEG = 0.97       # vegetation emissivity (documented constant)

CLIMATE_F_W = {
    "tropical": F_W_HUMID,
    "temperate": 0.85,
    "arid": F_W_ARID,
    "semi-arid": 0.7,
}


def scenario_type() -> str:
    return grid.scenario_type()


def moisture_factor(climate: str) -> float:
    return CLIMATE_F_W.get(climate.lower(), 0.85)


def simulate_scenario(
    climate: str = "semi-arid",
    tree_canopy_percent: float = 0.0,
    cool_roof_percent: float = 0.0,
    green_roof_percent: float = 0.0,
    albedo_delta: float = 0.0,
    water_area_delta: float = 0.0,
    target_zone: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Cell-level scenario simulation over the active grid (demo or live).

    Returns simulated lst grid, deltas, summary statistics, and provenance.
    Every output carries ``scenario_type`` — DEMO on demo data, REAL on a
    live Earth-Engine-extracted grid (heuristic response model either way).
    """
    grid.ensure_grid()
    f_w = moisture_factor(climate)
    n = grid.grid_size()
    stype = grid.scenario_type()
    F = grid.fields()
    lst, ndvi, ndbi, albedo, pop = F["lst"], F["ndvi"], F["ndbi"], F["albedo"], F["population"]

    canopy_frac = tree_canopy_percent / 100.0
    cool_roof_frac = cool_roof_percent / 100.0
    green_roof_frac = green_roof_percent / 100.0
    water_frac = water_area_delta / 100.0

    # Cap: interventions compete for the same surface.
    if cool_roof_frac + green_roof_frac > 1.0:
        raise ValueError("cool_roof_percent + green_roof_percent cannot exceed 100%")

    veg_headroom = [max(0.0, 1.0 - ndbi[i]) for i in range(n * n)]
    cool_elig = [max(0.0, ndbi[i]) for i in range(n * n)]

    center = (n / 2, n / 2 + 2)
    new_water_center = center if water_frac > 0 else None
    cell_km = grid.cell_km()

    sim, delta, pop_benefited = [], [], 0
    for i in range(n * n):
        ix, iy = i % n, i // n

        # Vegetation: scale by local headroom and moisture factor.
        d_veg = K_VEG * f_w * canopy_frac * veg_headroom[i]
        d_green_roof = K_GREEN_ROOF * f_w * green_roof_frac * veg_headroom[i]

        # Cool roofs: radiative term ΔRn = -Δα·S↓ converted to °C response.
        d_cool_roof = cool_elig[i] * cool_roof_frac * S_DOWN * 0.22 * W_M2_TO_DEG_C

        # Generic albedo uplift (pavement etc.).
        d_albedo = albedo_delta * S_DOWN * W_M2_TO_DEG_C

        # Water advection with distance decay (oasis effect).
        d_water = 0.0
        if new_water_center is not None:
            dist_km = math.hypot(ix - new_water_center[0], iy - new_water_center[1]) * cell_km
            if dist_km <= OASIS_KM:
                d_water = WATER_K * water_frac * (1.0 - dist_km / OASIS_KM)

        d = -(d_veg + d_green_roof + d_cool_roof + d_albedo + d_water)
        d = max(d, -6.0)  # physical plausibility cap

        sim.append(round(lst[i] + d, 2))
        delta.append(round(d, 2))
        if d < -0.15:
            pop_benefited += pop[i]

    sim_vals = sorted(sim)
    summary = {
        "mean_delta_lst": round(sum(delta) / len(delta), 2),
        "max_cooling": round(min(delta), 2),
        "mean_simulated_lst": round(sum(sim) / len(sim), 2),
        "min_simulated_lst": sim_vals[0],
        "max_simulated_lst": sim_vals[-1],
        "population_benefited": pop_benefited,
        "population_pct": round(100 * pop_benefited / max(sum(pop), 1), 1),
        "hotspot_count_before": sum(1 for v in lst if v >= 43.5),
        "hotspot_count_after": sum(1 for v in sim if v >= 43.5),
        "estimated_cost_usd": round(
            canopy_frac * 4_000_000
            + cool_roof_frac * 2_600_000
            + green_roof_frac * 9_000_000
            + water_frac * 6_500_000
            + albedo_delta * 1_800_000,
            0,
        ),
        "scenario_type": stype,
    }

    provenance = dict(grid.thermal_provenance())
    provenance.update({
        "model": "UrbanFlux first-order energy-balance heuristic v1.0",
        "grid_provider": grid.provider(),
        "assumptions": [
            f"moisture availability factor f_w = {f_w} for climate '{climate}'",
            f"ΔRn = -Δα · S↓ with S↓ = {S_DOWN:.0f} W/m²",
            f"water advective radius {OASIS_KM} km, edge cooling capped at {WATER_K} °C",
            "first-order heuristic — not a calibrated local physical model",
        ],
    })

    return {
        "scenario_type": stype,
        "simulated_lst": sim,
        "delta_lst": delta,
        "summary": summary,
        "provenance": provenance,
        "climate": climate,
        "params": {
            "tree_canopy_percent": tree_canopy_percent,
            "cool_roof_percent": cool_roof_percent,
            "green_roof_percent": green_roof_percent,
            "albedo_delta": albedo_delta,
            "water_area_delta": water_area_delta,
        },
    }


def compare(a: dict[str, Any], b: dict[str, Any]) -> dict[str, Any]:
    """Compare two scenario runs (e.g. strategy A vs strategy B)."""
    return {
        "baseline": a["summary"]["mean_simulated_lst"],
        "challenger": b["summary"]["mean_simulated_lst"],
        "delta_mean": round(b["summary"]["mean_delta_lst"] - a["summary"]["mean_delta_lst"], 2),
        "delta_population": b["summary"]["population_benefited"] - a["summary"]["population_benefited"],
        "delta_cost": b["summary"]["estimated_cost_usd"] - a["summary"]["estimated_cost_usd"],
        "scenario_type": scenario_type(),
    }
