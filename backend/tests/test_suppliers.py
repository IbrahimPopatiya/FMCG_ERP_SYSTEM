"""Tests for POST/PATCH /suppliers, PATCH /suppliers/{id}/status, DELETE /suppliers/{id}.

Every Suppliers endpoint requires login, same as Products/Warehouses -
each test first creates a user and builds a token by hand.
"""

import uuid

from app.core.security import create_access_token


def auth_headers(client):
    user = client.post(
        "/api/v1/users",
        json={
            "full_name": "Supplier Tester",
            "mobile": "9777788899",
            "email": "supplier.tester@example.com",
            "password": "secret123",
            "role": "admin",
        },
    ).json()
    token = create_access_token(uuid.UUID(user["id"]))
    return {"Authorization": f"Bearer {token}"}


def supplier_payload(**overrides):
    payload = {
        "supplier_code": "SUP-001",
        "name": "ABC Distributors Pvt Ltd",
        "gst_number": "27ABCDE1234F1Z5",
        "mobile": "9876511111",
        "address": "Industrial Estate, Pune",
    }
    payload.update(overrides)
    return payload


# ---------- POST /suppliers ----------

def test_create_supplier_returns_201(client):
    headers = auth_headers(client)

    response = client.post("/api/v1/suppliers", json=supplier_payload(), headers=headers)

    assert response.status_code == 201
    body = response.json()
    assert body["supplier_code"] == "SUP-001"
    assert body["name"] == "ABC Distributors Pvt Ltd"
    assert body["status"] == "active"


def test_create_supplier_without_token_returns_401_or_403(client):
    response = client.post("/api/v1/suppliers", json=supplier_payload())

    assert response.status_code in (401, 403)


def test_create_supplier_missing_required_field_returns_422(client):
    headers = auth_headers(client)

    response = client.post("/api/v1/suppliers", json={"name": "Missing Fields"}, headers=headers)

    assert response.status_code == 422


def test_create_supplier_duplicate_supplier_code_returns_409(client):
    headers = auth_headers(client)
    client.post("/api/v1/suppliers", json=supplier_payload(), headers=headers)

    response = client.post(
        "/api/v1/suppliers",
        json=supplier_payload(name="Different Name"),
        headers=headers,
    )

    assert response.status_code == 409


# ---------- PATCH /suppliers/{id} ----------

def test_update_supplier_address(client):
    headers = auth_headers(client)
    supplier = client.post("/api/v1/suppliers", json=supplier_payload(), headers=headers).json()

    response = client.patch(
        f"/api/v1/suppliers/{supplier['id']}",
        json={"address": "New Address"},
        headers=headers,
    )

    assert response.status_code == 200
    assert response.json()["address"] == "New Address"


def test_update_supplier_not_found_returns_404(client):
    headers = auth_headers(client)
    fake_id = uuid.uuid4()

    response = client.patch(
        f"/api/v1/suppliers/{fake_id}", json={"name": "Nobody"}, headers=headers
    )

    assert response.status_code == 404


# ---------- PATCH /suppliers/{id}/status ----------

def test_update_supplier_status(client):
    headers = auth_headers(client)
    supplier = client.post("/api/v1/suppliers", json=supplier_payload(), headers=headers).json()

    response = client.patch(
        f"/api/v1/suppliers/{supplier['id']}/status",
        json={"status": "inactive"},
        headers=headers,
    )

    assert response.status_code == 200
    assert response.json()["status"] == "inactive"


def test_update_supplier_status_not_found_returns_404(client):
    headers = auth_headers(client)
    fake_id = uuid.uuid4()

    response = client.patch(
        f"/api/v1/suppliers/{fake_id}/status", json={"status": "inactive"}, headers=headers
    )

    assert response.status_code == 404


# ---------- DELETE /suppliers/{id} ----------

def test_delete_supplier_sets_deleted_at(client):
    headers = auth_headers(client)
    supplier = client.post("/api/v1/suppliers", json=supplier_payload(), headers=headers).json()

    response = client.delete(f"/api/v1/suppliers/{supplier['id']}", headers=headers)

    assert response.status_code == 200
    assert response.json()["deleted_at"] is not None


def test_delete_supplier_not_found_returns_404(client):
    headers = auth_headers(client)
    fake_id = uuid.uuid4()

    response = client.delete(f"/api/v1/suppliers/{fake_id}", headers=headers)

    assert response.status_code == 404


def test_deleted_supplier_no_longer_updatable(client):
    headers = auth_headers(client)
    supplier = client.post("/api/v1/suppliers", json=supplier_payload(), headers=headers).json()
    client.delete(f"/api/v1/suppliers/{supplier['id']}", headers=headers)

    response = client.patch(
        f"/api/v1/suppliers/{supplier['id']}", json={"name": "Still Ghost"}, headers=headers
    )

    assert response.status_code == 404
