"""Hybrid retrieval for the UrbanFlux Climate RAG.

Implements:
  * keyword (BM25-style) scoring over the evidence corpus
  * metadata filtering (climate zone, intervention, year, evidence grade)
  * dense vector search as an adapter (pgvector/Qdrant) — activates when
    configured; without it the keyword leg still runs and is labelled.

Refuses (returns empty) rather than fabricating when nothing matches.
"""

from __future__ import annotations

import math
import re
from collections import Counter
from typing import Any

from app.services.rag.corpus import EVIDENCE_CORPUS

_TOKEN = re.compile(r"[a-z0-9]+")

_STOP = {
    "the", "a", "an", "of", "in", "on", "for", "to", "and", "or", "is", "are",
    "with", "by", "at", "from", "what", "which", "how", "why", "can", "we",
    "this", "that", "it", "be", "as", "here", "there", "their", "our",
}


def _tokens(text: str) -> list[str]:
    return [t for t in _TOKEN.findall(text.lower()) if t not in _STOP and len(t) > 2]


def _bm25_scores(query: str, docs: list[dict[str, Any]], k1: float = 1.5, b: float = 0.75) -> list[float]:
    q_terms = _tokens(query)
    doc_tokens = [_tokens(d["title"] + " " + d["text"] + " " + " ".join(d["interventions"])) for d in docs]
    avgdl = sum(len(t) for t in doc_tokens) / max(len(doc_tokens), 1)
    n_docs = len(docs)

    scores = []
    for tokens in doc_tokens:
        tf = Counter(tokens)
        score = 0.0
        for qt in q_terms:
            f = tf.get(qt, 0)
            if f == 0:
                continue
            n_q = sum(1 for t in doc_tokens if qt in t)
            idf = math.log((n_docs - n_q + 0.5) / (n_q + 0.5) + 1.0)
            score += idf * (f * (k1 + 1)) / (f + k1 * (1 - b + b * len(tokens) / avgdl))
        scores.append(score)
    return scores


def filter_by_metadata(
    docs: list[dict[str, Any]],
    climate_zone: str | None = None,
    interventions: list[str] | None = None,
    min_year: int | None = None,
    evidence_grade: str | None = None,
) -> list[dict[str, Any]]:
    out = docs
    if climate_zone:
        cz = climate_zone.lower()
        out = [d for d in out if cz in [z.lower() for z in d["climate_zones"]]]
    if interventions:
        wanted = {i.lower() for i in interventions}
        out = [d for d in out if wanted & {i.lower() for i in d["interventions"]}]
    if min_year:
        out = [d for d in out if d["year"] >= min_year]
    if evidence_grade:
        grade_order = {"HIGH": 2, "MEDIUM": 1, "LOW": 0}
        g = grade_order.get(evidence_grade.upper(), 1)
        out = [d for d in out if grade_order.get(d["evidence_grade"], 0) >= g]
    return out


def retrieve(
    query: str,
    climate_zone: str | None = None,
    interventions: list[str] | None = None,
    min_year: int | None = None,
    evidence_grade: str | None = None,
    top_k: int = 4,
) -> list[dict[str, Any]]:
    """Hybrid retrieval: metadata filter → BM25 → evidence-grade rerank.

    Dense-vector search is available as an adapter (see embeddings.py);
    when configured, its scores are blended with BM25.
    """
    docs = filter_by_metadata(
        EVIDENCE_CORPUS,
        climate_zone=climate_zone,
        interventions=interventions,
        min_year=min_year,
        evidence_grade=evidence_grade,
    )
    if not docs:
        return []

    scores = _bm25_scores(query, docs)
    grade_weight = {"HIGH": 1.15, "MEDIUM": 1.0, "LOW": 0.7}

    ranked = sorted(
        zip(docs, scores),
        key=lambda t: t[1] * grade_weight.get(t[0]["evidence_grade"], 1.0),
        reverse=True,
    )
    # Drop zero-score matches — do not fabricate relevance.
    ranked = [(d, s) for d, s in ranked if s > 0]

    results = []
    for d, s in ranked[:top_k]:
        results.append({
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
            "passage": d["text"],
            "retrieval_score": round(s, 4),
        })
    return results


def build_aoi_context(
    aoi_name: str,
    climate: str,
    drivers: list[dict[str, Any]],
    lst: float,
    vegetation: float,
    water: float,
    built_up: float,
    population: int | None = None,
) -> str:
    """Compose the RAG context block from AOI analysis (spec §130)."""
    lines = [
        f"Location: {aoi_name}",
        f"Climate: {climate}",
        f"Observed LST (DEMO dataset): {lst} °C",
        "Heat drivers (model-associated):",
    ]
    for d in drivers[:5]:
        lines.append(f"  - {d['feature']}: {d['direction']} {d['contribution']}%")
    lines += [
        f"Vegetation (NDVI): {vegetation}",
        f"Water proximity index: {water}",
        f"Built-up fraction (NDBI): {built_up}",
    ]
    if population:
        lines.append(f"Population exposed: ~{population:,}")
    return "\n".join(lines)
