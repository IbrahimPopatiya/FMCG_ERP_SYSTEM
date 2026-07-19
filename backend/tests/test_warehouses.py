"""Tests for POST/PATCH /warehouses, PATCH /warehouses/{id}/status, DELETE /warehouses/{id}.

Every Warehouses endpoint requires login, same as Categories/Brands/Products -
each test first creates a user and builds a token by hand.
"""

import uuid

from app.core.security import create_access_token


def auth_headers(client):
    user = client.post(
        "/api/v1/users",
        json={
            "full_name": "Warehouse Tester",
            "mobile": "9666677788",
            "email": "warehouse.tester@example.com",
            "password": "secret123",
            "role": "admin",
        },
    ).json()
    token = create_access_token(uuid.UUID(user["id"]))
    return {"Authorization": f"Bearer {token}"}


def warehouse_payload(**overrides):
    payload = {
        "name": "Pune Central Warehouse",
        "address": "Plot 5, Industrial Area",
        "state": "Maharashtra",
    }
    payload.update(overrides)
    return payload


# ---------- POST /warehouses ----------

def test_create_warehouse_returns_201(client):
    headers = auth_headers(client)

    response = client.post("/api/v1/warehouses", json=warehouse_payload(), headers=headers)

    assert response.status_code == 201
    body = response.json()
    assert body["name"] == "Pune Central Warehouse"
    assert body["state"] == "Maharashtra"
    assert body["status"] == "active"


def test_create_warehouse_without_token_returns_401_or_403(client):
    response = client.post("/api/v1/warehouses", json=warehouse_payload())

    assert response.status_code in (401, 403)


def test_create_warehouse_missing_required_field_returns_422(client):
    headers = auth_headers(client)

    response = client.post("/api/v1/warehouses", json={"name": "Missing Fields"}, headers=headers)

    assert response.status_code == 422


# ---------- PATCH /warehouses/{id} ----------

def test_update_warehouse_address(client):
    headers = auth_headers(client)
    warehouse = client.post("/api/v1/warehouses", json=warehouse_payload(), headers=headers).json()

    response = client.patch(
        f"/api/v1/warehouses/{warehouse['id']}",
        json={"address": "New Address"},
        headers=headers,
    )

    assert response.status_code == 200
    assert response.json()["address"] == "New Address"


def test_update_warehouse_not_found_returns_404(client):
    headers = auth_headers(client)
    fake_id = uuid.uuid4()

    response = client.patch(
        f"/api/v1/warehouses/{fake_id}", json={"name": "Nobody"}, headers=headers
    )

    assert response.status_code == 404


# ---------- PATCH /warehouses/{id}/status ----------

def test_update_warehouse_status(client):
    headers = auth_headers(client)
    warehouse = client.post("/api/v1/warehouses", json=warehouse_payload(), headers=headers).json()

    response = client.patch(
        f"/api/v1/warehouses/{warehouse['id']}/status",
        json={"status": "inactive"},
        headers=headers,
    )

    assert response.status_code == 200
    assert response.json()["status"] == "inactive"


def test_update_warehouse_status_not_found_returns_404(client):
    headers = auth_headers(client)
    fake_id = uuid.uuid4()

    response = client.patch(
        f"/api/v1/warehouses/{fake_id}/status", json={"status": "inactive"}, headers=headers
    )

    assert response.status_code == 404


# ---------- DELETE /warehouses/{id} ----------

def test_delete_warehouse_sets_deleted_at(client):
    headers = auth_headers(client)
    warehouse = client.post("/api/v1/warehouses", json=warehouse_payload(), headers=headers).json()

    response = client.delete(f"/api/v1/warehouses/{warehouse['id']}", headers=headers)

    assert response.status_code == 200
    assert response.json()["deleted_at"] is not None


def test_delete_warehouse_not_found_returns_404(client):
    headers = auth_headers(client)
    fake_id = uuid.uuid4()

    response = client.delete(f"/api/v1/warehouses/{fake_id}", headers=headers)

    assert response.status_code == 404


def test_deleted_warehouse_no_longer_updatable(client):
    headers = auth_headers(client)
    warehouse = client.post("/api/v1/warehouses", json=warehouse_payload(), headers=headers).json()
    client.delete(f"/api/v1/warehouses/{warehouse['id']}", headers=headers)

    response = client.patch(
        f"/api/v1/warehouses/{warehouse['id']}", json={"name": "Still Ghost"}, headers=headers
    )

    assert response.status_code == 404
