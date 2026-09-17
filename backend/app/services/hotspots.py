"""Hotspot detection.

Default methodology: adaptive percentile thresholds (top decile). The
methodology is configurable; methods not yet wired to real statistical
plumbing raise an explicit error rather than silently substituting output.
"""

from __future__ import annotations

from typing import Any

from app.services.demo_data import DEMO_FIELDS

VALID_METHODS = ("adaptive_percentile", "fixed", "getis_ord", "dbscan")


def classify_hotspots(method: str = "adaptive_percentile") -> list[dict[str, Any]]:
    """Return hotspot classification over the demo grid.

    adaptive_percentile — top decile cells become HOT/EXTREME via LST bands.
    Other methods raise NotImplementedError until wired to real data.
    """
    if method not in VALID_METHODS:
        raise ValueError(f"unknown hotspot method: {method}")

    if method != "adaptive_percentile":
        raise NotImplementedError(
            f"hotspot method '{method}' is specified but not yet wired to "
            "real statistical plumbing; refusing to silently substitute output"
        )

    lst = sorted(DEMO_FIELDS["lst"])
    p90 = lst[int(0.90 * len(lst))]
    p975 = lst[int(0.975 * len(lst))]

    hotspots = demo_hotspots()
    for hs in hotspots:
        if hs["mean_lst"] >= p975:
            hs["intensity"] = "EXTREME"
        elif hs["mean_lst"] >= p90:
            hs["intensity"] = "HOT"
        else:
            hs["intensity"] = "MODERATE"
        hs["method"] = method
        hs["thresholds"] = {"p90": p90, "p975": p975}
    return hotspots


def demo_hotspots() -> list[dict[str, Any]]:
    from app.services.demo_data import hotspots as _h
    return _h()
