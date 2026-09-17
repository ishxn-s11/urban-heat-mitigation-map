// ── Core domain types ─────────────────────────────────────────────────────
//
// Types with a backend OpenAPI annotation are ALIASES of the generated
// schema (`api.d.ts`, see `api-aliases.ts`) — the backend is the source of
// truth and payload shapes cannot drift. Types for not-yet-annotated
// endpoints remain hand-written below and migrate to aliases as their
// routes gain response models.

export type {
  ApiEnvelope,
  ApiCity,
  ApiAOI,
  ApiHeatSummary,
  ApiScenarioSummary,
  ApiScenarioResult,
  ApiScenarioResponseData,
  ApiScenarioRecord,
  ApiOptimizationRunData,
  ApiOptimizationRecommendation,
  ApiParetoSolution,
  ApiHotspot,
} from "./api-aliases";

import type {
  ApiEnvelope,
  ApiCity,
  ApiAOI,
  ApiHeatSummary,
  ApiScenarioSummary,
  ApiScenarioResult,
  ApiScenarioResponseData,
  ApiScenarioRecord,
  ApiOptimizationRunData,
  ApiParetoSolution,
  ApiHotspot,
} from "./api-aliases";

export type ApiResponse<T> = ApiEnvelope<T>;
export type City = ApiCity;
export type HeatSummary = ApiHeatSummary;
export type ScenarioSummary = ApiScenarioSummary;
export type ScenarioResult = Omit<ApiScenarioResult, "params" | "provenance"> & {
  params: Record<string, number | string>;
  provenance: Record<string, unknown>;
};
export type ScenarioResponse = ApiScenarioResponseData;
export type ScenarioRecord = ApiScenarioRecord;
export type OptimizationResponse = ApiOptimizationRunData;
export type ParetoSolution = ApiParetoSolution;

export type Hotspot = Omit<ApiHotspot, "drivers" | "intensity"> & {
  drivers: DriverFactor[];
  intensity: "COOL" | "MODERATE" | "HOT" | "EXTREME";
};

export type AreaOfInterest = Omit<ApiAOI, "geometry" | "name" | "country" | "region" | "city"> & {
  geometry: GeoJSON.Geometry;
  name?: string;
  country?: string;
  region?: string;
  city?: string;
};

// ── Hand-written until their routes gain OpenAPI annotations ─────────────

/** ObservationProvenance — spec §183 */
export interface ObservationProvenance {
  mission?: string;
  platform?: string;
  satellite?: string;
  instrument?: string;
  sensor?: string;
  dataset?: string;
  product?: string;
  processingLevel?: string;
  processing_level?: string;
  acquisitionTime?: string;
  acquisition_time?: string;
  nativeResolutionMeters?: number;
  native_resolution_meters?: number;
  sceneId?: string;
  scene_id?: string;
  cloudCover?: number;
  cloud_cover?: number;
  provider?: string;
  qualityFlags?: string[];
  quality_flags?: string[];
  [k: string]: unknown;
}

export interface DriverFactor {
  feature: string;
  contribution: number;
  direction: "warming" | "cooling";
}

export interface Recommendation {
  interventions: string[];
  mean_cooling_deg_c: number;
  cost_usd: number;
  population_benefited: number;
  feasibility: number;
  solution_id: string;
  scenario_type: string;
  /** Present when the recommendation is a Pareto knee-point solution. */
  total_cooling_deg_c?: number;
  extreme_cells_recovered?: number;
  intervention_mix?: Record<string, number>;
}

/** HeatMitigationRecommendation — spec §186 */
export interface RagRecommendation {
  intervention: string;
  why_it_fits: string;
  expected_mechanism: string;
  implementation_considerations: string[];
  limitations: string[];
  evidence_confidence: "HIGH" | "MEDIUM" | "LOW";
  citations: RagCitation[];
}

export interface RagCitation {
  ref: string;
  doc_id: string;
  title: string;
  authors: string[];
  publication: string;
  year: number;
  doi?: string;
  url?: string;
  evidence_grade: "HIGH" | "MEDIUM" | "LOW";
  passage: string;
}

export interface RagResult {
  status: "OK" | "INSUFFICIENT_EVIDENCE";
  message?: string;
  query_context: string;
  recommendations: RagRecommendation[];
  citations: RagCitation[];
  llm_used?: boolean;
  retrieval_legs?: Record<string, unknown>;
  scenario_type: "DEMO" | "REAL";
}

export interface MissionEra {
  label: string;
  start_year: number;
  end_year: number | null;
  satellite: string;
  sensor: string;
  dataset: string;
  resolution: string;
  note: string;
}

export interface TimelinePoint {
  year: number;
  anomaly: number;
  mean_summer_lst: number;
  satellite: string;
  sensor: string;
  scenario_type: "DEMO" | "REAL";
}

export interface ModelEntry {
  model_id: string;
  model_name: string;
  version: string;
  training_date: string;
  training_regions: string[];
  features: string[];
  metrics: Record<string, unknown>;
  artifact_sha256: string;
  physics_check: { ndvi_monotone: boolean; ndvi_effect_degC: number };
  validation_method: string;
  training_domains: { climates: string[]; latitude_range: [number, number] };
}

export interface GeocodeResult {
  name: string;
  short_name?: string;
  country?: string;
  lat: number;
  lon: number;
  type?: string;
  source: string;
}
