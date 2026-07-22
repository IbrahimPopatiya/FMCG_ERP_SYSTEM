"""Tests for POST /inventory/adjustments, POST /inventory/transfers, GET /inventory."""

import uuid

from app.core.security import create_access_token


def auth_headers(client):
    user = client.post(
        "/api/v1/users",
        json={
            "full_name": "Inventory Tester",
            "mobile": "9555566677",
            "email": "inventory.tester@example.com",
            "password": "secret123",
            "role": "admin",
        },
    ).json()
    token = create_access_token(uuid.UUID(user["id"]))
    return {"Authorization": f"Bearer {token}"}


def make_warehouse(client, headers, **overrides):
    payload = {"name": "Main Warehouse", "address": "Plot 1, MIDC", "state": "Maharashtra"}
    payload.update(overrides)
    return client.post("/api/v1/warehouses", json=payload, headers=headers).json()


def make_product(client, headers, **overrides):
    payload = {
        "sku": "SKU-1001",
        "barcode": "8901234567890",
        "name": "Coca-Cola 500ml",
        "unit": "bottle",
        "packing": "12 x 500ml",
        "mrp": 40.00,
        "selling_price": 35.00,
        "gst_rate": 18.00,
        "minimum_stock": 50,
    }
    payload.update(overrides)
    return client.post("/api/v1/products", json=payload, headers=headers).json()


# ---------- POST /inventory/adjustments ----------

def test_create_adjustment_increases_stock_returns_201(client):
    headers = auth_headers(client)
    warehouse = make_warehouse(client, headers)
    product = make_product(client, headers)

    response = client.post(
        "/api/v1/inventory/adjustments",
        json={
            "warehouse_id": warehouse["id"],
            "product_id": product["id"],
            "quantity": 100,
            "reason": "Initial stock load",
        },
        headers=headers,
    )

    assert response.status_code == 201
    body = response.json()
    assert body["movement_type"] == "adjustment"
    assert body["balance_after"] == 100


def test_create_adjustment_negative_quantity_reduces_stock(client):
    headers = auth_headers(client)
    warehouse = make_warehouse(client, headers)
    product = make_product(client, headers)
    client.post(
        "/api/v1/inventory/adjustments",
        json={"warehouse_id": warehouse["id"], "product_id": product["id"], "quantity": 100, "reason": "Load"},
        headers=headers,
    )

    response = client.post(
        "/api/v1/inventory/adjustments",
        json={
            "warehouse_id": warehouse["id"],
            "product_id": product["id"],
            "quantity": -5,
            "reason": "Physical stock mismatch",
        },
        headers=headers,
    )

    assert response.status_code == 201
    assert response.json()["balance_after"] == 95


def test_create_adjustment_missing_field_returns_422(client):
    headers = auth_headers(client)

    response = client.post(
        "/api/v1/inventory/adjustments", json={"quantity": 5}, headers=headers
    )

    assert response.status_code == 422


def test_create_adjustment_without_token_returns_401_or_403(client):
    response = client.post(
        "/api/v1/inventory/adjustments",
        json={
            "warehouse_id": str(uuid.uuid4()),
            "product_id": str(uuid.uuid4()),
            "quantity": 5,
            "reason": "test",
        },
    )

    assert response.status_code in (401, 403)


# ---------- POST /inventory/transfers ----------

def test_create_transfer_moves_stock_between_warehouses(client):
    headers = auth_headers(client)
    from_warehouse = make_warehouse(client, headers, name="Warehouse A")
    to_warehouse = make_warehouse(client, headers, name="Warehouse B")
    product = make_product(client, headers)
    client.post(
        "/api/v1/inventory/adjustments",
        json={"warehouse_id": from_warehouse["id"], "product_id": product["id"], "quantity": 100, "reason": "Load"},
        headers=headers,
    )

    response = client.post(
        "/api/v1/inventory/transfers",
        json={
            "from_warehouse_id": from_warehouse["id"],
            "to_warehouse_id": to_warehouse["id"],
            "product_id": product["id"],
            "quantity": 40,
        },
        headers=headers,
    )

    assert response.status_code == 201
    body = response.json()
    assert body["quantity"] == 40

    stock = client.get(
        "/api/v1/inventory",
        params={"product_id": product["id"]},
        headers=headers,
    ).json()
    stock_by_warehouse = {row["warehouse_id"]: row["physical_stock"] for row in stock}
    assert stock_by_warehouse[from_warehouse["id"]] == 60
    assert stock_by_warehouse[to_warehouse["id"]] == 40


# ---------- GET /inventory ----------

def test_get_inventory_returns_sellable_stock(client):
    headers = auth_headers(client)
    warehouse = make_warehouse(client, headers)
    product = make_product(client, headers)
    client.post(
        "/api/v1/inventory/adjustments",
        json={"warehouse_id": warehouse["id"], "product_id": product["id"], "quantity": 500, "reason": "Load"},
        headers=headers,
    )

    response = client.get(
        "/api/v1/inventory",
        params={"warehouse_id": warehouse["id"], "product_id": product["id"]},
        headers=headers,
    )

    assert response.status_code == 200
    body = response.json()[0]
    assert body["physical_stock"] == 500
    assert body["sellable_stock"] == 500


def test_get_inventory_without_token_returns_401_or_403(client):
    response = client.get("/api/v1/inventory")

    assert response.status_code in (401, 403)
