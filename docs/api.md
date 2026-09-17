# API

Interactive docs: `/docs` (Swagger UI) · `/redoc` · OpenAPI JSON at `/openapi.json`.
All routes are versioned under `/api/v1/`.

## Envelope

Every response:

```json
{ "success": true, "data": {}, "meta": {}, "error": null }
```

Errors:

```json
{ "success": false, "data": null, "error": { "code": "INVALID_SCENARIO", "message": "…" } }
```

Error codes: `CITY_NOT_FOUND`, `AOI_NOT_FOUND`, `HOTSPOT_NOT_FOUND`,
`SCENARIO_NOT_FOUND`, `RUN_NOT_FOUND`, `JOB_NOT_FOUND`, `UNKNOWN_LAYER`,
`INVALID_AOI`, `INVALID_GEOMETRY`, `INVALID_SCENARIO`, `INVALID_RANGE`,
`METHOD_NOT_WIRED`, `DATA_UNAVAILABLE`, `OPTIMIZATION_FAILED`,
`MISSION_NOT_FOUND`, `VALIDATION_ERROR`, `NOT_FOUND`, `INTERNAL_ERROR`.

## Routes

### Cities & AOI
```http
GET  /api/v1/cities
GET  /api/v1/cities/{city_id}
POST /api/v1/aoi                 # geometry | bbox | center+radius_km
GET  /api/v1/aoi
GET  /api/v1/aoi/{aoi_id}
GET  /api/v1/geocode?q=
```

### Heat & hotspots
```http
GET  /api/v1/heat/{city_id}?layer=lst|heat-risk|ndvi|ndbi|ndwi|albedo|population
GET  /api/v1/heat/{city_id}/summary
GET  /api/v1/heat/{city_id}/cell?index=          # pixel inspector + provenance
GET  /api/v1/hotspots/{city_id}?method=adaptive_percentile
GET  /api/v1/hotspots/{city_id}/{hotspot_id}
GET  /api/v1/hotspots/{city_id}/{hotspot_id}/explanation
```

### Scenarios, optimization
```http
POST /api/v1/scenarios
GET  /api/v1/scenarios/{scenario_id}
POST /api/v1/scenarios/{scenario_id}/simulate
POST /api/v1/scenarios/compare?a_id=&b_id=
POST /api/v1/optimization                 # {budget_usd, climate, pop_size, n_gen, seed}
GET  /api/v1/optimization/{run_id}
GET  /api/v1/optimization/{run_id}/solutions
```

### Models
```http
GET  /api/v1/models
GET  /api/v1/models/{model_id}
GET  /api/v1/models/{model_id}/validity?climate=&latitude=
```

### RAG
```http
POST /api/v1/rag/query                    # {question, climate, candidate_interventions?}
GET  /api/v1/rag/sources
POST /api/v1/rag/recommendations
GET  /api/v1/rag/recommendations/{id}
```

### History & satellites
```http
GET  /api/v1/history/{aoi_id}/availability
GET  /api/v1/history/{aoi_id}/timeline?variable=&start=&end=
GET  /api/v1/history/{aoi_id}/frame?year=&month=&day=&variable=&max_cloud=
GET  /api/v1/history/{aoi_id}/timeseries?resolution=
POST /api/v1/history/{aoi_id}/compare     # {date_a, date_b, mode}
GET  /api/v1/satellites
GET  /api/v1/satellites/{mission}
```

### Explorer & jobs
```http
POST /api/v1/analysis/{aoi_id}/run        # staged pipeline job
GET  /api/v1/analysis/job/{job_id}        # QUEUED|RUNNING|COMPLETED|FAILED + real stages
GET  /api/v1/explorer/resolve?variable=&date=&max_cloud=
GET  /api/v1/explorer/auto-resolution?area_km2=
```

### Health
```http
GET /health
GET /ready
```

## Scientific-integrity contract

- Every analysis/scenario/optimization response carries
  `scenario_type: "DEMO" | "REAL"`.
- `GET /heat/{city_id}/cell` returns full observation provenance per cell
  (satellite, sensor, dataset, acquisition, native resolution, quality flags).
- Unwired hotspot methods return `METHOD_NOT_WIRED` rather than fabricated
  classifications; pre-1982 LST frames return `DATA_UNAVAILABLE`.
- Job progress is computed from genuinely completed stages — no fake percentages.
