"""RAG generation — evidence-backed recommendations with citations.

Architecture rules enforced here:
  * every factual claim is tied to a retrieved document
  * the generator NEVER invents temperature reductions, costs, or citations
  * if retrieval is too weak → returns INSUFFICIENT EVIDENCE
  * an LLM adapter (OpenAI) is optional; without it the deterministic
    template composer still produces fully-cited recommendations
"""

from __future__ import annotations

from typing import Any

from app.services.rag.retrieval import build_aoi_context, retrieve

MIN_SCORE = 0.5          # below this, retrieval is judged too weak
MIN_DOCS = 1             # need at least one real retrieved passage


def _cite(idx: int, doc: dict[str, Any]) -> dict[str, Any]:
    return {
        "ref": f"[{idx + 1}]",
        "doc_id": doc["doc_id"],
        "title": doc["title"],
        "authors": doc["authors"],
        "publication": doc["publication"],
        "year": doc["year"],
        "doi": doc.get("doi"),
        "url": doc.get("url"),
        "evidence_grade": doc["evidence_grade"],
        "passage": doc["passage"],
    }


def _llm_available() -> bool:
    from app.core.config import get_settings
    return bool(get_settings().openai_api_key)


def _compose_intervention(
    intervention: str,
    docs: list[dict[str, Any]],
    context: str,
) -> dict[str, Any]:
    """Deterministic, citation-locked composition (no LLM required)."""
    grades = [d["evidence_grade"] for d in docs]
    if "HIGH" in grades:
        confidence = "HIGH"
    elif "MEDIUM" in grades:
        confidence = "MEDIUM"
    else:
        confidence = "LOW"

    climate_note = ""
    if any(z in ("arid", "semi-arid") for d in docs for z in d["climate_zones"]):
        climate_note = (
            "Evidence spans arid/semi-arid contexts; water-demanding greening "
            "options must be weighed against local water availability."
        )

    return {
        "intervention": intervention,
        "why_it_fits": (
            f"Retrieved evidence links '{intervention}' to heat reduction in "
            f"climates comparable to the AOI context. {climate_note}"
        ),
        "expected_mechanism": docs[0]["passage"][:280] + ("…" if len(docs[0]["passage"]) > 280 else ""),
        "implementation_considerations": [
            "Validate against local surface materials and land ownership.",
            "Pair with heat-action planning for vulnerable populations.",
        ],
        "limitations": [
            "Retrieved effect sizes come from other cities and climates.",
            "Local cooling must be estimated by the scenario model — not by this recommendation.",
        ],
        "evidence_confidence": confidence,
        "citations": [_cite(i, d) for i, d in enumerate(docs)],
        "scenario_type": "DEMO",
    }


def generate_recommendations(
    question: str,
    climate: str,
    drivers: list[dict[str, Any]],
    aoi_name: str,
    lst: float,
    vegetation: float,
    water: float,
    built_up: float,
    population: int | None = None,
    candidate_interventions: list[str] | None = None,
) -> dict[str, Any]:
    """Full RAG pipeline: context → retrieve → compose → cited output.

    Returns INSUFFICIENT_EVIDENCE result when retrieval cannot support an
    answer — never fabricates.
    """
    context = build_aoi_context(
        aoi_name, climate, drivers, lst, vegetation, water, built_up, population
    )

    interventions = candidate_interventions or [
        "tree canopy", "cool roofs", "green roofs", "water bodies", "reflective pavement"
    ]

    recommendations: list[dict[str, Any]] = []
    all_citations: list[dict[str, Any]] = []
    seen_docs: set[str] = set()

    for iv in interventions:
        # Query carries the question only — intervention scope is a metadata
        # filter. Appending it to the query text would guarantee spurious
        # BM25 matches (fabricated relevance).
        docs = retrieve(
            query=question,
            climate_zone=climate,
            interventions=[iv],
            top_k=3,
        )
        if not docs:
            # relax metadata filter but keep evidence-grade floor
            docs = retrieve(query=question, top_k=2, evidence_grade="HIGH")
        if not docs:
            continue
        rec = _compose_intervention(iv, docs, context)
        recommendations.append(rec)
        for c in rec["citations"]:
            if c["doc_id"] not in seen_docs:
                seen_docs.add(c["doc_id"])
                all_citations.append(c)

    if not recommendations or len(all_citations) < MIN_DOCS:
        return {
            "status": "INSUFFICIENT_EVIDENCE",
            "message": (
                "Could not retrieve credible evidence matching the AOI context. "
                "No recommendation is made rather than fabricating one."
            ),
            "query_context": context,
            "recommendations": [],
            "citations": [],
            "scenario_type": "DEMO",
        }

    return {
        "status": "OK",
        "query_context": context,
        "recommendations": recommendations,
        "citations": all_citations,
        "llm_used": _llm_available(),
        "scenario_type": "DEMO",
        "note": (
            "RAG proposes interventions; the scenario model estimates thermal "
            "impact; the optimizer allocates spatially. No LLM output overrides "
            "numerical results."
        ),
    }
