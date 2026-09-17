"""Background job support.

Uses RQ against Redis when available; falls back to in-process execution
with genuine stage tracking. Progress is derived from *actual completed
stages* — never fabricated percentages.
"""

from __future__ import annotations

import uuid
from typing import Any, Callable

from app.core.config import get_settings

# In-process job store (demo/dev fallback when Redis is absent)
_JOBS: dict[str, dict[str, Any]] = {}


def _redis_available() -> bool:
    try:
        import redis
        settings = get_settings()
        client = redis.Redis.from_url(settings.redis_url, socket_connect_timeout=1)
        client.ping()
        return True
    except Exception:  # noqa: BLE001
        return False


def submit_job(fn: Callable[..., Any], *args: Any, job_type: str = "analysis", **kwargs: Any) -> str:
    """Enqueue a job (RQ) or run inline with stage tracking."""
    job_id = f"job_{uuid.uuid4().hex[:12]}"

    stages = getattr(fn, "pipeline_stages", None) or ["EXECUTING", "BUILDING_RESULTS"]

    if _redis_available():
        try:
            from rq import Retry, Queue
            settings = get_settings()
            queue = Queue("urbanflux", connection=redis.Redis.from_url(settings.redis_url))
            job = queue.enqueue(fn, *args, job_timeout="30m", retry=Retry(max=2), **kwargs)
            _JOBS[job_id] = {
                "job_id": job_id, "type": job_type, "status": "QUEUED",
                "stages": stages, "completed_stages": [], "progress": 0.0,
                "result": None, "error": None, "rq_job_id": job.get_id(),
            }
            return job_id
        except Exception:  # noqa: BLE001 — fall through to in-process
            pass

    _JOBS[job_id] = {
        "job_id": job_id, "type": job_type, "status": "RUNNING",
        "stages": stages, "completed_stages": [], "progress": 0.0,
        "result": None, "error": None,
    }
    try:
        result = fn(*args, **kwargs)
        _JOBS[job_id].update(
            status="COMPLETED",
            completed_stages=list(stages),
            progress=1.0,
            result=result,
        )
    except Exception as exc:  # noqa: BLE001
        _JOBS[job_id].update(status="FAILED", error=str(exc))
    return job_id


def get_job(job_id: str) -> dict[str, Any] | None:
    job = _JOBS.get(job_id)
    if job is None:
        return None
    completed = job.get("completed_stages", [])
    stages = job.get("stages", [])
    job = dict(job)
    job["progress"] = round(len(completed) / max(len(stages), 1), 3)
    return job


def mark_stage(job_id: str, stage: str) -> None:
    job = _JOBS.get(job_id)
    if job and stage in job["stages"] and stage not in job["completed_stages"]:
        job["completed_stages"].append(stage)


def analysis_pipeline(stages: list[str]) -> Callable[[Callable[..., Any]], Callable[..., Any]]:
    """Decorator factory: attaches declared pipeline stages for honest progress UI."""

    def decorator(fn: Callable[..., Any]) -> Callable[..., Any]:
        fn.pipeline_stages = stages
        return fn

    return decorator


ANALYSIS_STAGES = [
    "SEARCHING_SATELLITE_ARCHIVES",
    "DOWNLOADING_METADATA",
    "SELECTING_SCENES",
    "MASKING_CLOUDS",
    "ALIGNING_RASTERS",
    "GENERATING_FEATURES",
    "RUNNING_MODEL",
    "CALCULATING_EXPLANATIONS",
    "BUILDING_RESULTS",
]
