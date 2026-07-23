"""Tests for POST/PATCH/DELETE /brands.

Every Brands endpoint requires login, same as Categories - each test first
creates a user and builds a token by hand.
"""

import uuid

from app.core.security import create_access_token


def auth_headers(client):
    user = client.post(
        "/api/v1/users",
        json={
            "full_name": "Brand Tester",
            "mobile": "9111122233",
            "email": "brand.tester@example.com",
            "password": "secret123",
            "role": "admin",
        },
    ).json()
    token = create_access_token(uuid.UUID(user["id"]))
    return {"Authorization": f"Bearer {token}"}


# ---------- GET /brands ----------

def test_list_brands_returns_all_non_deleted_brands(client):
    headers = auth_headers(client)
    client.post("/api/v1/brands", json={"name": "Brand A"}, headers=headers)
    client.post("/api/v1/brands", json={"name": "Brand B"}, headers=headers)

    response = client.get("/api/v1/brands", headers=headers)

    assert response.status_code == 200
    names = [b["name"] for b in response.json()]
    assert "Brand A" in names
    assert "Brand B" in names


def test_list_brands_excludes_deleted_brands(client):
    headers = auth_headers(client)
    brand = client.post("/api/v1/brands", json={"name": "Deleted Brand"}, headers=headers).json()
    client.delete(f"/api/v1/brands/{brand['id']}", headers=headers)

    response = client.get("/api/v1/brands", headers=headers)

    names = [b["name"] for b in response.json()]
    assert "Deleted Brand" not in names


def test_list_brands_without_token_returns_401_or_403(client):
    response = client.get("/api/v1/brands")

    assert response.status_code in (401, 403)


# ---------- POST /brands ----------

def test_create_brand_returns_201(client):
    headers = auth_headers(client)

    response = client.post("/api/v1/brands", json={"name": "Coca-Cola"}, headers=headers)

    assert response.status_code == 201
    body = response.json()
    assert body["name"] == "Coca-Cola"
    assert body["logo"] is None


def test_create_brand_without_token_returns_401_or_403(client):
    response = client.post("/api/v1/brands", json={"name": "No Auth"})

    assert response.status_code in (401, 403)


def test_create_brand_missing_name_returns_422(client):
    headers = auth_headers(client)

    response = client.post("/api/v1/brands", json={}, headers=headers)

    assert response.status_code == 422


def test_create_brand_with_logo(client):
    headers = auth_headers(client)

    response = client.post(
        "/api/v1/brands",
        json={"name": "Pepsi", "logo": "brands/pepsi.png"},
        headers=headers,
    )

    assert response.status_code == 201
    assert response.json()["logo"] == "brands/pepsi.png"


# ---------- PATCH /brands/{id} ----------

def test_update_brand_name(client):
    headers = auth_headers(client)
    brand = client.post("/api/v1/brands", json={"name": "Old Name"}, headers=headers).json()

    response = client.patch(
        f"/api/v1/brands/{brand['id']}", json={"name": "New Name"}, headers=headers
    )

    assert response.status_code == 200
    assert response.json()["name"] == "New Name"


def test_update_brand_not_found_returns_404(client):
    headers = auth_headers(client)
    fake_id = uuid.uuid4()

    response = client.patch(
        f"/api/v1/brands/{fake_id}", json={"name": "Nobody"}, headers=headers
    )

    assert response.status_code == 404


# ---------- DELETE /brands/{id} ----------

def test_delete_brand_sets_deleted_at(client):
    headers = auth_headers(client)
    brand = client.post("/api/v1/brands", json={"name": "To Delete"}, headers=headers).json()

    response = client.delete(f"/api/v1/brands/{brand['id']}", headers=headers)

    assert response.status_code == 200
    assert response.json()["deleted_at"] is not None


def test_delete_brand_not_found_returns_404(client):
    headers = auth_headers(client)
    fake_id = uuid.uuid4()

    response = client.delete(f"/api/v1/brands/{fake_id}", headers=headers)

    assert response.status_code == 404


def test_deleted_brand_no_longer_updatable(client):
    headers = auth_headers(client)
    brand = client.post("/api/v1/brands", json={"name": "Ghost"}, headers=headers).json()
    client.delete(f"/api/v1/brands/{brand['id']}", headers=headers)

    response = client.patch(
        f"/api/v1/brands/{brand['id']}", json={"name": "Still Ghost"}, headers=headers
    )

    assert response.status_code == 404
