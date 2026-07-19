"""Tests for POST/PATCH /products, PATCH /products/{id}/status, DELETE /products/{id}.

Every Products endpoint requires login, same as Categories/Brands - each test
first creates a user and builds a token by hand.
"""

import uuid

from app.core.security import create_access_token


def auth_headers(client):
    user = client.post(
        "/api/v1/users",
        json={
            "full_name": "Product Tester",
            "mobile": "9444455566",
            "email": "product.tester@example.com",
            "password": "secret123",
            "role": "admin",
        },
    ).json()
    token = create_access_token(uuid.UUID(user["id"]))
    return {"Authorization": f"Bearer {token}"}


def product_payload(**overrides):
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
    return payload


# ---------- POST /products ----------

def test_create_product_returns_201(client):
    headers = auth_headers(client)

    response = client.post("/api/v1/products", json=product_payload(), headers=headers)

    assert response.status_code == 201
    body = response.json()
    assert body["sku"] == "SKU-1001"
    assert body["name"] == "Coca-Cola 500ml"
    assert body["status"] == "active"


def test_create_product_without_token_returns_401_or_403(client):
    response = client.post("/api/v1/products", json=product_payload())

    assert response.status_code in (401, 403)


def test_create_product_missing_required_field_returns_422(client):
    headers = auth_headers(client)

    response = client.post("/api/v1/products", json={"name": "Missing Fields"}, headers=headers)

    assert response.status_code == 422


def test_create_product_duplicate_sku_returns_409(client):
    headers = auth_headers(client)
    client.post("/api/v1/products", json=product_payload(), headers=headers)

    response = client.post(
        "/api/v1/products",
        json=product_payload(barcode="9999999999999"),
        headers=headers,
    )

    assert response.status_code == 409


def test_create_product_duplicate_barcode_returns_409(client):
    headers = auth_headers(client)
    client.post("/api/v1/products", json=product_payload(), headers=headers)

    response = client.post(
        "/api/v1/products",
        json=product_payload(sku="SKU-OTHER"),
        headers=headers,
    )

    assert response.status_code == 409


# ---------- PATCH /products/{id} ----------

def test_update_product_selling_price(client):
    headers = auth_headers(client)
    product = client.post("/api/v1/products", json=product_payload(), headers=headers).json()

    response = client.patch(
        f"/api/v1/products/{product['id']}", json={"selling_price": 33.00}, headers=headers
    )

    assert response.status_code == 200
    assert response.json()["selling_price"] == "33.00" or float(response.json()["selling_price"]) == 33.00


def test_update_product_not_found_returns_404(client):
    headers = auth_headers(client)
    fake_id = uuid.uuid4()

    response = client.patch(
        f"/api/v1/products/{fake_id}", json={"name": "Nobody"}, headers=headers
    )

    assert response.status_code == 404


# ---------- PATCH /products/{id}/status ----------

def test_update_product_status(client):
    headers = auth_headers(client)
    product = client.post("/api/v1/products", json=product_payload(), headers=headers).json()

    response = client.patch(
        f"/api/v1/products/{product['id']}/status", json={"status": "inactive"}, headers=headers
    )

    assert response.status_code == 200
    assert response.json()["status"] == "inactive"


def test_update_product_status_not_found_returns_404(client):
    headers = auth_headers(client)
    fake_id = uuid.uuid4()

    response = client.patch(
        f"/api/v1/products/{fake_id}/status", json={"status": "inactive"}, headers=headers
    )

    assert response.status_code == 404


# ---------- DELETE /products/{id} ----------

def test_delete_product_sets_deleted_at(client):
    headers = auth_headers(client)
    product = client.post("/api/v1/products", json=product_payload(), headers=headers).json()

    response = client.delete(f"/api/v1/products/{product['id']}", headers=headers)

    assert response.status_code == 200
    assert response.json()["deleted_at"] is not None


def test_delete_product_not_found_returns_404(client):
    headers = auth_headers(client)
    fake_id = uuid.uuid4()

    response = client.delete(f"/api/v1/products/{fake_id}", headers=headers)

    assert response.status_code == 404


def test_deleted_product_no_longer_updatable(client):
    headers = auth_headers(client)
    product = client.post("/api/v1/products", json=product_payload(), headers=headers).json()
    client.delete(f"/api/v1/products/{product['id']}", headers=headers)

    response = client.patch(
        f"/api/v1/products/{product['id']}", json={"name": "Still Ghost"}, headers=headers
    )

    assert response.status_code == 404
