import { post, request, DEMO_MODE } from "./client";
import { optimize } from "./demo/mockBackend";
import type { OptimizationResponse, ParetoSolution, Recommendation } from "@/types";

export interface OptimizationResult extends OptimizationResponse {
  solutions: ParetoSolution[];
}

export async function runOptimization(budgetUsd = 4_000_000): Promise<OptimizationResult> {
  if (DEMO_MODE) return optimize(budgetUsd);
  const init = await post<OptimizationResponse>("/api/v1/optimization", { budget_usd: budgetUsd });
  const solutions = await request<ParetoSolution[]>(`/api/v1/optimization/${init.run_id}/solutions`);
  const run = await request<{ recommendation: Recommendation }>(`/api/v1/optimization/${init.run_id}`);
  return { ...init, solutions, recommendation: run.recommendation };
}
