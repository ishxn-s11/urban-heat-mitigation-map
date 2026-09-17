"""Provenance service.

Every generated raster or prediction must be traceable. This module
computes the provenance record attached to analysis outputs:
source dataset, scene ids, satellite, sensor, acquisition time, processing
steps, model version, feature version, job id, and an output hash.
"""

from __future__ import annotations

import hashlib
import json
from typing import Any

from app.services.demo_data import ERA5_PROVENANCE, OSM_PROVENANCE, PROVENANCE

FEATURE_VERSION = "feat-v1.2"
PIPELINE_STEPS = [
    "scene_discovery",
    "cloud_masking(QA_PIXEL)",
    "crs_normalization(EPSG:4326)",
    "resample_to_grid",
    "feature_computation",
    "temporal_alignment",
    "model_inference",
]


def output_hash(payload: Any) -> str:
    return hashlib.sha256(json.dumps(payload, sort_keys=True, default=str).encode()).hexdigest()[:16]


def analysis_provenance(job_id: str, extra: dict[str, Any] | None = None) -> dict[str, Any]:
    record = {
        "source_dataset": PROVENANCE["dataset"],
        "source_scene_ids": [PROVENANCE["scene_id"]],
        "satellite": PROVENANCE["mission"],
        "sensor": PROVENANCE["instrument"],
        "acquisition_time": PROVENANCE["acquisition_time"],
        "processing_steps": PIPELINE_STEPS,
        "feature_version": FEATURE_VERSION,
        "auxiliary": [
            {"dataset": ERA5_PROVENANCE["dataset"], "type": ERA5_PROVENANCE["type"],
             "producer": ERA5_PROVENANCE["producer"]},
            {"dataset": OSM_PROVENANCE["dataset"], "type": OSM_PROVENANCE["type"],
             "provider": OSM_PROVENANCE["provider"]},
        ],
        "job_id": job_id,
        "scenario_type": "DEMO",
    }
    if extra:
        record.update(extra)
    record["output_hash"] = output_hash(record)
    return record
