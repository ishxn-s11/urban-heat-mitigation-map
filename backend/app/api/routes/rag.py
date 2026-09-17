"""UrbanFlux Climate RAG routes."""

from __future__ import annotations

import uuid
from typing import Any

from fastapi import APIRouter

from app.core.envelope import envelope
from app.schemas import RagQuery
from app.services.rag import corpus, embeddings, generation
from app.services.scenario.engine import moisture_factor

router = APIRouter()

_RECS: dict[str, dict[str, Any]] = {}


@router.post("/rag/query")
def rag_query(payload: RagQuery) -> dict[str, Any]:
    drivers = [
        {"feature": "Low Vegetation", "contribution": 24.0, "direction": "warming"},
        {"feature": "Built-up Density", "contribution": 31.0, "direction": "warming"},
        {"feature": "Low Surface Albedo", "contribution": 13.0, "direction": "warming"},
    ]
    result = generation.generate_recommendations(
        question=payload.question,
        climate=payload.climate,
        drivers=drivers,
        aoi_name=payload.aoi_id or "selected AOI",
        lst=42.8,
        vegetation=0.35,
        water=0.05,
        built_up=0.42,
        population=1_900_000,
        candidate_interventions=payload.candidate_interventions,
    )
    result["retrieval_legs"] = embeddings.which_legs_active()
    result["query_id"] = f"q_{uuid.uuid4().hex[:8]}"
    return envelope(result)


@router.get("/rag/sources")
def rag_sources() -> dict[str, Any]:
    return envelope(
        [
            {
                "doc_id": d["doc_id"],
                "title": d["title"],
                "authors": d["authors"],
                "publication": d["publication"],
                "year": d["year"],
                "doi": d.get("doi"),
                "url": d.get("url"),
                "evidence_grade": d["evidence_grade"],
                "climate_zones": d["climate_zones"],
                "interventions": d["interventions"],
            }
            for d in corpus.EVIDENCE_CORPUS
        ],
        meta={"count": len(corpus.EVIDENCE_CORPUS)},
    )


@router.post("/rag/recommendations")
def rag_recommendations(payload: RagQuery) -> dict[str, Any]:
    result = rag_query(payload)
    rec_id = f"rec_{uuid.uuid4().hex[:8]}"
    result["data"]["recommendation_id"] = rec_id
    _RECS[rec_id] = result["data"]
    return result


@router.get("/rag/recommendations/{rec_id}")
def get_recommendation(rec_id: str) -> dict[str, Any]:
    rec = _RECS.get(rec_id)
    if not rec:
        return envelope({"status": "NOT_FOUND"}, meta={"recommendation_id": rec_id})
    return envelope(rec)
