"""Engine/session wiring for the persistence layer.

Defaults to a file-backed SQLite database so the platform works locally
with zero infrastructure; the same code serves Postgres when DATABASE_URL
points at it (as docker-compose already does).

The engine is lazy and self-swapping: if settings (DATABASE_URL) change
at runtime — e.g. between tests, or across worker reconfiguration — the
next session picks up the new target automatically.
"""

from __future__ import annotations

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings
from app.db.models import Base

_engine: Engine | None = None
_SessionLocal: sessionmaker | None = None


def _connect_args_for(url: str) -> dict:
    return {"check_same_thread": False} if url.startswith("sqlite") else {}


def get_engine() -> Engine:
    """Return the engine for the current settings, (re)creating if needed."""
    global _engine, _SessionLocal
    url = get_settings().database_url
    if _engine is None or _engine.url.render_as_string(hide_password=False) != url:
        _engine = create_engine(url, echo=False, future=True, connect_args=_connect_args_for(url))
        _SessionLocal = sessionmaker(bind=_engine, autoflush=False, expire_on_commit=False)
        Base.metadata.create_all(_engine)
    return _engine


def init_db() -> None:
    """Create tables if they do not exist (idempotent)."""
    Base.metadata.create_all(get_engine())


def get_session() -> Generator[Session, None, None]:
    """FastAPI dependency yielding a scoped session.

    Calls get_engine() first so the sessionmaker is always current even
    when lifespan has not run (e.g. bare TestClient usage in tests).
    """
    get_engine()
    assert _SessionLocal is not None
    db = _SessionLocal()
    try:
        yield db
    finally:
        db.close()
