"""SHAP explainability service.

Produces per-cell driver explanations from the TRAINED model artifact in the
registry — real attributions, not hard-coded numbers. Uses shap.TreeExplainer
(exact tree SHAP, polynomial in features for tree ensembles) over the
registry model; results are cached per model version.

Public-facing labels map internal feature names (ndvi, ndbi, …) to the
vocabulary used across the UrbanFlux UI. The API reports ``explanation_method``
and the model version so every attribution is traceable.
"""

from __future__ import annotations

from typing import Any

from app.services import grid

FEATURE_LABELS = {
    "ndvi": "Vegetation (NDVI)",
    "ndbi": "Built-up Density (NDBI)",
    "ndwi": "Surface Water (NDWI)",
    "albedo": "Surface Albedo",
    "population_density": "Population Density",
    "t2m": "Air Temperature (T2M)",
    "wind": "Wind Speed",
    "solar": "Solar Radiation",
    "sin_doy": "Season (sin)",
    "cos_doy": "Season (cos)",
}

_CACHE: dict[str, Any] = {}


def _grid_cell_features(i: int) -> dict[str, float]:
    """Build the model's feature vector for grid cell *i*.

    Surface features come from the ACTIVE grid (demo or live extraction);
    atmospheric context (t2m, wind, solar) from the grid provider's weather
    record — ERA5 in live mode, documented constants in demo mode.
    """
    F = grid.fields()
    w = grid.weather()
    doy = 134  # mid-May analysis window
    return {
        "ndvi": F["ndvi"][i],
        "ndbi": F["ndbi"][i],
        "ndwi": F["ndwi"][i],
        "albedo": F["albedo"][i],
        "population_density": float(F["population"][i]),
        "t2m": w["t2m"],
        "wind": w["wind"],
        "solar": w["solar"],
        "sin_doy": __import__("math").sin(2 * 3.141592653589793 * doy / 365),
        "cos_doy": __import__("math").cos(2 * 3.141592653589793 * doy / 365),
    }


def _load() -> dict[str, Any] | None:
    """Load the registry model + a background sample. None when absent."""
    if "payload" in _CACHE:
        return _CACHE["payload"]
    try:
        from app.services.ml import predictor

        model, entry = predictor.load_model()
        from app.ml.training.train_model import generate_training_set

        seed = int(str(entry["version"])[:8]) or 7
        X, _y, _g = generate_training_set(n_samples=1500, seed=seed)
        payload = {"model": model, "entry": entry, "background": X}
        _CACHE["payload"] = payload
        return payload
    except Exception:  # noqa: BLE001 — no artifact / shap missing → unavailable
        return None


def _explainer():
    payload = _load()
    if payload is None:
        return None, None
    if "explainer" not in payload:
        import shap

        payload["explainer"] = shap.TreeExplainer(
            payload["model"],
            data=payload["background"],
            feature_perturbation="interventional",
        )
    return payload["explainer"], payload


def explain_cell(cell_index: int) -> dict[str, Any] | None:
    """SHAP attribution for one grid cell. None when no model is available."""
    explainer, payload = _explainer()
    if explainer is None:
        return None

    entry = payload["entry"]
    features = entry["features"]
    x = _grid_cell_features(cell_index)
    import numpy as np

    X = np.array([[x[k] for k in features]])
    sv = explainer.shap_values(X)
    vals = sv[0] if not isinstance(sv, list) else sv[0][0]
    base = float(np.ravel(explainer.expected_value)[0])
    pred = float(base + np.sum(vals))

    pairs = sorted(zip(features, vals), key=lambda t: -abs(t[1]))
    top = [
        {
            "feature": FEATURE_LABELS.get(f, f),
            "internal_feature": f,
            "shap_value": round(float(v), 4),
            "direction": "warming" if v > 0 else "cooling",
        }
        for f, v in pairs[:6]
    ]
    total = sum(abs(v) for _, v in pairs[:6]) or 1.0
    for d in top:
        d["contribution"] = round(100.0 * abs(d["shap_value"]) / total, 1)

    return {
        "explanation_method": "shap_tree_explainer_exact",
        "model_id": entry["model_id"],
        "model_version": entry["version"],
        "base_value": round(base, 3),
        "predicted_lst": round(pred, 2),
        "drivers": top,
        "feature_values": {FEATURE_LABELS.get(k, k): round(x[k], 4) for k in features[:6]},
    }


def explain_cells(indices: list[int]) -> dict[int, dict[str, Any]]:
    """Batch explanation for several cells (one pass over the explainer)."""
    explainer, payload = _explainer()
    if explainer is None:
        return {}
    entry = payload["entry"]
    features = entry["features"]
    import numpy as np

    rows = [[_grid_cell_features(i)[k] for k in features] for i in indices]
    sv = explainer.shap_values(np.array(rows))
    sv = sv[0] if not isinstance(sv, list) else sv[0]
    base = float(np.ravel(explainer.expected_value)[0])

    out: dict[int, dict[str, Any]] = {}
    for k, i in enumerate(indices):
        vals = sv[k]
        pairs = sorted(zip(features, vals), key=lambda t: -abs(t[1]))
        top = [
            {
                "feature": FEATURE_LABELS.get(f, f),
                "internal_feature": f,
                "shap_value": round(float(v), 4),
                "direction": "warming" if v > 0 else "cooling",
            }
            for f, v in pairs[:6]
        ]
        total = sum(abs(v) for _, v in pairs[:6]) or 1.0
        for d in top:
            d["contribution"] = round(100.0 * abs(d["shap_value"]) / total, 1)
        out[i] = {
            "explanation_method": "shap_tree_explainer_exact",
            "model_id": entry["model_id"],
            "model_version": entry["version"],
            "base_value": round(base, 3),
            "predicted_lst": round(base + float(np.sum(vals)), 2),
            "drivers": top,
        }
    return out
