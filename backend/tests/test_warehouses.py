"""Tests for POST/PATCH/DELETE /warehouses and PATCH /warehouses/{id}/status."""

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
    payload = {"name": "Main Warehouse", "address": "Plot 1, MIDC", "state": "Maharashtra"}
    payload.update(overrides)
    return payload


def test_create_warehouse_returns_201(client):
    headers = auth_headers(client)

    response = client.post("/api/v1/warehouses", json=warehouse_payload(), headers=headers)

    assert response.status_code == 201
    body = response.json()
    assert body["name"] == "Main Warehouse"
    assert body["status"] == "active"


def test_create_warehouse_missing_field_returns_422(client):
    headers = auth_headers(client)

    response = client.post("/api/v1/warehouses", json={"name": "No State"}, headers=headers)

    assert response.status_code == 422


def test_update_warehouse_not_found_returns_404(client):
    headers = auth_headers(client)
    fake_id = uuid.uuid4()

    response = client.patch(
        f"/api/v1/warehouses/{fake_id}", json={"name": "Nobody"}, headers=headers
    )

    assert response.status_code == 404


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


def test_delete_warehouse_not_found_returns_404(client):
    headers = auth_headers(client)
    fake_id = uuid.uuid4()

    response = client.delete(f"/api/v1/warehouses/{fake_id}", headers=headers)

    assert response.status_code == 404
