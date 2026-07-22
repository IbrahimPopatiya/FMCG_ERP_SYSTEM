"""Tests for POST/PATCH/DELETE /categories.

Every Categories endpoint requires login, same as Routes - each test first
creates a user and builds a token by hand.
"""

import uuid

from app.core.security import create_access_token


def auth_headers(client):
    user = client.post(
        "/api/v1/users",
        json={
            "full_name": "Category Tester",
            "mobile": "9222233344",
            "email": "category.tester@example.com",
            "password": "secret123",
            "role": "admin",
        },
    ).json()
    token = create_access_token(uuid.UUID(user["id"]))
    return {"Authorization": f"Bearer {token}"}


# ---------- POST /categories ----------

def test_create_category_returns_201(client):
    headers = auth_headers(client)

    response = client.post("/api/v1/categories", json={"name": "Beverages"}, headers=headers)

    assert response.status_code == 201
    body = response.json()
    assert body["name"] == "Beverages"
    assert body["parent_id"] is None
    assert body["image"] is None


def test_create_category_without_token_returns_401_or_403(client):
    response = client.post("/api/v1/categories", json={"name": "No Auth"})

    assert response.status_code in (401, 403)


def test_create_category_missing_name_returns_422(client):
    headers = auth_headers(client)

    response = client.post("/api/v1/categories", json={}, headers=headers)

    assert response.status_code == 422


def test_create_subcategory_with_parent(client):
    headers = auth_headers(client)
    parent = client.post("/api/v1/categories", json={"name": "Beverages"}, headers=headers).json()

    response = client.post(
        "/api/v1/categories",
        json={"name": "Soft Drinks", "parent_id": parent["id"]},
        headers=headers,
    )

    assert response.status_code == 201
    assert response.json()["parent_id"] == parent["id"]


def test_create_category_with_missing_parent_returns_404(client):
    headers = auth_headers(client)
    fake_parent_id = str(uuid.uuid4())

    response = client.post(
        "/api/v1/categories",
        json={"name": "Orphan", "parent_id": fake_parent_id},
        headers=headers,
    )

    assert response.status_code == 404


# ---------- PATCH /categories/{id} ----------

def test_update_category_name(client):
    headers = auth_headers(client)
    category = client.post("/api/v1/categories", json={"name": "Old Name"}, headers=headers).json()

    response = client.patch(
        f"/api/v1/categories/{category['id']}", json={"name": "New Name"}, headers=headers
    )

    assert response.status_code == 200
    assert response.json()["name"] == "New Name"


def test_update_category_not_found_returns_404(client):
    headers = auth_headers(client)
    fake_id = uuid.uuid4()

    response = client.patch(
        f"/api/v1/categories/{fake_id}", json={"name": "Nobody"}, headers=headers
    )

    assert response.status_code == 404


def test_update_category_with_missing_parent_returns_404(client):
    headers = auth_headers(client)
    category = client.post("/api/v1/categories", json={"name": "Snacks"}, headers=headers).json()
    fake_parent_id = str(uuid.uuid4())

    response = client.patch(
        f"/api/v1/categories/{category['id']}",
        json={"parent_id": fake_parent_id},
        headers=headers,
    )

    assert response.status_code == 404


# ---------- DELETE /categories/{id} ----------

def test_delete_category_sets_deleted_at(client):
    headers = auth_headers(client)
    category = client.post("/api/v1/categories", json={"name": "To Delete"}, headers=headers).json()

    response = client.delete(f"/api/v1/categories/{category['id']}", headers=headers)

    assert response.status_code == 200
    assert response.json()["deleted_at"] is not None


def test_delete_category_not_found_returns_404(client):
    headers = auth_headers(client)
    fake_id = uuid.uuid4()

    response = client.delete(f"/api/v1/categories/{fake_id}", headers=headers)

    assert response.status_code == 404


def test_deleted_category_no_longer_updatable(client):
    headers = auth_headers(client)
    category = client.post("/api/v1/categories", json={"name": "Ghost"}, headers=headers).json()
    client.delete(f"/api/v1/categories/{category['id']}", headers=headers)

    response = client.patch(
        f"/api/v1/categories/{category['id']}", json={"name": "Still Ghost"}, headers=headers
    )

    assert response.status_code == 404
