"""Tests for POST/PATCH /vehicles, PATCH /vehicles/{id}/driver,
PATCH /vehicles/{id}/status, DELETE /vehicles/{id}.

Every Vehicles endpoint requires login, same as the rest of the Catalog &
Supply track - each test first creates a user and builds a token by hand.
Vehicles is the first domain here with real foreign keys (driver_id -> users,
warehouse_id -> warehouses), so a few tests set those up first.
"""

import uuid

from app.core.security import create_access_token


def auth_headers(client):
    user = client.post(
        "/api/v1/users",
        json={
            "full_name": "Vehicle Tester",
            "mobile": "9888899900",
            "email": "vehicle.tester@example.com",
            "password": "secret123",
            "role": "admin",
        },
    ).json()
    token = create_access_token(uuid.UUID(user["id"]))
    return {"Authorization": f"Bearer {token}"}, user["id"]


def create_warehouse(client, headers):
    return client.post(
        "/api/v1/warehouses",
        json={"name": "Pune Central", "address": "Plot 5", "state": "Maharashtra"},
        headers=headers,
    ).json()


def vehicle_payload(**overrides):
    payload = {"vehicle_number": "MH12AB1234", "capacity": 2000.00}
    payload.update(overrides)
    return payload


# ---------- POST /vehicles ----------

def test_create_vehicle_returns_201(client):
    headers, _ = auth_headers(client)

    response = client.post("/api/v1/vehicles", json=vehicle_payload(), headers=headers)

    assert response.status_code == 201
    body = response.json()
    assert body["vehicle_number"] == "MH12AB1234"
    assert body["status"] == "available"


def test_create_vehicle_without_token_returns_401_or_403(client):
    response = client.post("/api/v1/vehicles", json=vehicle_payload())

    assert response.status_code in (401, 403)


def test_create_vehicle_missing_required_field_returns_422(client):
    headers, _ = auth_headers(client)

    response = client.post("/api/v1/vehicles", json={}, headers=headers)

    assert response.status_code == 422


def test_create_vehicle_with_driver_and_warehouse(client):
    headers, driver_id = auth_headers(client)
    warehouse = create_warehouse(client, headers)

    response = client.post(
        "/api/v1/vehicles",
        json=vehicle_payload(driver_id=driver_id, warehouse_id=warehouse["id"]),
        headers=headers,
    )

    assert response.status_code == 201
    body = response.json()
    assert body["driver_id"] == driver_id
    assert body["warehouse_id"] == warehouse["id"]


def test_create_vehicle_duplicate_vehicle_number_returns_409(client):
    headers, _ = auth_headers(client)
    client.post("/api/v1/vehicles", json=vehicle_payload(), headers=headers)

    response = client.post("/api/v1/vehicles", json=vehicle_payload(), headers=headers)

    assert response.status_code == 409


# ---------- PATCH /vehicles/{id} ----------

def test_update_vehicle_capacity(client):
    headers, _ = auth_headers(client)
    vehicle = client.post("/api/v1/vehicles", json=vehicle_payload(), headers=headers).json()

    response = client.patch(
        f"/api/v1/vehicles/{vehicle['id']}", json={"capacity": 2500.00}, headers=headers
    )

    assert response.status_code == 200
    assert float(response.json()["capacity"]) == 2500.00


def test_update_vehicle_not_found_returns_404(client):
    headers, _ = auth_headers(client)
    fake_id = uuid.uuid4()

    response = client.patch(
        f"/api/v1/vehicles/{fake_id}", json={"capacity": 100.00}, headers=headers
    )

    assert response.status_code == 404


# ---------- PATCH /vehicles/{id}/driver ----------

def test_assign_driver_to_vehicle(client):
    headers, driver_id = auth_headers(client)
    vehicle = client.post("/api/v1/vehicles", json=vehicle_payload(), headers=headers).json()

    response = client.patch(
        f"/api/v1/vehicles/{vehicle['id']}/driver",
        json={"driver_id": driver_id},
        headers=headers,
    )

    assert response.status_code == 200
    assert response.json()["driver_id"] == driver_id


def test_assign_driver_missing_field_returns_422(client):
    headers, _ = auth_headers(client)
    vehicle = client.post("/api/v1/vehicles", json=vehicle_payload(), headers=headers).json()

    response = client.patch(f"/api/v1/vehicles/{vehicle['id']}/driver", json={}, headers=headers)

    assert response.status_code == 422


def test_assign_driver_vehicle_not_found_returns_404(client):
    headers, driver_id = auth_headers(client)
    fake_id = uuid.uuid4()

    response = client.patch(
        f"/api/v1/vehicles/{fake_id}/driver", json={"driver_id": driver_id}, headers=headers
    )

    assert response.status_code == 404


# ---------- PATCH /vehicles/{id}/status ----------

def test_update_vehicle_status(client):
    headers, _ = auth_headers(client)
    vehicle = client.post("/api/v1/vehicles", json=vehicle_payload(), headers=headers).json()

    response = client.patch(
        f"/api/v1/vehicles/{vehicle['id']}/status",
        json={"status": "maintenance"},
        headers=headers,
    )

    assert response.status_code == 200
    assert response.json()["status"] == "maintenance"


def test_update_vehicle_status_not_found_returns_404(client):
    headers, _ = auth_headers(client)
    fake_id = uuid.uuid4()

    response = client.patch(
        f"/api/v1/vehicles/{fake_id}/status", json={"status": "in_use"}, headers=headers
    )

    assert response.status_code == 404


# ---------- DELETE /vehicles/{id} ----------

def test_delete_vehicle_sets_deleted_at(client):
    headers, _ = auth_headers(client)
    vehicle = client.post("/api/v1/vehicles", json=vehicle_payload(), headers=headers).json()

    response = client.delete(f"/api/v1/vehicles/{vehicle['id']}", headers=headers)

    assert response.status_code == 200
    assert response.json()["deleted_at"] is not None


def test_delete_vehicle_not_found_returns_404(client):
    headers, _ = auth_headers(client)
    fake_id = uuid.uuid4()

    response = client.delete(f"/api/v1/vehicles/{fake_id}", headers=headers)

    assert response.status_code == 404


def test_deleted_vehicle_no_longer_updatable(client):
    headers, _ = auth_headers(client)
    vehicle = client.post("/api/v1/vehicles", json=vehicle_payload(), headers=headers).json()
    client.delete(f"/api/v1/vehicles/{vehicle['id']}", headers=headers)

    response = client.patch(
        f"/api/v1/vehicles/{vehicle['id']}", json={"capacity": 1.00}, headers=headers
    )

    assert response.status_code == 404
