"""Tests for POST/PATCH/DELETE /price-lists and its /items sub-resource.

Every Price Lists endpoint requires login, same as Categories/Brands/Products -
each test first creates a user and builds a token by hand.
"""

import uuid

from app.core.security import create_access_token


def auth_headers(client):
    user = client.post(
        "/api/v1/users",
        json={
            "full_name": "Price List Tester",
            "mobile": "9555566677",
            "email": "pricelist.tester@example.com",
            "password": "secret123",
            "role": "admin",
        },
    ).json()
    token = create_access_token(uuid.UUID(user["id"]))
    return {"Authorization": f"Bearer {token}"}


def create_product(client, headers, **overrides):
    payload = {
        "sku": "SKU-2001",
        "barcode": "8901234567891",
        "name": "Pepsi 500ml",
        "unit": "bottle",
        "packing": "12 x 500ml",
        "mrp": 40.00,
        "selling_price": 35.00,
        "gst_rate": 18.00,
        "minimum_stock": 50,
    }
    payload.update(overrides)
    return client.post("/api/v1/products", json=payload, headers=headers).json()


# ---------- POST /price-lists ----------

def test_create_price_list_returns_201(client):
    headers = auth_headers(client)

    response = client.post(
        "/api/v1/price-lists", json={"name": "Wholesale Tier 1"}, headers=headers
    )

    assert response.status_code == 201
    body = response.json()
    assert body["name"] == "Wholesale Tier 1"
    assert body["description"] is None


def test_create_price_list_without_token_returns_401_or_403(client):
    response = client.post("/api/v1/price-lists", json={"name": "No Auth"})

    assert response.status_code in (401, 403)


def test_create_price_list_missing_name_returns_422(client):
    headers = auth_headers(client)

    response = client.post("/api/v1/price-lists", json={}, headers=headers)

    assert response.status_code == 422


# ---------- PATCH /price-lists/{id} ----------

def test_update_price_list_description(client):
    headers = auth_headers(client)
    price_list = client.post(
        "/api/v1/price-lists", json={"name": "Tier 1"}, headers=headers
    ).json()

    response = client.patch(
        f"/api/v1/price-lists/{price_list['id']}",
        json={"description": "Standard pricing"},
        headers=headers,
    )

    assert response.status_code == 200
    assert response.json()["description"] == "Standard pricing"


def test_update_price_list_not_found_returns_404(client):
    headers = auth_headers(client)
    fake_id = uuid.uuid4()

    response = client.patch(
        f"/api/v1/price-lists/{fake_id}", json={"name": "Nobody"}, headers=headers
    )

    assert response.status_code == 404


# ---------- DELETE /price-lists/{id} ----------

def test_delete_price_list_sets_deleted_at(client):
    headers = auth_headers(client)
    price_list = client.post(
        "/api/v1/price-lists", json={"name": "To Delete"}, headers=headers
    ).json()

    response = client.delete(f"/api/v1/price-lists/{price_list['id']}", headers=headers)

    assert response.status_code == 200
    assert response.json()["deleted_at"] is not None


def test_delete_price_list_not_found_returns_404(client):
    headers = auth_headers(client)
    fake_id = uuid.uuid4()

    response = client.delete(f"/api/v1/price-lists/{fake_id}", headers=headers)

    assert response.status_code == 404


# ---------- POST /price-lists/{id}/items ----------

def test_create_price_list_item_returns_201(client):
    headers = auth_headers(client)
    price_list = client.post(
        "/api/v1/price-lists", json={"name": "Tier 1"}, headers=headers
    ).json()
    product = create_product(client, headers)

    response = client.post(
        f"/api/v1/price-lists/{price_list['id']}/items",
        json={"product_id": product["id"], "price": 33.00},
        headers=headers,
    )

    assert response.status_code == 201
    body = response.json()
    assert body["price_list_id"] == price_list["id"]
    assert body["product_id"] == product["id"]


def test_create_price_list_item_missing_field_returns_422(client):
    headers = auth_headers(client)
    price_list = client.post(
        "/api/v1/price-lists", json={"name": "Tier 1"}, headers=headers
    ).json()

    response = client.post(
        f"/api/v1/price-lists/{price_list['id']}/items", json={}, headers=headers
    )

    assert response.status_code == 422


def test_create_price_list_item_price_list_not_found_returns_404(client):
    headers = auth_headers(client)
    product = create_product(client, headers)
    fake_price_list_id = uuid.uuid4()

    response = client.post(
        f"/api/v1/price-lists/{fake_price_list_id}/items",
        json={"product_id": product["id"], "price": 33.00},
        headers=headers,
    )

    assert response.status_code == 404


def test_create_price_list_item_duplicate_product_returns_409(client):
    headers = auth_headers(client)
    price_list = client.post(
        "/api/v1/price-lists", json={"name": "Tier 1"}, headers=headers
    ).json()
    product = create_product(client, headers)
    client.post(
        f"/api/v1/price-lists/{price_list['id']}/items",
        json={"product_id": product["id"], "price": 33.00},
        headers=headers,
    )

    response = client.post(
        f"/api/v1/price-lists/{price_list['id']}/items",
        json={"product_id": product["id"], "price": 34.00},
        headers=headers,
    )

    assert response.status_code == 409


# ---------- PATCH /price-lists/{id}/items/{itemId} ----------

def test_update_price_list_item_price(client):
    headers = auth_headers(client)
    price_list = client.post(
        "/api/v1/price-lists", json={"name": "Tier 1"}, headers=headers
    ).json()
    product = create_product(client, headers)
    item = client.post(
        f"/api/v1/price-lists/{price_list['id']}/items",
        json={"product_id": product["id"], "price": 33.00},
        headers=headers,
    ).json()

    response = client.patch(
        f"/api/v1/price-lists/{price_list['id']}/items/{item['id']}",
        json={"price": 34.50},
        headers=headers,
    )

    assert response.status_code == 200
    assert float(response.json()["price"]) == 34.50


def test_update_price_list_item_not_found_returns_404(client):
    headers = auth_headers(client)
    price_list = client.post(
        "/api/v1/price-lists", json={"name": "Tier 1"}, headers=headers
    ).json()
    fake_item_id = uuid.uuid4()

    response = client.patch(
        f"/api/v1/price-lists/{price_list['id']}/items/{fake_item_id}",
        json={"price": 34.50},
        headers=headers,
    )

    assert response.status_code == 404


# ---------- DELETE /price-lists/{id}/items/{itemId} ----------

def test_delete_price_list_item_returns_removed_true(client):
    headers = auth_headers(client)
    price_list = client.post(
        "/api/v1/price-lists", json={"name": "Tier 1"}, headers=headers
    ).json()
    product = create_product(client, headers)
    item = client.post(
        f"/api/v1/price-lists/{price_list['id']}/items",
        json={"product_id": product["id"], "price": 33.00},
        headers=headers,
    ).json()

    response = client.delete(
        f"/api/v1/price-lists/{price_list['id']}/items/{item['id']}", headers=headers
    )

    assert response.status_code == 200
    assert response.json()["removed"] is True


def test_delete_price_list_item_not_found_returns_404(client):
    headers = auth_headers(client)
    price_list = client.post(
        "/api/v1/price-lists", json={"name": "Tier 1"}, headers=headers
    ).json()
    fake_item_id = uuid.uuid4()

    response = client.delete(
        f"/api/v1/price-lists/{price_list['id']}/items/{fake_item_id}", headers=headers
    )

    assert response.status_code == 404
