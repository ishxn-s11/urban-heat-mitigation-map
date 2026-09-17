"""Pydantic request/response schemas.

Response models use extra="allow": declared fields are documented in the
OpenAPI schema (and therefore typed in the generated TS client), while any
undeclared field still passes through untouched — annotations can never
silently strip payload data.
"""

from __future__ import annotations

from typing import Any, Generic, Literal, TypeVar

from pydantic import BaseModel, ConfigDict, Field

T = TypeVar("T")


class ErrorBody(BaseModel):
    model_config = ConfigDict(extra="allow")

    code: str
    message: str


class Envelope(BaseModel, Generic[T]):
    """The standard UrbanFlux response wrapper."""

    model_config = ConfigDict(extra="allow")

    success: bool = True
    data: T | None = None
    meta: dict[str, Any] = Field(default_factory=dict)
    error: ErrorBody | None = None


class City(BaseModel):
    model_config = ConfigDict(extra="allow")

    city_id: str
    name: str
    country: str
    latitude: float
    longitude: float
    bounding_box: list[float]
    timezone: str
    default_zoom: int
    available_datasets: list[str]


class AOI(BaseModel):
    model_config = ConfigDict(extra="allow")

    aoi_id: str
    name: str | None = None
    geometry: dict[str, Any]
    centroid: list[float]
    bounding_box: list[float]
    country: str | None = None
    region: str | None = None
    city: str | None = None
    area_km2: float
    requested_resolution: int | None = None
    created_at: str
    scenario_type: str = "DEMO"


class HeatSummary(BaseModel):
    model_config = ConfigDict(extra="allow")

    mean_lst: float
    min_lst: float
    max_lst: float
    p95_lst: float
    hot_cells: int
    extreme_cells: int
    mean_ndvi: float
    mean_ndbi: float
    population_total: int
    hotspot_count: int
    acquisition_time: str
    scenario_type: str = "DEMO"


class HotspotCell(BaseModel):
    model_config = ConfigDict(extra="allow")

    cell_index: int
    x: int
    y: int
    lat: float
    lon: float
    lst: float


class Hotspot(BaseModel):
    model_config = ConfigDict(extra="allow")

    hotspot_id: str
    name: str
    intensity: str
    cell: HotspotCell
    mean_lst: float
    peak_lst: float
    population_exposed: int
    drivers: list[dict[str, Any]] = Field(default_factory=list)
    scenario_type: str = "DEMO"


class ScenarioSummary(BaseModel):
    model_config = ConfigDict(extra="allow")

    mean_delta_lst: float
    max_cooling: float
    mean_simulated_lst: float
    min_simulated_lst: float
    max_simulated_lst: float
    population_benefited: int
    population_pct: float
    hotspot_count_before: int
    hotspot_count_after: int
    estimated_cost_usd: float
    scenario_type: str = "DEMO"


class ScenarioResult(BaseModel):
    model_config = ConfigDict(extra="allow")

    scenario_type: str = "DEMO"
    simulated_lst: list[float]
    delta_lst: list[float]
    summary: ScenarioSummary
    provenance: dict[str, Any] = Field(default_factory=dict)
    climate: str = "semi-arid"
    params: dict[str, Any] = Field(default_factory=dict)


class ScenarioResponseData(BaseModel):
    model_config = ConfigDict(extra="allow")

    scenario_id: str
    summary: ScenarioSummary
    provenance: dict[str, Any] = Field(default_factory=dict)
    scenario_type: str = "DEMO"
    result: ScenarioResult | None = None


class ScenarioRecord(BaseModel):
    model_config = ConfigDict(extra="allow")

    scenario_id: str
    name: str | None = None
    params: dict[str, Any]
    result: ScenarioResult


class OptimizationRecommendation(BaseModel):
    model_config = ConfigDict(extra="allow")

    interventions: list[str]
    mean_cooling_deg_c: float
    cost_usd: float
    population_benefited: int
    feasibility: float
    solution_id: str
    scenario_type: str = "DEMO"


class OptimizationRunData(BaseModel):
    model_config = ConfigDict(extra="allow")

    run_id: str
    n_solutions: int
    algorithm: str
    recommendation: OptimizationRecommendation
    scenario_type: str = "DEMO"


class ScenarioParams(BaseModel):
    tree_canopy_percent: float = Field(default=0, ge=0, le=50)
    cool_roof_percent: float = Field(default=0, ge=0, le=100)
    green_roof_percent: float = Field(default=0, ge=0, le=100)
    albedo_delta: float = Field(default=0, ge=0, le=0.45)
    water_area_delta: float = Field(default=0, ge=0, le=10)
    climate: str = "semi-arid"


class ScenarioCreate(ScenarioParams):
    name: str | None = None
    aoi_id: str | None = None


class OptimizationRequest(BaseModel):
    budget_usd: float = Field(default=4_000_000, gt=0)
    climate: str = "semi-arid"
    pop_size: int = Field(default=80, ge=20, le=200)
    n_gen: int = Field(default=60, ge=10, le=200)
    seed: int = 42


class RagQuery(BaseModel):
    question: str = Field(min_length=5, max_length=500)
    aoi_id: str | None = None
    hotspot_id: str | None = None
    climate: str = "semi-arid"
    candidate_interventions: list[str] | None = None


class CompareRequest(BaseModel):
    date_a: str
    date_b: str
    mode: Literal["swipe", "opacity", "split", "difference"] = "swipe"


class HistoryFrameRequest(BaseModel):
    year: int
    month: int = 5
    day: int = 15
    variable: str = "lst"
    max_cloud: float = 20.0
