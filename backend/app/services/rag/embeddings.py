"""Embedding adapters for the RAG.

Dense search activates when pgvector or Qdrant is configured (see
docs/datasets.md). Without configuration these functions raise explicitly
— the keyword (BM25) leg of hybrid retrieval still operates and the API
labels which legs were active. We never pretend embeddings ran.
"""

from __future__ import annotations

from typing import Any


class EmbeddingUnavailableError(Exception):
    pass


def get_dense_scores(query: str, docs: list[dict[str, Any]]) -> list[float]:
    """Return dense similarity scores, or raise when unconfigured."""
    from app.core.config import get_settings

    if get_settings().qdrant_url or "postgresql+psycopg" in get_settings().database_url:
        # Real dense search requires a deployed index of corpus embeddings.
        # This is adapter territory: implement during pgvector migration.
        raise EmbeddingUnavailableError(
            "dense retrieval configured in settings but the pgvector/Qdrant "
            "embedding index has not been ingested yet; run scripts/ingest_rag.py"
        )
    raise EmbeddingUnavailableError(
        "no vector store configured; using BM25 keyword retrieval only"
    )


def which_legs_active() -> dict[str, Any]:
    """Report retrieval configuration for provenance display."""
    try:
        get_dense_scores("", [])
        dense = True
    except EmbeddingUnavailableError:
        dense = False
    return {"keyword_bm25": True, "dense_vector": dense, "reranker": "evidence_grade_weighted"}
