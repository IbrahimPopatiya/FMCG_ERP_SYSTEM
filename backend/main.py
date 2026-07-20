"""Backend entry point. Run with: python main.py

This creates any missing database tables (from app/models) and then starts
the FastAPI server on http://localhost:8000

For day-to-day development you can also run `uvicorn main:app --reload`
directly - that skips the table check, which is fine once your tables
already exist.
"""

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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
)
from app.db.init_db import create_all_tables

app = FastAPI(title="DMS API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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


if __name__ == "__main__":
    create_all_tables()
    uvicorn.run("main:app", host="localhost", port=8000, reload=True)
