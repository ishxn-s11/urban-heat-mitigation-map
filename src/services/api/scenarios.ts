import { post, request, DEMO_MODE } from "./client";
import { simulate, scenarioResponse } from "./demo/mockBackend";
import type { ScenarioResponse, ScenarioResult } from "@/types";

export interface ScenarioInput {
  tree_canopy_percent?: number;
  cool_roof_percent?: number;
  green_roof_percent?: number;
  albedo_delta?: number;
  water_area_delta?: number;
  climate?: string;
}

export async function runScenario(input: ScenarioInput): Promise<{ response: ScenarioResponse; result: ScenarioResult }> {
  if (DEMO_MODE) {
    const result = simulate(input);
    return { response: scenarioResponse(result), result };
  }
  const response = await post<ScenarioResponse & { result?: ScenarioResult }>("/api/v1/scenarios", input);
  return { response, result: response.result ?? (null as unknown as ScenarioResult) };
}

export async function getScenario(scenarioId: string): Promise<ScenarioResponse> {
  if (DEMO_MODE) throw new Error("Scenario history is not persisted in demo mode");
  return request<ScenarioResponse>(`/api/v1/scenarios/${scenarioId}`);
}
