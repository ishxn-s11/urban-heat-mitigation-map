"""Geocoding provider abstraction.

Default provider: OpenStreetMap Nominatim (no key required, usage-policy
compliant). MapTiler/other providers plug in behind the same interface.
"""

from __future__ import annotations

from typing import Any

import httpx

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
USER_AGENT = "UrbanFlux/1.0 (urban heat research; contact@urbanflux.dev)"


async def search_location(query: str, limit: int = 5) -> list[dict[str, Any]]:
    """Geocode a free-text location (city, address, landmark, coordinates)."""
    # Coordinates directly? "28.6139, 77.2090" or "28.6139 77.2090"
    parts = query.replace(";", ",").split(",")
    if len(parts) == 2:
        try:
            lat = float(parts[0].strip())
            lon = float(parts[1].strip())
            if -90 <= lat <= 90 and -180 <= lon <= 180:
                return [{
                    "name": f"{abs(lat):.4f}° {'N' if lat >= 0 else 'S'}, {abs(lon):.4f}° {'E' if lon >= 0 else 'W'}",
                    "lat": lat, "lon": lon,
                    "type": "coordinates", "source": "coordinate-parse",
                }]
        except ValueError:
            pass

    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(
            NOMINATIM_URL,
            params={"q": query, "format": "jsonv2", "limit": limit, "addressdetails": 1},
            headers={"User-Agent": USER_AGENT},
        )
        resp.raise_for_status()
        results = resp.json()

    out = []
    for r in results:
        address = r.get("address", {})
        out.append({
            "name": r.get("display_name", query),
            "short_name": address.get("city") or address.get("town") or address.get("village") or address.get("county") or r.get("name", query),
            "country": address.get("country"),
            "lat": float(r["lat"]),
            "lon": float(r["lon"]),
            "type": r.get("type"),
            "source": "nominatim",
        })
    return out


def search_location_sync(query: str, limit: int = 5) -> list[dict[str, Any]]:
    import asyncio
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as ex:
                return ex.submit(asyncio.run, search_location(query, limit)).result()
        return loop.run_until_complete(search_location(query, limit))
    except RuntimeError:
        return asyncio.run(search_location(query, limit))
