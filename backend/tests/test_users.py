"""Tests for POST /users, PATCH /users/{id}, PATCH /users/{id}/status."""

import uuid


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


# ---------- POST /users ----------

def test_create_user_returns_201_and_no_password(client):
    response = client.post("/api/v1/users", json=make_user_payload())

    assert response.status_code == 201
    body = response.json()
    assert body["mobile"] == "9000000001"
    assert body["status"] == "active"
    assert "password" not in body
    assert "password_hash" not in body


def test_create_user_missing_required_field_returns_422(client):
    response = client.post("/api/v1/users", json={"full_name": "No Mobile"})

    assert response.status_code == 422


def test_create_user_invalid_role_returns_422(client):
    response = client.post("/api/v1/users", json=make_user_payload(role="astronaut"))

    assert response.status_code == 422


def test_create_user_duplicate_mobile_returns_409(client):
    client.post("/api/v1/users", json=make_user_payload(email="first@example.com"))

    response = client.post(
        "/api/v1/users",
        json=make_user_payload(email="second@example.com"),  # same mobile, different email
    )

    assert response.status_code == 409


# ---------- PATCH /users/{id} ----------

def test_update_user_changes_only_sent_fields(client):
    created = client.post("/api/v1/users", json=make_user_payload()).json()

    response = client.patch(f"/api/v1/users/{created['id']}", json={"full_name": "Updated Name"})

    assert response.status_code == 200
    body = response.json()
    assert body["full_name"] == "Updated Name"
    assert body["email"] == created["email"]  # untouched


def test_update_user_not_found_returns_404(client):
    fake_id = uuid.uuid4()

    response = client.patch(f"/api/v1/users/{fake_id}", json={"full_name": "Nobody"})

    assert response.status_code == 404


def test_update_user_invalid_email_returns_422(client):
    created = client.post("/api/v1/users", json=make_user_payload()).json()

    response = client.patch(f"/api/v1/users/{created['id']}", json={"email": "not-an-email"})

    assert response.status_code == 422


# ---------- PATCH /users/{id}/status ----------

def test_update_user_status_deactivates_user(client):
    created = client.post("/api/v1/users", json=make_user_payload()).json()

    response = client.patch(f"/api/v1/users/{created['id']}/status", json={"status": "inactive"})

    assert response.status_code == 200
    assert response.json()["status"] == "inactive"


def test_update_user_status_not_found_returns_404(client):
    fake_id = uuid.uuid4()

    response = client.patch(f"/api/v1/users/{fake_id}/status", json={"status": "inactive"})

    assert response.status_code == 404


def test_update_user_status_invalid_value_returns_422(client):
    created = client.post("/api/v1/users", json=make_user_payload()).json()

    response = client.patch(f"/api/v1/users/{created['id']}/status", json={"status": "deleted"})

    assert response.status_code == 422


# ---------- DELETE /users/{id} ----------

def test_delete_user_sets_deleted_at(client):
    created = client.post("/api/v1/users", json=make_user_payload()).json()

    response = client.delete(f"/api/v1/users/{created['id']}")

    assert response.status_code == 200
    body = response.json()
    assert body["id"] == created["id"]
    assert body["deleted_at"] is not None


def test_deleted_user_no_longer_updatable(client):
    """Soft-deleted users should behave as if they don't exist for other APIs."""
    created = client.post("/api/v1/users", json=make_user_payload()).json()
    client.delete(f"/api/v1/users/{created['id']}")

    response = client.patch(f"/api/v1/users/{created['id']}", json={"full_name": "Ghost"})

    assert response.status_code == 404


def test_delete_user_not_found_returns_404(client):
    fake_id = uuid.uuid4()

    response = client.delete(f"/api/v1/users/{fake_id}")

    assert response.status_code == 404


def test_delete_user_twice_returns_404_on_second_call(client):
    created = client.post("/api/v1/users", json=make_user_payload()).json()

    first = client.delete(f"/api/v1/users/{created['id']}")
    second = client.delete(f"/api/v1/users/{created['id']}")

    assert first.status_code == 200
    assert second.status_code == 404
