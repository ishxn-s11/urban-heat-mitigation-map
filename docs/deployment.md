# Deployment

## Local development

```bash
# backend
cd backend && python -m venv .venv
.venv/bin/pip install -r requirements.txt        # Windows: .venv\Scripts\python -m pip
.venv/bin/uvicorn app.main:app --reload

# frontend
cd frontend && npm install && npm run dev
```

API at http://localhost:8000 · docs at /docs · frontend at http://localhost:5173.

## Docker

```bash
cp .env.example .env
docker compose up --build
```

Services: `postgres` (postgis/postgis:16-3.4), `redis` (7), `backend`
(FastAPI/uvicorn, non-root), `worker` (rqworker on the `urbanflux` queue),
`frontend` (nginx SPA with history fallback). Healthchecks gate startup
order.

## Environment

See `.env.example`. Critical flags:

- `DEMO_MODE=true` — serve the labelled demo dataset (no GEE needed).
- `DATA_MODE=test|cached|live` — production must be `live` or scientifically
  valid `cached`.
- `GEE_PROJECT_ID` + `GOOGLE_APPLICATION_CREDENTIALS` — activate Earth Engine
  ingestion. Credentials are never committed and never reach the frontend.
- `VITE_API_URL`, `VITE_DEMO_MODE` — baked into the frontend build.
- `OPENAI_API_KEY` — optional; the RAG works without it (deterministic,
  citation-locked composer).

## CI

`.github/workflows/ci.yml`:

1. **backend** — ruff, black --check, pytest
2. **frontend** — eslint, vitest, `tsc -b && vite build`
3. **docker** — build backend + frontend images

No auto-deploy; no secrets consumed in CI.

## Production notes

- Serve the frontend as static files behind a CDN; the API behind TLS with
  rate limiting (slowapi) and CORS pinned to real origins.
- Postgres: enable PostGIS + pgvector extensions; run migrations before
  serving traffic.
- Model artifacts: mount `models/` read-only; the registry refuses to serve
  predictions when artifacts are missing (no silent fallback).
- Cache analysis results keyed on `hash(AOI, date, dataset_version,
  feature_version, model_version)`; heavy jobs run on the RQ worker.
- Observability: structured JSON logs with request IDs and timing
  (`x-request-id` response header), `/health` and `/ready` for probes.
