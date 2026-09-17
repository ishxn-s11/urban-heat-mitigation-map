"""Security helpers: safe path resolution and input sanitization.

No authentication is enforced for the research/demo MVP; the architecture
reserves role support (Admin / Researcher / Urban Planner / Viewer) for a
later phase without blocking the primary urban-heat workflow.
"""

from __future__ import annotations

import re
from pathlib import Path

_SAFE_ID = re.compile(r"^[A-Za-z0-9_\-]{1,64}$")
_CONTROL_CHARS = re.compile(r"[\x00-\x1f\x7f]")


def validate_id(value: str) -> str:
    """Validate route/path identifiers to prevent traversal or injection."""
    if not _SAFE_ID.match(value):
        raise ValueError(f"invalid identifier: {value!r}")
    return value


def sanitize_text(value: str, max_length: int = 500) -> str:
    """Strip control characters and cap length for storage/logging safety."""
    cleaned = _CONTROL_CHARS.sub("", value)
    return cleaned[:max_length]


def safe_join(base: Path, *parts: str) -> Path:
    """Join paths, refusing anything that escapes the base directory."""
    resolved = (base / Path(*parts)).resolve()
    base_resolved = base.resolve()
    if not str(resolved).startswith(str(base_resolved)):
        raise ValueError("path traversal attempt blocked")
    return resolved
