"""Tests for the unified POST /auth/login - staff (by email or mobile) and
customers (by mobile) share the same endpoint, per api_reference.md Section 1/19.
"""


def create_user(client, **overrides):
    payload = {
        "full_name": "Auth Tester",
        "mobile": "9111122233",
        "email": "auth.tester@example.com",
        "password": "secret123",
        "role": "admin",
    }
    payload.update(overrides)
    return client.post("/api/v1/users", json=payload).json()


def create_customer(client, headers, **overrides):
    payload = {
        "customer_code": "CUST-AUTH-1",
        "business_name": "Auth Test Store",
        "owner_name": "Test Owner",
        "mobile": "9876511111",
        "address": "Shop 1",
        "city": "Pune",
        "state": "Maharashtra",
        "pincode": "411001",
        "credit_limit": 10000.00,
        "payment_terms": 15,
        "password": "customerpass123",
    }
    payload.update(overrides)
    return client.post("/api/v1/customers", json=payload, headers=headers).json()


def admin_headers(client):
    user = create_user(client)
    login = client.post(
        "/api/v1/auth/login", json={"identifier": user["email"], "password": "secret123"}
    ).json()
    return {"Authorization": f"Bearer {login['access_token']}"}


# ---------- Staff login ----------

def test_staff_login_by_email_returns_token(client):
    user = create_user(client)

    response = client.post(
        "/api/v1/auth/login", json={"identifier": user["email"], "password": "secret123"}
    )

    assert response.status_code == 200
    body = response.json()
    assert body["principal_type"] == "user"
    assert body["access_token"]


def test_staff_login_by_mobile_returns_token(client):
    user = create_user(client, mobile="9222233344", email="mobile.login@example.com")

    response = client.post(
        "/api/v1/auth/login", json={"identifier": "9222233344", "password": "secret123"}
    )

    assert response.status_code == 200
    assert response.json()["principal_type"] == "user"


def test_staff_login_wrong_password_returns_401(client):
    user = create_user(client, email="wrongpass@example.com", mobile="9333344455")

    response = client.post(
        "/api/v1/auth/login", json={"identifier": user["email"], "password": "nope"}
    )

    assert response.status_code == 401


# ---------- Customer login ----------

def test_customer_login_by_mobile_returns_token(client):
    headers = admin_headers(client)
    customer = create_customer(client, headers, mobile="9876522222")

    response = client.post(
        "/api/v1/auth/login", json={"identifier": "9876522222", "password": "customerpass123"}
    )

    assert response.status_code == 200
    body = response.json()
    assert body["principal_type"] == "customer"


def test_customer_login_wrong_password_returns_401(client):
    headers = admin_headers(client)
    create_customer(client, headers, mobile="9876533333")

    response = client.post(
        "/api/v1/auth/login", json={"identifier": "9876533333", "password": "wrong"}
    )

    assert response.status_code == 401


def test_customer_login_disabled_returns_401(client):
    headers = admin_headers(client)
    customer = create_customer(client, headers, mobile="9876544444")
    client.patch(
        f"/api/v1/customers/{customer['id']}", json={"login_enabled": False}, headers=headers
    )

    response = client.post(
        "/api/v1/auth/login", json={"identifier": "9876544444", "password": "customerpass123"}
    )

    assert response.status_code == 401


def test_login_unknown_identifier_returns_401(client):
    response = client.post(
        "/api/v1/auth/login", json={"identifier": "0000000000", "password": "whatever"}
    )

    assert response.status_code == 401


def test_login_missing_fields_returns_422(client):
    response = client.post("/api/v1/auth/login", json={})

    assert response.status_code == 422
