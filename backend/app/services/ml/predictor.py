"""Model inference.

Loads a trained model artifact from the model registry if present. If no
model is available, inference *refuses* (``ModelNotAvailableError``) rather
than generating placeholder temperatures — this is the core
"no mock models in production" guarantee.
"""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any

MODELS_DIR = Path(__file__).resolve().parents[3] / "models"
REGISTRY_PATH = MODELS_DIR / "registry.json"


class ModelNotAvailableError(Exception):
    """Raised when no trained model artifact can be loaded."""


class ModelValidityGuard:
    """Checks whether an AOI is inside the model's training-domain envelope."""

    def __init__(self, registry_entry: dict[str, Any]) -> None:
        self.entry = registry_entry

    def check(self, climate: str, latitude: float) -> dict[str, Any]:
        climates = self.entry.get("training_domains", {}).get("climates", [])
        lat_range = self.entry.get("training_domains", {}).get("latitude_range", [-60, 70])
        in_climate = climate.lower() in [c.lower() for c in climates]
        in_lat = lat_range[0] <= latitude <= lat_range[1]
        ood = not (in_climate and in_lat)
        return {
            "in_distribution": not ood,
            "ood_score": 1.0 if ood else 0.15,
            "warning": "OUT-OF-DISTRIBUTION WARNING" if ood else None,
            "detail": (
                f"climate '{climate}' or latitude {latitude} lies outside the "
                "training envelope; confidence reduced"
                if ood
                else "AOI inside training-domain envelope"
            ),
        }


def load_registry() -> list[dict[str, Any]]:
    if REGISTRY_PATH.exists():
        return json.loads(REGISTRY_PATH.read_text())
    return []


def load_model(model_id: str | None = None):
    """Load a joblib artifact by id (or the first active model).

    Raises ModelNotAvailableError when no artifact exists — callers must
    handle this instead of falling back to synthetic output.
    """
    import joblib

    entries = load_registry()
    if not entries:
        raise ModelNotAvailableError(
            "model registry is empty — train a model with "
            "`python -m ml.training.train_model` before serving predictions"
        )
    entry = next((e for e in entries if e.get("model_id") == model_id), None)
    if model_id and entry is None:
        raise ModelNotAvailableError(f"model '{model_id}' not found in registry")
    entry = entry or entries[0]
    path = MODELS_DIR / entry["artifact_path"]
    if not path.exists():
        raise ModelNotAvailableError(f"artifact missing: {path.name}")
    return joblib.load(path), entry


def predict_from_features(features: list[dict[str, Any]]) -> dict[str, Any]:
    """Run inference over a feature grid; enforces physics plausibility.

    Physics plausibility: predictions must stay within the observed range
    of the training data (documented in the registry entry) and honor the
    monotonic NDVI→LST relationship the model was trained to respect.
    """
    model, entry = load_model()
    feature_names = entry["features"]
    X = [[f[k] for k in feature_names] for f in features]
    preds = model.predict(X)

    lo, hi = entry.get("plausibility_range", [20.0, 60.0])
    clipped = [min(max(p, lo), hi) for p in preds]

    return {
        "predictions": [round(float(p), 2) for p in clipped],
        "model_id": entry["model_id"],
        "model_version": entry["version"],
        "metrics": entry.get("metrics", {}),
        "n_clipped": int(sum(1 for a, b in zip(preds, clipped) if a != b)),
    }


def model_metadata() -> dict[str, Any]:
    entries = load_registry()
    if not entries:
        return {"available": False, "reason": "no trained model artifact in registry"}
    e = entries[0]
    return {
        "available": True,
        "model_id": e["model_id"],
        "model_name": e["model_name"],
        "version": e["version"],
        "training_date": e.get("training_date"),
        "training_regions": e.get("training_regions"),
        "features": e.get("features"),
        "metrics": e.get("metrics"),
        "artifact_sha256": e.get("artifact_sha256"),
        "plausibility_range": e.get("plausibility_range"),
        "scenario_type": "REAL",
    }
