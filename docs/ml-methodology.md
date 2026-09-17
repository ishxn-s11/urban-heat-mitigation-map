# ML Methodology

## Model inventory

| Tier | Model | Status in this build |
| --- | --- | --- |
| Baseline 01 | Random Forest | implemented in the global training roadmap; interface defined |
| Baseline 02 | XGBoost / LightGBM | interface defined; swappable via registry |
| **Reference (trained here)** | `HistGradientBoostingRegressor` | **trained artifact in `models/`** |
| Spatial | CNN / U-Net | roadmap (justified when dense rasters are ingested) |
| Physics-informed | hybrid constrained loss | roadmap; constraints specified below |

Simpler models win until real data proves otherwise — the pipeline compares
objectively and the registry keeps every experiment.

## Training set

The shipped artifact is trained on a **documented physically-plausible
generator** (same energy-balance relationships as the scenario engine, plus
noise): 10 features (`ndvi, ndbi, ndwi, albedo, population_density, t2m,
wind, solar, sin_doy, cos_doy`). This is a demonstration training set; the
loader interface (`ml/datasets/`) accepts real GEE-extracted grids for
production training without changing the registry contract.

**These metrics are not claimed as real-world accuracy.**

## Validation

- **Spatial block CV** — `GroupKFold`, 16-cell contiguous blocks, prevents the
  neighbor-leakage a random split would introduce.
- Metrics: MAE, RMSE, R² per fold + pooled out-of-fold.
- Generalization ladder (roadmap): local → regional → unseen-city → unseen-climate.

## Physics constraints

1. **Plausibility range** — predictions clipped to the training-domain LST
   range stored in the registry; clip counts reported.
2. **Monotonicity check** — NDVI→LST must be decreasing at inference time;
   a model violating this fails the physics gate and is not registered.
3. **Roadmap loss term**: `L = L_pred + λ₁·L_energy_balance + λ₂·L_spatial`
   with λ tuned on validation folds; coefficients *learned/derived*, never
   invented (spec §156).

## Uncertainty & validity

- `ModelValidityGuard` checks climate class + latitude against
  `training_domains` → returns `in_distribution`, `ood_score`, and an explicit
  **OUT-OF-DISTRIBUTION WARNING** when extrapolating.
- Confidence decreases with cloud contamination, temporal distance, feature
  gaps, resolution coarsening, and OOD score (spec §157).
- Every prediction carries `model_name, model_version, training_date,
  training_regions, feature_schema, validation_metrics, inference_date`.

## Explainability (SHAP — implemented)

`app/services/ml/shap_service.py` serves per-cell driver attributions from
the trained artifact using **exact tree SHAP**
(`shap.TreeExplainer`, interventional perturbation over a 1,500-sample
background drawn from the training generator).

- `explain_cell(i)` / `explain_cells([...])` return, per cell: top-6 drivers
  with SHAP value (°C contribution), normalized relative contribution (%),
  direction, base value, and predicted LST — cached per model version.
- Feature vectors are built from the **active grid** (demo or live) with
  atmospheric context from the grid provider (ERA5 in live mode).
- Hotspot explanations (`GET /hotspots/{city}/{id}/explanation`) report
  `explanation_method: shap_tree_explainer_exact`, `model_id`,
  `model_version`, `base_value`, `predicted_lst`, and the feature values —
  full traceability to the artifact.
- UI phrasing stays **"model-associated warming factor"** — never causal;
  confidence is MEDIUM (real model, demo grid) and stated in the response.

## Reproducibility

```bash
python -m app.ml.training.train_model   # trains, physics-checks, registers
```

Registry entry: model_id, version, metrics, artifact path + **SHA-256**,
training domains, validation method.
