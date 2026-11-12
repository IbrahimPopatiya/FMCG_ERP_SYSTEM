"""Tests for POST /users, PATCH /users/{id}, PATCH /users/{id}/status."""

import uuid

import pytest

from app.core.security import create_access_token
from tests.helpers import create_test_user


def make_user_payload(**overrides):
    payload = {
        "full_name": "Test User",
        "mobile": "9000000001",
        "email": "test.user@example.com",
        "password": "secret123",
        "role": "salesman",
    }
    payload.update(overrides)
    return payload


def headers_for_role(client, role):
    user = create_test_user(
        client,
        {
            "full_name": f"{role.title()} Caller",
            "mobile": "9000000099",
            "email": f"{role}.caller@example.com",
            "password": "secret123",
            "role": role,
        },
    )
    token = create_access_token(uuid.UUID(user["id"]))
    return {"Authorization": f"Bearer {token}"}


def admin_headers(client):
    return headers_for_role(client, "admin")


# ---------- Only an admin may create, edit, or delete users ----------

WRITE_ENDPOINTS = [
    ("post", "/api/v1/users", make_user_payload()),
    ("patch", f"/api/v1/users/{uuid.uuid4()}", {"full_name": "Changed"}),
    ("patch", f"/api/v1/users/{uuid.uuid4()}/status", {"status": "inactive"}),
    ("delete", f"/api/v1/users/{uuid.uuid4()}", None),
]


@pytest.mark.parametrize("method, url, body", WRITE_ENDPOINTS)
def test_write_endpoint_without_token_returns_401(client, method, url, body):
    response = client.request(method, url, json=body)

    assert response.status_code == 401


@pytest.mark.parametrize("method, url, body", WRITE_ENDPOINTS)
def test_write_endpoint_as_salesman_returns_403(client, method, url, body):
    headers = headers_for_role(client, "salesman")

    response = client.request(method, url, json=body, headers=headers)

    assert response.status_code == 403


# ---------- POST /users ----------

def test_create_user_returns_201_and_no_password(client):
    headers = admin_headers(client)
    response = client.post("/api/v1/users", json=make_user_payload(), headers=headers)

    assert response.status_code == 201
    body = response.json()
    assert body["mobile"] == "9000000001"
    assert body["status"] == "active"
    assert "password" not in body
    assert "password_hash" not in body


def test_create_user_missing_required_field_returns_422(client):
    headers = admin_headers(client)
    response = client.post("/api/v1/users", json={"full_name": "No Mobile"}, headers=headers)

    assert response.status_code == 422


def test_create_user_invalid_role_returns_422(client):
    headers = admin_headers(client)
    response = client.post("/api/v1/users", json=make_user_payload(role="astronaut"), headers=headers)

    assert response.status_code == 422


def test_create_user_duplicate_mobile_returns_409(client):
    headers = admin_headers(client)
    client.post("/api/v1/users", json=make_user_payload(email="first@example.com"), headers=headers)

    response = client.post(
        "/api/v1/users",
        json=make_user_payload(email="second@example.com"),  # same mobile, different email
        headers=headers,
    )

    assert response.status_code == 409


# ---------- PATCH /users/{id} ----------

def test_update_user_changes_only_sent_fields(client):
    headers = admin_headers(client)
    created = client.post("/api/v1/users", json=make_user_payload(), headers=headers).json()

    response = client.patch(f"/api/v1/users/{created['id']}", json={"full_name": "Updated Name"}, headers=headers)

    assert response.status_code == 200
    body = response.json()
    assert body["full_name"] == "Updated Name"
    assert body["email"] == created["email"]  # untouched


def test_update_user_not_found_returns_404(client):
    headers = admin_headers(client)
    fake_id = uuid.uuid4()

    response = client.patch(f"/api/v1/users/{fake_id}", json={"full_name": "Nobody"}, headers=headers)

    assert response.status_code == 404


def test_update_user_invalid_email_returns_422(client):
    headers = admin_headers(client)
    created = client.post("/api/v1/users", json=make_user_payload(), headers=headers).json()

    response = client.patch(f"/api/v1/users/{created['id']}", json={"email": "not-an-email"}, headers=headers)

    assert response.status_code == 422


# ---------- PATCH /users/{id}/status ----------

def test_update_user_status_deactivates_user(client):
    headers = admin_headers(client)
    created = client.post("/api/v1/users", json=make_user_payload(), headers=headers).json()

    response = client.patch(f"/api/v1/users/{created['id']}/status", json={"status": "inactive"}, headers=headers)

    assert response.status_code == 200
    assert response.json()["status"] == "inactive"


def test_update_user_status_not_found_returns_404(client):
    headers = admin_headers(client)
    fake_id = uuid.uuid4()

    response = client.patch(f"/api/v1/users/{fake_id}/status", json={"status": "inactive"}, headers=headers)

    assert response.status_code == 404


def test_update_user_status_invalid_value_returns_422(client):
    headers = admin_headers(client)
    created = client.post("/api/v1/users", json=make_user_payload(), headers=headers).json()

    response = client.patch(f"/api/v1/users/{created['id']}/status", json={"status": "deleted"}, headers=headers)

    assert response.status_code == 422


# ---------- DELETE /users/{id} ----------

def test_delete_user_sets_deleted_at(client):
    headers = admin_headers(client)
    created = client.post("/api/v1/users", json=make_user_payload(), headers=headers).json()

    response = client.delete(f"/api/v1/users/{created['id']}", headers=headers)

    assert response.status_code == 200
    body = response.json()
    assert body["id"] == created["id"]
    assert body["deleted_at"] is not None


def test_deleted_user_no_longer_updatable(client):
    """Soft-deleted users should behave as if they don't exist for other APIs."""
    headers = admin_headers(client)
    created = client.post("/api/v1/users", json=make_user_payload(), headers=headers).json()
    client.delete(f"/api/v1/users/{created['id']}", headers=headers)

    response = client.patch(f"/api/v1/users/{created['id']}", json={"full_name": "Ghost"}, headers=headers)

    assert response.status_code == 404


def test_delete_user_not_found_returns_404(client):
    headers = admin_headers(client)
    fake_id = uuid.uuid4()

    response = client.delete(f"/api/v1/users/{fake_id}", headers=headers)

    assert response.status_code == 404


def test_delete_user_twice_returns_404_on_second_call(client):
    headers = admin_headers(client)
    created = client.post("/api/v1/users", json=make_user_payload(), headers=headers).json()

    first = client.delete(f"/api/v1/users/{created['id']}", headers=headers)
    second = client.delete(f"/api/v1/users/{created['id']}", headers=headers)

    assert first.status_code == 200
    assert second.status_code == 404
