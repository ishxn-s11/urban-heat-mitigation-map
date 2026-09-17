"""UrbanFlux FastAPI application entry point."""

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.core.config import get_settings
from app.core.envelope import error_body, register_exception_handlers
from app.core.logging import RequestTimingMiddleware, configure_logging
from app.api.routes import (
    cities,
    global_explorer,
    health,
    heat,
    history,
    hotspots,
    models,
    optimization,
    rag,
    scenarios,
    satellites,
)

configure_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    app.state.settings = settings
    # Persisted state (AOIs, scenarios) — creates schema when missing.
    from app.db.session import init_db

    init_db()
    yield


settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version=settings.version,
    description=(
        "UrbanFlux — Urban Heat Intelligence Platform. "
        "All demo-mode outputs are flagged `scenario_type: DEMO`."
    ),
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(RequestTimingMiddleware)

limiter = Limiter(key_func=get_remote_address, default_limits=[settings.api_rate_limit])
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

register_exception_handlers(app)

API = "/api/v1"
app.include_router(health.router, tags=["health"])
app.include_router(cities.router, prefix=API, tags=["cities & AOI"])
app.include_router(heat.router, prefix=API, tags=["heat"])
app.include_router(hotspots.router, prefix=API, tags=["hotspots"])
app.include_router(models.router, prefix=API, tags=["models"])
app.include_router(scenarios.router, prefix=API, tags=["scenarios"])
app.include_router(optimization.router, prefix=API, tags=["optimization"])
app.include_router(rag.router, prefix=API, tags=["rag"])
app.include_router(history.router, prefix=API, tags=["history"])
app.include_router(satellites.router, prefix=API, tags=["satellites"])
app.include_router(global_explorer.router, prefix=API, tags=["explorer"])


@app.get("/")
def root() -> dict:
    return {
        "name": "UrbanFlux API",
        "version": settings.version,
        "docs": "/docs",
        "api": API,
        "demo_mode": settings.demo_mode,
    }


@app.exception_handler(404)
async def not_found(request: Request, exc) -> JSONResponse:  # noqa: ANN001
    return JSONResponse(
        status_code=404,
        content=error_body("NOT_FOUND", f"Route '{request.url.path}' does not exist in the UrbanFlux route map."),
    )
