# Architecture

## System overview

```mermaid
flowchart TD
    U[User] --> FE[React Frontend<br/>Vite + TS + MapLibre + R3F]
    FE -->|/api/v1| API[FastAPI]
    API --> GEO[Geospatial Services]
    API --> ML[ML Inference]
    API --> OPT[NSGA-II Optimizer]
    API --> RAG[Climate RAG]
    API --> HIST[History Service]
    API --> SAT[Satellite Catalog]
    API --> JOBS[Job Runner]
    GEO --> DB[(PostgreSQL + PostGIS + pgvector)]
    ML --> REG[Model Registry<br/>models/registry.json]
    GEO -.->|adapter| GEE[Google Earth Engine]
    DB --> REDIS[(Redis cache / queues)]
    GEO --> S3[(Object storage: COGs)]
```

## Layered structure

| Layer | Responsibility | Key modules |
| --- | --- | --- |
| API | Envelope-wrapped REST, validation, rate limiting | `app/api/routes/*` |
| Services | Domain logic, no HTTP concerns | `app/services/*` |
| ML | Training, registry, guarded inference | `app/ml/`, `app/services/ml/` |
| Core | Config, logging, envelope, security | `app/core/*` |

## Request flow (analysis)

```mermaid
sequenceDiagram
    participant FE as Frontend
    participant API as FastAPI
    participant J as Job runner
    participant DS as DataSourceResolver
    participant M as Model registry

    FE->>API: POST /api/v1/aoi (bbox/polygon/radius)
    API-->>FE: AOI record
    FE->>API: POST /api/v1/analysis/{aoi_id}/run
    API->>J: enqueue (RQ or in-process)
    J->>DS: resolve variable/date/cloud
    DS-->>J: selected source + provenance
    J->>M: guarded inference (validity check)
    J-->>API: staged result (real stage tracking)
    FE->>API: GET /api/v1/analysis/job/{job_id}
```

## Adapter boundaries

- **Earth Engine** (`earth_engine_service.py`) — real `ee` calls; raises `EarthEngineUnavailableError` without credentials. Callers fall back to the demo dataset **with DEMO flags**, never silently.
- **Geocoding** (frontend `services/geocoding/`) — Nominatim default, MapTiler behind the same provider interface.
- **Vector retrieval** (`services/rag/embeddings.py`) — pgvector/Qdrant gated; BM25 leg always honest about which legs ran.
- **LLM generation** — optional; the deterministic citation-locked composer is the default.

## Scientific separation

OBSERVATION ≠ MODEL ≠ SIMULATION ≠ GENERATIVE AI is enforced structurally:
`ObservationProvenance` travels with every raster/prediction; outputs carry
`scenario_type: DEMO | REAL`; the frontend renders distinct badges.
