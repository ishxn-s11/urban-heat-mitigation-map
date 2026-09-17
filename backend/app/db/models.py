"""SQLAlchemy models for persisted platform state.

Mirrors the in-memory dict contracts exactly: every column maps to a key
the API already returns, so switching to the repository layer does not
change any response shape.
"""

from __future__ import annotations

from typing import Any

from sqlalchemy import JSON, Float, String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class AOIRecord(Base):
    __tablename__ = "aois"

    aoi_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    geometry: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    centroid: Mapped[list[float]] = mapped_column(JSON, nullable=False)
    bounding_box: Mapped[list[float]] = mapped_column(JSON, nullable=False)
    country: Mapped[str | None] = mapped_column(String(120), nullable=True)
    region: Mapped[str | None] = mapped_column(String(120), nullable=True)
    city: Mapped[str | None] = mapped_column(String(120), nullable=True)
    area_km2: Mapped[float] = mapped_column(Float, nullable=False)
    requested_resolution: Mapped[int | None] = mapped_column(nullable=True)
    created_at: Mapped[str] = mapped_column(String(64), nullable=False)
    scenario_type: Mapped[str] = mapped_column(String(16), nullable=False, default="DEMO")

    def to_dict(self) -> dict[str, Any]:
        return {
            "aoi_id": self.aoi_id,
            "name": self.name,
            "geometry": self.geometry,
            "centroid": self.centroid,
            "bounding_box": self.bounding_box,
            "country": self.country,
            "region": self.region,
            "city": self.city,
            "area_km2": self.area_km2,
            "requested_resolution": self.requested_resolution,
            "created_at": self.created_at,
            "scenario_type": self.scenario_type,
        }


class ScenarioRecord(Base):
    __tablename__ = "scenarios"

    scenario_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    params: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    result: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)

    def to_dict(self) -> dict[str, Any]:
        return {
            "scenario_id": self.scenario_id,
            "name": self.name,
            "params": self.params,
            "result": self.result,
        }
