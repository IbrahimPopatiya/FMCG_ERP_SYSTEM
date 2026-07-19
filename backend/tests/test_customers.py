"""Tests for POST /customers."""

import uuid

from app.core.security import create_access_token


def auth_headers(client):
    user = client.post(
        "/api/v1/users",
        json={
            "full_name": "Customer Tester",
            "mobile": "9555566677",
            "email": "customer.tester@example.com",
            "password": "secret123",
            "role": "admin",
        },
    ).json()
    token = create_access_token(uuid.UUID(user["id"]))
    return {"Authorization": f"Bearer {token}"}


def make_customer_payload(**overrides):
    payload = {
        "customer_code": "CUST-001",
        "business_name": "Sharma General Store",
        "owner_name": "Anil Sharma",
        "mobile": "9876500000",
        "address": "Shop 12, Market Road",
        "city": "Pune",
        "state": "Maharashtra",
        "pincode": "411001",
        "credit_limit": 50000.00,
        "payment_terms": 15,
    }
    payload.update(overrides)
    return payload


def test_create_customer_returns_201(client):
    headers = auth_headers(client)

    response = client.post("/api/v1/customers", json=make_customer_payload(), headers=headers)

    assert response.status_code == 201
    body = response.json()
    assert body["customer_code"] == "CUST-001"
    assert body["status"] == "active"


def test_create_customer_without_token_returns_401_or_403(client):
    response = client.post("/api/v1/customers", json=make_customer_payload())

    assert response.status_code in (401, 403)


def test_create_customer_missing_required_field_returns_422(client):
    headers = auth_headers(client)

    response = client.post("/api/v1/customers", json={"business_name": "No Code"}, headers=headers)

    assert response.status_code == 422


def test_create_customer_duplicate_customer_code_returns_409(client):
    headers = auth_headers(client)
    client.post(
        "/api/v1/customers",
        json=make_customer_payload(mobile="9111111111"),
        headers=headers,
    )

    response = client.post(
        "/api/v1/customers",
        json=make_customer_payload(mobile="9222222222"),  # same customer_code
        headers=headers,
    )

    assert response.status_code == 409


def test_create_customer_without_route_or_price_list_is_allowed(client):
    """route_id and price_list_id are optional for now - Price Lists domain
    doesn't exist yet, so customers can be created without either."""
    headers = auth_headers(client)

    response = client.post("/api/v1/customers", json=make_customer_payload(), headers=headers)

    assert response.status_code == 201


# ---------- PATCH /customers/{id} ----------

def test_update_customer_changes_only_sent_fields(client):
    headers = auth_headers(client)
    created = client.post(
        "/api/v1/customers", json=make_customer_payload(customer_code="CUST-100"), headers=headers
    ).json()

    response = client.patch(
        f"/api/v1/customers/{created['id']}",
        json={"business_name": "Updated Store Name"},
        headers=headers,
    )

    assert response.status_code == 200
    assert response.json()["business_name"] == "Updated Store Name"


def test_update_customer_without_token_returns_401_or_403(client):
    headers = auth_headers(client)
    created = client.post(
        "/api/v1/customers", json=make_customer_payload(customer_code="CUST-101"), headers=headers
    ).json()

    response = client.patch(
        f"/api/v1/customers/{created['id']}", json={"business_name": "No Auth"}
    )

    assert response.status_code in (401, 403)


def test_update_customer_not_found_returns_404(client):
    headers = auth_headers(client)
    fake_id = uuid.uuid4()

    response = client.patch(
        f"/api/v1/customers/{fake_id}", json={"business_name": "Nobody"}, headers=headers
    )

    assert response.status_code == 404


def test_update_customer_credit_limit(client):
    """Business rule check: credit_limit is a decimal field, must accept and
    persist a new numeric value (this is what stock/order limits will rely on)."""
    headers = auth_headers(client)
    created = client.post(
        "/api/v1/customers", json=make_customer_payload(customer_code="CUST-102"), headers=headers
    ).json()

    response = client.patch(
        f"/api/v1/customers/{created['id']}", json={"credit_limit": 75000.50}, headers=headers
    )

    assert response.status_code == 200


# ---------- PATCH /customers/{id}/status ----------

def test_block_customer(client):
    headers = auth_headers(client)
    created = client.post(
        "/api/v1/customers", json=make_customer_payload(customer_code="CUST-200"), headers=headers
    ).json()

    response = client.patch(
        f"/api/v1/customers/{created['id']}/status", json={"status": "blocked"}, headers=headers
    )

    assert response.status_code == 200
    assert response.json()["status"] == "blocked"


def test_update_customer_status_without_token_returns_401_or_403(client):
    headers = auth_headers(client)
    created = client.post(
        "/api/v1/customers", json=make_customer_payload(customer_code="CUST-201"), headers=headers
    ).json()

    response = client.patch(
        f"/api/v1/customers/{created['id']}/status", json={"status": "blocked"}
    )

    assert response.status_code in (401, 403)


def test_update_customer_status_not_found_returns_404(client):
    headers = auth_headers(client)
    fake_id = uuid.uuid4()

    response = client.patch(
        f"/api/v1/customers/{fake_id}/status", json={"status": "blocked"}, headers=headers
    )

    assert response.status_code == 404


def test_update_customer_status_invalid_value_returns_422(client):
    headers = auth_headers(client)
    created = client.post(
        "/api/v1/customers", json=make_customer_payload(customer_code="CUST-202"), headers=headers
    ).json()

    response = client.patch(
        f"/api/v1/customers/{created['id']}/status", json={"status": "vip"}, headers=headers
    )

    assert response.status_code == 422


# ---------- PATCH /customers/{id}/location ----------

def test_update_customer_location(client):
    headers = auth_headers(client)
    created = client.post(
        "/api/v1/customers", json=make_customer_payload(customer_code="CUST-300"), headers=headers
    ).json()

    response = client.patch(
        f"/api/v1/customers/{created['id']}/location",
        json={"latitude": 18.5204303, "longitude": 73.8567437},
        headers=headers,
    )

    assert response.status_code == 200
    body = response.json()
    assert float(body["latitude"]) == 18.5204303
    assert float(body["longitude"]) == 73.8567437


def test_update_customer_location_without_token_returns_401_or_403(client):
    headers = auth_headers(client)
    created = client.post(
        "/api/v1/customers", json=make_customer_payload(customer_code="CUST-301"), headers=headers
    ).json()

    response = client.patch(
        f"/api/v1/customers/{created['id']}/location",
        json={"latitude": 18.5, "longitude": 73.8},
    )

    assert response.status_code in (401, 403)


def test_update_customer_location_not_found_returns_404(client):
    headers = auth_headers(client)
    fake_id = uuid.uuid4()

    response = client.patch(
        f"/api/v1/customers/{fake_id}/location",
        json={"latitude": 18.5, "longitude": 73.8},
        headers=headers,
    )

    assert response.status_code == 404


def test_update_customer_location_missing_field_returns_422(client):
    headers = auth_headers(client)
    created = client.post(
        "/api/v1/customers", json=make_customer_payload(customer_code="CUST-302"), headers=headers
    ).json()

    response = client.patch(
        f"/api/v1/customers/{created['id']}/location", json={"latitude": 18.5}, headers=headers
    )

    assert response.status_code == 422


# ---------- DELETE /customers/{id} ----------

def test_delete_customer_sets_deleted_at(client):
    headers = auth_headers(client)
    created = client.post(
        "/api/v1/customers", json=make_customer_payload(customer_code="CUST-400"), headers=headers
    ).json()

    response = client.delete(f"/api/v1/customers/{created['id']}", headers=headers)

    assert response.status_code == 200
    body = response.json()
    assert body["id"] == created["id"]
    assert body["deleted_at"] is not None


def test_delete_customer_without_token_returns_401_or_403(client):
    headers = auth_headers(client)
    created = client.post(
        "/api/v1/customers", json=make_customer_payload(customer_code="CUST-401"), headers=headers
    ).json()

    response = client.delete(f"/api/v1/customers/{created['id']}")

    assert response.status_code in (401, 403)


def test_delete_customer_not_found_returns_404(client):
    headers = auth_headers(client)
    fake_id = uuid.uuid4()

    response = client.delete(f"/api/v1/customers/{fake_id}", headers=headers)

    assert response.status_code == 404


def test_deleted_customer_no_longer_updatable(client):
    headers = auth_headers(client)
    created = client.post(
        "/api/v1/customers", json=make_customer_payload(customer_code="CUST-402"), headers=headers
    ).json()
    client.delete(f"/api/v1/customers/{created['id']}", headers=headers)

    response = client.patch(
        f"/api/v1/customers/{created['id']}",
        json={"business_name": "Ghost Store"},
        headers=headers,
    )

    assert response.status_code == 404


def test_delete_customer_twice_returns_404_on_second_call(client):
    headers = auth_headers(client)
    created = client.post(
        "/api/v1/customers", json=make_customer_payload(customer_code="CUST-403"), headers=headers
    ).json()

    first = client.delete(f"/api/v1/customers/{created['id']}", headers=headers)
    second = client.delete(f"/api/v1/customers/{created['id']}", headers=headers)

    assert first.status_code == 200
    assert second.status_code == 404
