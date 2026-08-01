"""Application logging foundation.

Designed to stay small now and grow later:
- stdlib `logging` only (no extra deps)
- JSON lines in production (easy for log drains / aggregators)
- human-readable text locally
- `request_id` attached via contextvars so any log in a request is correlated
- `log_event()` for structured business events services can call later

Does NOT write to Postgres — request/error logs go to stdout. Durable
who-did-what facts stay in `audit_log` / inventory movements / order rows.
"""

from __future__ import annotations

import json
import logging
import sys
from contextvars import ContextVar
from datetime import datetime, timezone
from typing import Any, Optional

from app.core.config import settings

# Per-request correlation id. Middleware sets it; formatters/read helpers use it.
request_id_ctx: ContextVar[str] = ContextVar("request_id", default="-")

_RESERVED_RECORD_ATTRS = {
    "name",
    "msg",
    "args",
    "created",
    "filename",
    "funcName",
    "levelname",
    "levelno",
    "lineno",
    "module",
    "msecs",
    "message",
    "pathname",
    "process",
    "processName",
    "relativeCreated",
    "stack_info",
    "exc_info",
    "exc_text",
    "thread",
    "threadName",
    "taskName",
    "asctime",
}


def get_request_id() -> str:
    return request_id_ctx.get()


def set_request_id(request_id: str) -> None:
    request_id_ctx.set(request_id)


def get_logger(name: str) -> logging.Logger:
    """Use in modules: `logger = get_logger(__name__)`."""
    return logging.getLogger(name)


def log_event(
    logger: logging.Logger,
    event: str,
    *,
    level: int = logging.INFO,
    **fields: Any,
) -> None:
    """Structured business/ops event.

    Example:
        log_event(logger, "order.approved", order_id=str(order.id), user_id=str(user.id))
    """
    logger.log(level, event, extra={"event": event, **fields})


class _JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "request_id": get_request_id(),
            "environment": settings.environment,
        }
        event = getattr(record, "event", None)
        if event:
            payload["event"] = event

        for key, value in record.__dict__.items():
            if key in _RESERVED_RECORD_ATTRS or key.startswith("_"):
                continue
            if key in payload:
                continue
            try:
                json.dumps(value)
                payload[key] = value
            except (TypeError, ValueError):
                payload[key] = str(value)

        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)

        return json.dumps(payload, default=str)


class _TextFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        request_id = get_request_id()
        base = f"{self.formatTime(record, self.datefmt)} {record.levelname:5} [{request_id}] {record.name}: {record.getMessage()}"
        event = getattr(record, "event", None)
        extras = []
        if event:
            extras.append(f"event={event}")
        for key, value in record.__dict__.items():
            if key in _RESERVED_RECORD_ATTRS or key.startswith("_") or key == "event":
                continue
            extras.append(f"{key}={value}")
        if extras:
            base = f"{base} | {' '.join(extras)}"
        if record.exc_info:
            base = f"{base}\n{self.formatException(record.exc_info)}"
        return base


def _resolved_format() -> str:
    fmt = (settings.log_format or "auto").lower()
    if fmt == "auto":
        return "json" if settings.environment.lower() == "production" else "text"
    return fmt if fmt in {"json", "text"} else "text"


def setup_logging() -> None:
    """Configure root logging once. Safe to call on every app startup."""
    level_name = (settings.log_level or "INFO").upper()
    level = getattr(logging, level_name, logging.INFO)

    root = logging.getLogger()
    root.handlers.clear()
    root.setLevel(level)

    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(level)
    if _resolved_format() == "json":
        handler.setFormatter(_JsonFormatter())
    else:
        handler.setFormatter(
            _TextFormatter(fmt="%(asctime)s %(levelname)s %(name)s: %(message)s", datefmt="%H:%M:%S")
        )
    root.addHandler(handler)

    # Keep library noise down; raise via LOG_LEVEL=DEBUG when needed.
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)

    get_logger("app").info(
        "logging_configured",
        extra={
            "event": "app.logging_configured",
            "log_level": level_name,
            "log_format": _resolved_format(),
        },
    )


def client_ip(request) -> Optional[str]:
    """Best-effort client IP behind common proxies."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return None
