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
