"""Backend entry point. Run with: python main.py

This creates any missing database tables (from app/models) and then starts
the FastAPI server on http://localhost:8000

For day-to-day development you can also run `uvicorn main:app --reload`
directly - that skips the table check, which is fine once your tables
already exist.
"""

from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api import (
    health,
    users,
    routes,
    customers,
    categories,
    brands,
    products,
    price_lists,
    auth,
    sales_orders,
    warehouses,
    invoices,
    deliveries,
    suppliers,
    vehicles,
    inventory,
    purchases,
    file_uploads,
    payments,
    returns,
    credit_notes,
    posts,
)
from app.core.config import settings
from app.core.logging import get_logger, get_request_id, setup_logging
from app.core.middleware import RequestLoggingMiddleware
from app.db.init_db import create_all_tables

logger = get_logger("app")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    setup_logging()
    logger.info("app_started", extra={"event": "app.started"})
    yield
    logger.info("app_stopped", extra={"event": "app.stopped"})


app = FastAPI(title="DMS API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        *settings.cors_extra_origins_list,
    ],
    # Every Vercel branch/preview deploy gets its own hashed subdomain
    # (e.g. fmcg-erp-system-git-develop-<team>.vercel.app), so a static
    # allow_origins entry can't keep up - match any subdomain of this
    # project's vercel.app instead of hand-adding one per deploy.
    allow_origin_regex=r"https://fmcg-erp-system.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID"],
)
# Outermost: runs first on the way in, last on the way out.
app.add_middleware(RequestLoggingMiddleware)


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    if exc.status_code >= 500:
        logger.error(
            "http_error",
            extra={
                "event": "http.error",
                "status_code": exc.status_code,
                "detail": str(exc.detail),
                "path": request.url.path,
                "method": request.method,
            },
        )
    elif exc.status_code in (401, 403):
        logger.warning(
            "http_auth_rejected",
            extra={
                "event": "http.auth_rejected",
                "status_code": exc.status_code,
                "path": request.url.path,
                "method": request.method,
            },
        )
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers={"X-Request-ID": get_request_id()},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.info(
        "request_validation_failed",
        extra={
            "event": "http.validation_failed",
            "path": request.url.path,
            "method": request.method,
            "error_count": len(exc.errors()),
        },
    )
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()},
        headers={"X-Request-ID": get_request_id()},
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception(
        "unhandled_exception",
        extra={
            "event": "http.unhandled_exception",
            "path": request.url.path,
            "method": request.method,
            "error_type": type(exc).__name__,
        },
    )
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "request_id": get_request_id(),
        },
        headers={"X-Request-ID": get_request_id()},
    )


app.include_router(health.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(routes.router, prefix="/api/v1")
app.include_router(customers.router, prefix="/api/v1")
app.include_router(categories.router, prefix="/api/v1")
app.include_router(brands.router, prefix="/api/v1")
app.include_router(products.router, prefix="/api/v1")
app.include_router(price_lists.router, prefix="/api/v1")
app.include_router(auth.router, prefix="/api/v1")
app.include_router(sales_orders.router, prefix="/api/v1")
app.include_router(warehouses.router, prefix="/api/v1")
app.include_router(invoices.router, prefix="/api/v1")
app.include_router(deliveries.router, prefix="/api/v1")
app.include_router(suppliers.router, prefix="/api/v1")
app.include_router(vehicles.router, prefix="/api/v1")
app.include_router(inventory.router, prefix="/api/v1")
app.include_router(purchases.router, prefix="/api/v1")
app.include_router(file_uploads.router, prefix="/api/v1")
app.include_router(payments.router, prefix="/api/v1")
app.include_router(returns.router, prefix="/api/v1")
app.include_router(credit_notes.router, prefix="/api/v1")
app.include_router(posts.router, prefix="/api/v1")


if __name__ == "__main__":
    create_all_tables()
    uvicorn.run("main:app", host="localhost", port=8000, reload=True)
