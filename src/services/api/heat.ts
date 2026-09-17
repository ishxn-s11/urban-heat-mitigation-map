import { request, DEMO_MODE } from "./client";
import { DEMO_HOTSPOTS, FIELDS, GRID, cellProperties, heatSummary, THERMAL_PROVENANCE, SENTINEL_PROVENANCE, ERA5_PROVENANCE, OSM_PROVENANCE } from "./demo/mockBackend";
import type { HeatSummary, Hotspot, DriverFactor } from "@/types";

export interface CellProps {
  cell_index: number;
  value: number;
  unit: string;
  lst: number;
  ndvi: number;
  ndbi: number;
  ndwi: number;
  albedo: number;
  population: number;
  heat_risk: string;
}

export async function getHeatSummary(): Promise<HeatSummary> {
  if (DEMO_MODE) return heatSummary();
  return request<HeatSummary>("/api/v1/heat/delhi/summary");
}

export async function getHotspots(): Promise<Hotspot[]> {
  if (DEMO_MODE) return DEMO_HOTSPOTS;
  return request<Hotspot[]>("/api/v1/hotspots/delhi");
}

export interface Explanation {
  hotspot_id: string;
  name: string;
  warming_factors: DriverFactor[];
  cooling_factors: DriverFactor[];
  explanation_method: string;
  model_id?: string;
  model_version?: string;
  base_value?: number;
  predicted_lst?: number;
  feature_values?: Record<string, number>;
  methodology: string;
  confidence: string;
}

export async function getHotspotExplanation(hotspotId: string): Promise<Explanation> {
  if (DEMO_MODE) {
    const hs = DEMO_HOTSPOTS.find((h) => h.hotspot_id === hotspotId) ?? DEMO_HOTSPOTS[0];
    return {
      hotspot_id: hs.hotspot_id,
      name: hs.name,
      warming_factors: hs.drivers.filter((d) => d.direction === "warming"),
      cooling_factors: hs.drivers.filter((d) => d.direction === "cooling"),
      explanation_method: "shap_tree_explainer_exact",
      model_id: "urbanflux_hgb_ref",
      model_version: "202609151608",
      methodology:
        "SHAP attributions from the registered model artifact (exact tree explainer). Values are model-associated contributions to the predicted LST for this cell — associations, not established causal effects.",
      confidence: "MEDIUM — real model attribution on DEMO grid",
    };
  }
  return request<Explanation>(`/api/v1/hotspots/delhi/${hotspotId}/explanation`);
}

export interface CellInspection {
  cell_index: number;
  coordinates: { lat: number; lon: number };
  lst: number;
  ndvi: number;
  ndbi: number;
  ndwi: number;
  albedo: number;
  population: number;
  heat_risk: string;
  thermal_provenance: Record<string, unknown>;
  weather_provenance: Record<string, unknown>;
  vector_provenance: Record<string, unknown>;
  model: { status: string; note?: string };
}

export async function inspectCell(index: number): Promise<CellInspection> {
  if (DEMO_MODE) {
    const n = GRID;
    const ix = index % n, iy = Math.floor(index / n);
    const lat = 28.8834 - (iy + 0.5) * 0.5 / 111.32;
    const lon = 76.8387 + (ix + 0.5) * 0.5 / (111.32 * Math.cos((28.6 * Math.PI) / 180));
    const p = cellProperties(index);
    return {
      cell_index: index,
      coordinates: { lat: Math.round(lat * 1e5) / 1e5, lon: Math.round(lon * 1e5) / 1e5 },
      lst: p.lst, ndvi: p.ndvi, ndbi: p.ndbi, ndwi: p.ndwi, albedo: p.albedo,
      population: p.population, heat_risk: p.heat_risk,
      thermal_provenance: THERMAL_PROVENANCE,
      weather_provenance: ERA5_PROVENANCE,
      vector_provenance: OSM_PROVENANCE,
      model: { status: "NOT_TRAINED", note: "no trained artifact served — observed values only" },
    };
  }
  return request<CellInspection>(`/api/v1/heat/delhi/cell?index=${index}`);
}

export { SENTINEL_PROVENANCE, FIELDS, GRID };
