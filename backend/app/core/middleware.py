"""HTTP middleware for request correlation and access logging."""

from __future__ import annotations

import logging
import time
import uuid

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.core.logging import client_ip, get_logger, set_request_id

logger = get_logger("app.access")

# High-churn paths we still correlate (request id) but don't spam access logs for.
_QUIET_PATHS = {"/api/v1/health", "/health", "/docs", "/openapi.json", "/redoc"}


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Assigns X-Request-ID and emits one access log line per request.

    Extend later by reading principal from a context var set in deps, or by
    shipping these lines to a log drain — the shape stays the same.
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        incoming = request.headers.get("x-request-id")
        request_id = incoming.strip() if incoming else str(uuid.uuid4())
        set_request_id(request_id)
        request.state.request_id = request_id

        started = time.perf_counter()
        status_code = 500
        response: Response | None = None
        try:
            response = await call_next(request)
            status_code = response.status_code
            return response
        finally:
            duration_ms = round((time.perf_counter() - started) * 1000, 1)
            path = request.url.path
            if path not in _QUIET_PATHS:
                if status_code >= 500:
                    level = logging.ERROR
                elif status_code >= 400:
                    level = logging.WARNING
                else:
                    level = logging.INFO
                logger.log(
                    level,
                    "request_completed",
                    extra={
                        "event": "http.request",
                        "method": request.method,
                        "path": path,
                        "status_code": status_code,
                        "duration_ms": duration_ms,
                        "client_ip": client_ip(request),
                    },
                )
            if response is not None:
                response.headers["X-Request-ID"] = request_id
