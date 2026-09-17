import { post, request, DEMO_MODE } from "./client";
import { ragQuery } from "./demo/mockBackend";
import type { RagResult } from "@/types";

export async function queryRag(question: string, climate = "semi-arid"): Promise<RagResult> {
  if (DEMO_MODE) return ragQuery();
  return post<RagResult>("/api/v1/rag/query", { question, climate });
}

export async function getRagSources(): Promise<Array<{ doc_id: string; title: string; year: number; doi?: string; url?: string; evidence_grade: string }>> {
  if (DEMO_MODE) {
    // Demo mode surfaces the corpus via the backend module when live; here a
    // static list of the two most-cited records keeps the page functional.
    return [
      { doc_id: "e001", title: "Cooling cities with urban green spaces: a meta-analysis", year: 2010, doi: "10.1016/j.landurbplan.2010.01.004", evidence_grade: "HIGH" },
      { doc_id: "e002", title: "Cool roofs: peak urban air temperature and the efficacy of reflective surfaces", year: 2012, doi: "10.1016/j.buildenv.2011.07.022", evidence_grade: "HIGH" },
    ];
  }
  return request("/api/v1/rag/sources");
}
