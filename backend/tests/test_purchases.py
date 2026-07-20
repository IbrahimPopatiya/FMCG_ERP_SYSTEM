"""Tests for POST/PATCH /purchases, POST /purchases/{id}/receive, POST /purchases/{id}/cancel."""

import uuid

from app.core.security import create_access_token


def auth_headers(client):
    user = client.post(
        "/api/v1/users",
        json={
            "full_name": "Purchase Tester",
            "mobile": "9333344455",
            "email": "purchase.tester@example.com",
            "password": "secret123",
            "role": "admin",
        },
    ).json()
    token = create_access_token(uuid.UUID(user["id"]))
    return {"Authorization": f"Bearer {token}"}


def make_supplier(client, headers, **overrides):
    payload = {
        "supplier_code": "SUP-001",
        "name": "ABC Distributors Pvt Ltd",
        "gst_number": "27ABCDE1234F1Z5",
        "mobile": "9876511111",
        "address": "Industrial Estate, Pune",
    }
    payload.update(overrides)
    return client.post("/api/v1/suppliers", json=payload, headers=headers).json()


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


def purchase_payload(supplier, warehouse, product, **overrides):
    payload = {
        "supplier_id": supplier["id"],
        "warehouse_id": warehouse["id"],
        "items": [
            {"product_id": product["id"], "quantity": 200, "purchase_price": 28.00}
        ],
    }
    payload.update(overrides)
    return payload


# ---------- POST /purchases ----------

def test_create_purchase_returns_201(client):
    headers = auth_headers(client)
    supplier = make_supplier(client, headers)
    warehouse = make_warehouse(client, headers)
    product = make_product(client, headers)

    response = client.post(
        "/api/v1/purchases", json=purchase_payload(supplier, warehouse, product), headers=headers
    )

    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "draft"
    assert body["subtotal"] == "5600.00"
    assert body["cgst"] == "504.00"
    assert body["sgst"] == "504.00"
    assert body["total"] == "6608.00"
    assert len(body["items"]) == 1


def test_create_purchase_without_token_returns_401_or_403(client):
    response = client.post("/api/v1/purchases", json={"supplier_id": str(uuid.uuid4())})

    assert response.status_code in (401, 403)


def test_create_purchase_missing_required_field_returns_422(client):
    headers = auth_headers(client)

    response = client.post("/api/v1/purchases", json={"items": []}, headers=headers)

    assert response.status_code == 422


def test_create_purchase_unknown_product_returns_404(client):
    headers = auth_headers(client)
    supplier = make_supplier(client, headers)
    warehouse = make_warehouse(client, headers)

    response = client.post(
        "/api/v1/purchases",
        json={
            "supplier_id": supplier["id"],
            "warehouse_id": warehouse["id"],
            "items": [{"product_id": str(uuid.uuid4()), "quantity": 10, "purchase_price": 5}],
        },
        headers=headers,
    )

    assert response.status_code == 404


# ---------- PATCH /purchases/{id} ----------

def test_update_draft_purchase_recalculates_totals(client):
    headers = auth_headers(client)
    supplier = make_supplier(client, headers)
    warehouse = make_warehouse(client, headers)
    product = make_product(client, headers)
    purchase = client.post(
        "/api/v1/purchases", json=purchase_payload(supplier, warehouse, product), headers=headers
    ).json()

    response = client.patch(
        f"/api/v1/purchases/{purchase['id']}",
        json={"items": [{"product_id": product["id"], "quantity": 100, "purchase_price": 28.00}]},
        headers=headers,
    )

    assert response.status_code == 200
    body = response.json()
    assert body["subtotal"] == "2800.00"
    assert len(body["items"]) == 1


def test_update_purchase_not_found_returns_404(client):
    headers = auth_headers(client)
    fake_id = uuid.uuid4()

    response = client.patch(f"/api/v1/purchases/{fake_id}", json={}, headers=headers)

    assert response.status_code == 404


# ---------- POST /purchases/{id}/receive ----------

def test_receive_purchase_updates_inventory_and_status(client):
    headers = auth_headers(client)
    supplier = make_supplier(client, headers)
    warehouse = make_warehouse(client, headers)
    product = make_product(client, headers)
    purchase = client.post(
        "/api/v1/purchases", json=purchase_payload(supplier, warehouse, product), headers=headers
    ).json()
    item_id = purchase["items"][0]["id"]

    response = client.post(
        f"/api/v1/purchases/{purchase['id']}/receive",
        json={"items": [{"item_id": item_id, "received_qty": 200}]},
        headers=headers,
    )

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "received"
    assert body["movements_created"] == 1

    stock = client.get(
        "/api/v1/inventory",
        params={"warehouse_id": warehouse["id"], "product_id": product["id"]},
        headers=headers,
    ).json()
    assert stock[0]["physical_stock"] == 200


def test_receive_already_received_purchase_returns_409(client):
    headers = auth_headers(client)
    supplier = make_supplier(client, headers)
    warehouse = make_warehouse(client, headers)
    product = make_product(client, headers)
    purchase = client.post(
        "/api/v1/purchases", json=purchase_payload(supplier, warehouse, product), headers=headers
    ).json()
    item_id = purchase["items"][0]["id"]
    client.post(
        f"/api/v1/purchases/{purchase['id']}/receive",
        json={"items": [{"item_id": item_id, "received_qty": 200}]},
        headers=headers,
    )

    response = client.post(
        f"/api/v1/purchases/{purchase['id']}/receive",
        json={"items": [{"item_id": item_id, "received_qty": 200}]},
        headers=headers,
    )

    assert response.status_code == 409


def test_receive_purchase_not_found_returns_404(client):
    headers = auth_headers(client)
    fake_id = uuid.uuid4()

    response = client.post(
        f"/api/v1/purchases/{fake_id}/receive", json={"items": []}, headers=headers
    )

    assert response.status_code == 404


# ---------- POST /purchases/{id}/cancel ----------

def test_cancel_draft_purchase_returns_cancelled_status(client):
    headers = auth_headers(client)
    supplier = make_supplier(client, headers)
    warehouse = make_warehouse(client, headers)
    product = make_product(client, headers)
    purchase = client.post(
        "/api/v1/purchases", json=purchase_payload(supplier, warehouse, product), headers=headers
    ).json()

    response = client.post(
        f"/api/v1/purchases/{purchase['id']}/cancel",
        json={"reason": "Supplier unable to fulfil"},
        headers=headers,
    )

    assert response.status_code == 200
    assert response.json()["status"] == "cancelled"


def test_cancel_received_purchase_returns_409(client):
    headers = auth_headers(client)
    supplier = make_supplier(client, headers)
    warehouse = make_warehouse(client, headers)
    product = make_product(client, headers)
    purchase = client.post(
        "/api/v1/purchases", json=purchase_payload(supplier, warehouse, product), headers=headers
    ).json()
    item_id = purchase["items"][0]["id"]
    client.post(
        f"/api/v1/purchases/{purchase['id']}/receive",
        json={"items": [{"item_id": item_id, "received_qty": 200}]},
        headers=headers,
    )

    response = client.post(
        f"/api/v1/purchases/{purchase['id']}/cancel",
        json={"reason": "Too late"},
        headers=headers,
    )

    assert response.status_code == 409


def test_cancel_purchase_not_found_returns_404(client):
    headers = auth_headers(client)
    fake_id = uuid.uuid4()

    response = client.post(
        f"/api/v1/purchases/{fake_id}/cancel", json={"reason": "x"}, headers=headers
    )

    assert response.status_code == 404
