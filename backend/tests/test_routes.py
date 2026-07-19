"""Tests for POST/PATCH/DELETE /routes and PATCH /routes/{id}/salesman.

Unlike the Users domain, every Routes endpoint requires login (see
api_work_allocation.md - Option 1: build get_current_user() early, protect
every new domain from the start, even though /auth/login itself is deferred).
So each test first creates a user and builds a token by hand.
"""

import uuid

from app.core.security import create_access_token


def auth_headers(client):
    user = client.post(
        "/api/v1/users",
        json={
            "full_name": "Route Tester",
            "mobile": "9333344455",
            "email": "route.tester@example.com",
            "password": "secret123",
            "role": "admin",
        },
    ).json()
    token = create_access_token(uuid.UUID(user["id"]))
    return {"Authorization": f"Bearer {token}"}, user["id"]


# ---------- POST /routes ----------

def test_create_route_returns_201(client):
    headers, _ = auth_headers(client)

    response = client.post("/api/v1/routes", json={"name": "North Zone"}, headers=headers)

    assert response.status_code == 201
    body = response.json()
    assert body["name"] == "North Zone"
    assert body["status"] == "active"
    assert body["salesman_id"] is None


def test_create_route_without_token_returns_401_or_403(client):
    response = client.post("/api/v1/routes", json={"name": "No Auth"})

    assert response.status_code in (401, 403)


def test_create_route_missing_name_returns_422(client):
    headers, _ = auth_headers(client)

    response = client.post("/api/v1/routes", json={}, headers=headers)

    assert response.status_code == 422


def test_create_route_with_salesman(client):
    headers, salesman_id = auth_headers(client)

    response = client.post(
        "/api/v1/routes", json={"name": "South Zone", "salesman_id": salesman_id}, headers=headers
    )

    assert response.status_code == 201
    assert response.json()["salesman_id"] == salesman_id


# ---------- PATCH /routes/{id} ----------

def test_update_route_name(client):
    headers, _ = auth_headers(client)
    route = client.post("/api/v1/routes", json={"name": "Old Name"}, headers=headers).json()

    response = client.patch(
        f"/api/v1/routes/{route['id']}", json={"name": "New Name"}, headers=headers
    )

    assert response.status_code == 200
    assert response.json()["name"] == "New Name"


def test_update_route_not_found_returns_404(client):
    headers, _ = auth_headers(client)
    fake_id = uuid.uuid4()

    response = client.patch(
        f"/api/v1/routes/{fake_id}", json={"name": "Nobody"}, headers=headers
    )

    assert response.status_code == 404


# ---------- PATCH /routes/{id}/salesman ----------

def test_assign_salesman_to_route(client):
    headers, salesman_id = auth_headers(client)
    route = client.post("/api/v1/routes", json={"name": "East Zone"}, headers=headers).json()

    response = client.patch(
        f"/api/v1/routes/{route['id']}/salesman",
        json={"salesman_id": salesman_id},
        headers=headers,
    )

    assert response.status_code == 200
    assert response.json()["salesman_id"] == salesman_id


def test_assign_salesman_missing_field_returns_422(client):
    headers, _ = auth_headers(client)
    route = client.post("/api/v1/routes", json={"name": "West Zone"}, headers=headers).json()

    response = client.patch(f"/api/v1/routes/{route['id']}/salesman", json={}, headers=headers)

    assert response.status_code == 422


def test_assign_salesman_route_not_found_returns_404(client):
    headers, salesman_id = auth_headers(client)
    fake_id = uuid.uuid4()

    response = client.patch(
        f"/api/v1/routes/{fake_id}/salesman", json={"salesman_id": salesman_id}, headers=headers
    )

    assert response.status_code == 404


# ---------- DELETE /routes/{id} ----------

def test_delete_route_sets_deleted_at(client):
    headers, _ = auth_headers(client)
    route = client.post("/api/v1/routes", json={"name": "To Delete"}, headers=headers).json()

    response = client.delete(f"/api/v1/routes/{route['id']}", headers=headers)

    assert response.status_code == 200
    assert response.json()["deleted_at"] is not None


def test_delete_route_not_found_returns_404(client):
    headers, _ = auth_headers(client)
    fake_id = uuid.uuid4()

    response = client.delete(f"/api/v1/routes/{fake_id}", headers=headers)

    assert response.status_code == 404


def test_deleted_route_no_longer_updatable(client):
    headers, _ = auth_headers(client)
    route = client.post("/api/v1/routes", json={"name": "Ghost Zone"}, headers=headers).json()
    client.delete(f"/api/v1/routes/{route['id']}", headers=headers)

    response = client.patch(
        f"/api/v1/routes/{route['id']}", json={"name": "Still Ghost"}, headers=headers
    )

    assert response.status_code == 404
