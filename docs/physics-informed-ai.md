# Physics-Informed AI

## The surface energy balance

```text
Rn = H + LE + G
```

- **Rn** net radiation (absorbed shortwave + longwave in/out)
- **H** sensible heat (convection to air)
- **LE** latent heat (evapotranspiration)
- **G** ground heat storage

UrbanFlux interventions act by re-partitioning this balance. The scenario engine
implements **documented first-order heuristics** — literature-motivated,
normalized, and always labelled; never presented as calibrated local physics.

## Intervention mechanisms

### Vegetation (tree canopy, urban greening)

```text
ΔT_veg = − K_veg · f_w · canopy_frac · headroom
```

- `K_veg = 1.8 °C` max cooling at full, moist canopy (meta-analytic scale,
  Bowler et al. 2010).
- `f_w` moisture-availability factor: tropical 1.0, temperate 0.85,
  semi-arid 0.70, **arid 0.55** — evapotranspiration is moisture-limited; the
  platform refuses to promise full vegetative cooling in deserts.
- `headroom = 1 − NDBI` — vegetation can only grow where surface is not built.

### Cool roofs (albedo uplift on roofs)

```text
ΔRn = −Δα · S↓        ΔT_roof = − eligible · frac · S↓ · 0.22 · W→°C
```

- `S↓ = 780 W/m²` clear-sky midday downwelling shortwave (documented default).
- Roof absorption response `0.22` normalized share; `W→°C = 0.015 °C per W/m²`
  rough surface-response conversion. Akbari & Matthews (2012) bound the scale.

### Green roofs

`K_green_roof = 1.1 °C` at full extensive coverage, scaled by `f_w` and
headroom (Oberndorfer et al. 2007; moisture-dependent).

### Water bodies (blue infrastructure)

Oasis-effect advection with distance decay:

```text
ΔT_water = − K_w · water_frac · (1 − d / 1.2 km),  d ≤ 1.2 km
```

`K_w = 2.2 °C` at the water edge (Völker & Körner 2015 scale).

### Albedo (pavement / surfaces)

Generic uplift: `ΔT_albedo = −Δα · S↓ · 0.015`, capped by Δα ≤ 0.45.

## Global constraints

- Total per-cell cooling is **capped at 6 °C** — a physical plausibility bound.
- `cool_roof_frac + green_roof_frac ≤ 1` — roofs compete for the same surface;
  oversubscription is a hard validation error (HTTP 400), not silently resolved.
- Vegetation emissivity ε = 0.97 (documented constant).
- Arid climates get weaker evaporative terms — tested in CI
  (`test_scenario_arid_weaker_evaporative`).

## What this is NOT

- Not a calibrated local model — coefficients are literature-scale, not fitted
  to the AOI.
- Not a substitute for SOLWEIG/InVEST-grade radiation or hydrology modeling
  (optional adapters, roadmap).
- Not causal attribution: driver analysis speaks of *associations*.

## Model roadmap (predictive side)

```text
Total Loss = Prediction Loss
           + λ1 × Physics Constraint Loss (energy-balance consistency)
           + λ2 × Spatial Consistency Loss (neighbor smoothness)
```

λ terms are tuned on validation folds; the constraint residual uses the same
balance above. No universal coefficients are invented — required parameters
are learned from data with physical priors (spec §156).
