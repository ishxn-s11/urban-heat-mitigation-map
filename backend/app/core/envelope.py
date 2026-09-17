"""Response envelope, domain errors, and exception handlers."""

from __future__ import annotations

import logging
from typing import Any

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)


def envelope(
    data: Any = None,
    meta: dict[str, Any] | None = None,
    success: bool = True,
) -> dict[str, Any]:
    """The standard UrbanFlux response wrapper."""
    return {"success": success, "data": data, "meta": meta or {}, "error": None}


def error_body(code: str, message: str) -> dict[str, Any]:
    return {
        "success": False,
        "data": None,
        "meta": {},
        "error": {"code": code, "message": message},
    }


class DomainError(Exception):
    status_code = status.HTTP_400_BAD_REQUEST

    def __init__(self, code: str, message: str) -> None:
        self.code = code
        self.message = message
        super().__init__(message)


class NotFoundError(DomainError):
    status_code = status.HTTP_404_NOT_FOUND


class UnprocessableError(DomainError):
    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY


class DataUnavailableError(DomainError):
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE


class InsufficientDataError(DomainError):
    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(DomainError)
    async def _domain(_: Request, exc: DomainError) -> JSONResponse:
        return JSONResponse(status_code=exc.status_code, content=error_body(exc.code, exc.message))

    @app.exception_handler(RequestValidationError)
    async def _validation(_: Request, exc: RequestValidationError) -> JSONResponse:
        first = exc.errors()[0] if exc.errors() else {}
        loc = ".".join(str(p) for p in first.get("loc", []) if p != "body")
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content=error_body("VALIDATION_ERROR", f"{loc}: {first.get('msg', 'invalid request')}"),
        )

    @app.exception_handler(Exception)
    async def _unhandled(_: Request, exc: Exception) -> JSONResponse:
        logger.exception("unhandled error", exc_info=exc)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=error_body("INTERNAL_ERROR", "An unexpected error occurred. The incident has been logged."),
        )
