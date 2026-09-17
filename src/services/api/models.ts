import { request, DEMO_MODE } from "./client";
import { DEMO_MODELS } from "./demo/mockBackend";
import type { ModelEntry } from "@/types";

export async function getModels(): Promise<ModelEntry[]> {
  if (DEMO_MODE) return DEMO_MODELS;
  return request<ModelEntry[]>("/api/v1/models");
}
