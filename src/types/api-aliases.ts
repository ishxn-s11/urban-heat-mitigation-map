// ── Backend-generated types (source of truth: backend/app/schemas.py) ────
//
// `api.d.ts` is GENERATED from the FastAPI OpenAPI schema — never edit it
// by hand. Regenerate with:
//
//   cd backend && python -c "import json; from app.main import app; \
//     json.dump(app.openapi(), open('../frontend/openapi.json','w'), indent=2)"
//   cd ../frontend && npm run openapi
//
// These aliases adapt the generated types for the service layer. The
// hand-written domain types in `index.ts` re-export from here, so payload
// shapes can no longer drift from the backend contract.

import type { components } from "./api";

type S = components["schemas"];

/**
 * Drop the open `[key: string]: unknown` index signature that
 * `extra="allow"` produces, keeping only declared properties. Without
 * this, keyof T collapses to `string | number` and Omit/Pick degrade the
 * whole type to a bare index signature.
 */
type StripIndex<T> = { [K in keyof T as string extends K ? never : K]: T[K] };

type Clean<T> = StripIndex<T>;

// OpenAPI dict schemas degrade free-form objects to Record<string, never>;
// these widenings restore the real runtime shape without weakening checks.
type FreeDict = Record<string, unknown>;

export type ApiCity = Clean<S["City"]>;
export type ApiAOI = Omit<Clean<S["AOI"]>, "geometry"> & { geometry: FreeDict };
export type ApiHeatSummary = Clean<S["HeatSummary"]>;
export type ApiScenarioSummary = Clean<S["ScenarioSummary"]>;
export type ApiScenarioResult = Omit<Clean<S["ScenarioResult"]>, "provenance" | "params"> & {
  provenance: FreeDict;
  params: FreeDict;
};
export type ApiScenarioResponseData = Omit<Clean<S["ScenarioResponseData"]>, "provenance"> & {
  provenance: FreeDict;
};
export type ApiScenarioRecord = Omit<Clean<S["ScenarioRecord"]>, "params" | "result"> & {
  params: FreeDict;
  result: ApiScenarioResult;
};
export type ApiOptimizationRunData = Omit<Clean<S["OptimizationRunData"]>, "recommendation"> & {
  recommendation: Clean<S["OptimizationRecommendation"]>;
};
export type ApiOptimizationRecommendation = Clean<S["OptimizationRecommendation"]>;

export type ApiHotspot = Omit<Clean<S["Hotspot"]>, "drivers" | "cell"> & {
  drivers?: FreeDict[];
  cell: Clean<S["HotspotCell"]>;
};

export type ApiParetoSolution = FreeDict & {
  solution_id: string;
  total_cooling_deg_c: number;
  mean_cooling_deg_c: number;
  cost_usd: number;
  population_benefited: number;
  extreme_cells_recovered: number;
  feasibility: number;
  difficulty: number;
  canopy_total_fraction: number;
  roof_total_fraction: number;
  intervention_mix: Record<string, number>;
};

// Generic response envelope, mirroring backend Envelope[T].
export interface ApiEnvelope<T> {
  success: boolean;
  data: T | null;
  meta: FreeDict;
  error: { code: string; message: string } | null;
}

export type ApiCitiesEnvelope = ApiEnvelope<ApiCity[]>;
export type ApiHeatSummaryEnvelope = ApiEnvelope<ApiHeatSummary>;
export type ApiHotspotsEnvelope = ApiEnvelope<ApiHotspot[]>;
export type ApiScenarioResponseEnvelope = ApiEnvelope<ApiScenarioResponseData>;
export type ApiOptimizationRunEnvelope = ApiEnvelope<ApiOptimizationRunData>;
