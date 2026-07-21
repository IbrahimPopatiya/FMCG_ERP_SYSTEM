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


# ---------- GET /products/{id} ----------

def test_get_product_returns_full_product(client):
    headers = auth_headers(client)
    product = client.post("/api/v1/products", json=product_payload(), headers=headers).json()

    response = client.get(f"/api/v1/products/{product['id']}", headers=headers)

    assert response.status_code == 200
    assert response.json()["sku"] == "SKU-1001"


def test_get_product_not_found_returns_404(client):
    headers = auth_headers(client)
    fake_id = uuid.uuid4()

    response = client.get(f"/api/v1/products/{fake_id}", headers=headers)

    assert response.status_code == 404


def test_get_product_without_token_returns_401_or_403(client):
    headers = auth_headers(client)
    product = client.post("/api/v1/products", json=product_payload(), headers=headers).json()

    response = client.get(f"/api/v1/products/{product['id']}")

    assert response.status_code in (401, 403)


# ---------- GET /products/manage (staff, paginated, all statuses) ----------

def test_list_products_for_management_returns_paginated_envelope(client):
    headers = auth_headers(client)
    client.post("/api/v1/products", json=product_payload(), headers=headers)

    response = client.get("/api/v1/products/manage", headers=headers)

    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 1
    assert body["page"] == 1
    assert body["page_size"] == 20
    assert len(body["items"]) == 1
    assert body["items"][0]["sku"] == "SKU-1001"


def test_list_products_for_management_includes_inactive_products(client):
    headers = auth_headers(client)
    product = client.post("/api/v1/products", json=product_payload(), headers=headers).json()
    client.patch(
        f"/api/v1/products/{product['id']}/status", json={"status": "inactive"}, headers=headers
    )

    response = client.get("/api/v1/products/manage", headers=headers)

    assert response.json()["total"] == 1


def test_list_products_for_management_respects_page_size(client):
    headers = auth_headers(client)
    for i in range(3):
        client.post(
            "/api/v1/products",
            json=product_payload(sku=f"SKU-PAGE-{i}", barcode=f"890123456789{i}"),
            headers=headers,
        )

    response = client.get("/api/v1/products/manage?page=1&page_size=2", headers=headers)

    body = response.json()
    assert body["total"] == 3
    assert len(body["items"]) == 2
    assert body["page_size"] == 2


def test_list_products_for_management_second_page_returns_remaining_items(client):
    headers = auth_headers(client)
    for i in range(3):
        client.post(
            "/api/v1/products",
            json=product_payload(sku=f"SKU-PAGE2-{i}", barcode=f"890123457789{i}"),
            headers=headers,
        )

    response = client.get("/api/v1/products/manage?page=2&page_size=2", headers=headers)

    body = response.json()
    assert body["page"] == 2
    assert len(body["items"]) == 1


def test_list_products_for_management_without_token_returns_401_or_403(client):
    response = client.get("/api/v1/products/manage")

    assert response.status_code in (401, 403)


# ---------- GET /products (catalog) ----------

def test_list_products_staff_sees_base_price(client):
    headers = auth_headers(client)
    client.post("/api/v1/products", json=product_payload(), headers=headers)

    response = client.get("/api/v1/products", headers=headers)

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert float(body[0]["effective_price"]) == 35.00


def test_list_products_customer_sees_discounted_price(client):
    headers = auth_headers(client)
    product = client.post("/api/v1/products", json=product_payload(), headers=headers).json()
    price_list = client.post(
        "/api/v1/price-lists", json={"name": "Wholesale"}, headers=headers
    ).json()
    client.post(
        f"/api/v1/price-lists/{price_list['id']}/items",
        json={"product_id": product["id"], "discount_percent": 10.00},
        headers=headers,
    )
    customer = client.post(
        "/api/v1/customers",
        json={
            "customer_code": "CUST-CAT-1",
            "business_name": "Catalog Test Store",
            "owner_name": "Test Owner",
            "mobile": "9876555555",
            "address": "Shop 1",
            "city": "Pune",
            "state": "Maharashtra",
            "pincode": "411001",
            "credit_limit": 10000.00,
            "payment_terms": 15,
            "price_list_id": price_list["id"],
            "password": "customerpass123",
        },
        headers=headers,
    ).json()
    login = client.post(
        "/api/v1/auth/login", json={"identifier": "9876555555", "password": "customerpass123"}
    ).json()
    customer_headers = {"Authorization": f"Bearer {login['access_token']}"}

    response = client.get("/api/v1/products", headers=customer_headers)

    assert response.status_code == 200
    body = response.json()
    assert float(body[0]["effective_price"]) == 31.50


def test_list_products_without_token_returns_401_or_403(client):
    response = client.get("/api/v1/products")

    assert response.status_code in (401, 403)


def test_deleted_product_no_longer_updatable(client):
    headers = auth_headers(client)
    product = client.post("/api/v1/products", json=product_payload(), headers=headers).json()
    client.delete(f"/api/v1/products/{product['id']}", headers=headers)

    response = client.patch(
        f"/api/v1/products/{product['id']}", json={"name": "Still Ghost"}, headers=headers
    )

    assert response.status_code == 404
