"""Tests for POST /deliveries and its /start, /arrive, /complete, /fail actions.

Per apis_doc.md Section 14, /complete is the important one: it records GPS +
timestamp, creates a payment, recomputes the invoice's payment_status, and
marks the order delivered - all staff-only (dispatcher/driver), never customer.
"""

import uuid

from app.models.sales_order import SalesOrder


def create_user(client, **overrides):
    payload = {
        "full_name": "Salesman Tester",
        "mobile": "9111199999",
        "email": "salesman.tester@example.com",
        "password": "secret123",
        "role": "salesman",
    }
    payload.update(overrides)
    return client.post("/api/v1/users", json=payload).json()


def admin_headers(client):
    admin = client.post(
        "/api/v1/users",
        json={
            "full_name": "Admin Tester",
            "mobile": "9000011111",
            "email": "admin.tester@example.com",
            "password": "secret123",
            "role": "admin",
        },
    ).json()
    login = client.post(
        "/api/v1/auth/login", json={"identifier": admin["email"], "password": "secret123"}
    ).json()
    return {"Authorization": f"Bearer {login['access_token']}"}


def user_token_headers(client, user):
    login = client.post(
        "/api/v1/auth/login", json={"identifier": user["email"], "password": "secret123"}
    ).json()
    return {"Authorization": f"Bearer {login['access_token']}"}


def create_warehouse(client, headers, state="Maharashtra"):
    return client.post(
        "/api/v1/warehouses",
        json={"name": "Main Warehouse", "address": "Plot 1", "state": state},
        headers=headers,
    ).json()


def create_product(client, headers, **overrides):
    payload = {
        "sku": "SKU-DEL-1",
        "barcode": "8801234600001",
        "name": "Delivery Test Product",
        "unit": "bottle",
        "packing": "1 x 500ml",
        "mrp": 40.00,
        "selling_price": 100.00,
        "gst_rate": 18.00,
        "minimum_stock": 10,
    }
    payload.update(overrides)
    return client.post("/api/v1/products", json=payload, headers=headers).json()


def create_route(client, headers, salesman_id):
    return client.post(
        "/api/v1/routes", json={"name": "Route 1", "salesman_id": salesman_id}, headers=headers
    ).json()


def create_customer(client, headers, route_id=None, state="Maharashtra", **overrides):
    payload = {
        "customer_code": "CUST-DEL-1",
        "business_name": "Delivery Test Store",
        "owner_name": "Test Owner",
        "mobile": "9876500022",
        "address": "Shop 1",
        "city": "Pune",
        "state": state,
        "pincode": "411001",
        "credit_limit": 10000.00,
        "payment_terms": 15,
        "route_id": route_id,
        "password": "customerpass123",
    }
    payload.update(overrides)
    return client.post("/api/v1/customers", json=payload, headers=headers).json()


def customer_login_headers(client, mobile, password="customerpass123"):
    login = client.post(
        "/api/v1/auth/login", json={"identifier": mobile, "password": password}
    ).json()
    return {"Authorization": f"Bearer {login['access_token']}"}


def create_invoice(client, headers, db_session, qty=1, price=100.00):
    """Creates an order (flipped to approved), generates its invoice, and
    returns (invoice, order, driver_headers)."""
    warehouse = create_warehouse(client, headers)
    salesman = create_user(client)
    route = create_route(client, headers, salesman["id"])
    customer = create_customer(client, headers, route_id=route["id"])
    salesman_headers = user_token_headers(client, salesman)
    product = create_product(client, headers, selling_price=price)

    order = client.post(
        "/api/v1/orders",
        json={
            "customer_id": customer["id"],
            "items": [{"product_id": product["id"], "ordered_qty": qty}],
        },
        headers=salesman_headers,
    ).json()

    db_order = db_session.query(SalesOrder).filter(SalesOrder.id == uuid.UUID(order["id"])).first()
    db_order.status = "approved"
    db_session.commit()

    invoice = client.post(f"/api/v1/orders/{order['id']}/invoice", headers=headers).json()

    driver = create_user(
        client, full_name="Driver Tester", mobile="9222233334", email="driver.tester@example.com", role="driver"
    )

    return invoice, order, driver, warehouse


def create_started_delivery(client, headers, db_session, **invoice_overrides):
    invoice, order, driver, _ = create_invoice(client, headers, db_session, **invoice_overrides)
    delivery = client.post(
        "/api/v1/deliveries", json={"invoice_id": invoice["id"], "driver_id": driver["id"]}, headers=headers
    ).json()
    client.post(f"/api/v1/deliveries/{delivery['id']}/start", json={}, headers=headers)
    return delivery, invoice, order


# ---------- POST /deliveries ----------

def test_create_delivery_returns_pending(client, db_session):
    headers = admin_headers(client)
    invoice, _, driver, _ = create_invoice(client, headers, db_session)

    response = client.post(
        "/api/v1/deliveries",
        json={"invoice_id": invoice["id"], "driver_id": driver["id"]},
        headers=headers,
    )

    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "pending"
    assert body["invoice_id"] == invoice["id"]


def test_create_delivery_duplicate_invoice_returns_409(client, db_session):
    headers = admin_headers(client)
    invoice, _, driver, _ = create_invoice(client, headers, db_session)
    client.post(
        "/api/v1/deliveries",
        json={"invoice_id": invoice["id"], "driver_id": driver["id"]},
        headers=headers,
    )

    response = client.post(
        "/api/v1/deliveries",
        json={"invoice_id": invoice["id"], "driver_id": driver["id"]},
        headers=headers,
    )

    assert response.status_code == 409


def test_create_delivery_invoice_not_found_returns_404(client):
    headers = admin_headers(client)
    fake_id = uuid.uuid4()

    response = client.post("/api/v1/deliveries", json={"invoice_id": str(fake_id)}, headers=headers)

    assert response.status_code == 404


def test_create_delivery_without_staff_token_returns_401_or_403(client, db_session):
    headers = admin_headers(client)
    invoice, _, _, _ = create_invoice(client, headers, db_session)

    response = client.post("/api/v1/deliveries", json={"invoice_id": invoice["id"]})

    assert response.status_code in (401, 403)


# ---------- POST /deliveries/{id}/start ----------

def test_start_delivery(client, db_session):
    headers = admin_headers(client)
    invoice, _, driver, _ = create_invoice(client, headers, db_session)
    delivery = client.post(
        "/api/v1/deliveries",
        json={"invoice_id": invoice["id"], "driver_id": driver["id"]},
        headers=headers,
    ).json()

    response = client.post(f"/api/v1/deliveries/{delivery['id']}/start", json={}, headers=headers)

    assert response.status_code == 200
    assert response.json()["status"] == "out_for_delivery"


def test_start_delivery_twice_returns_409(client, db_session):
    headers = admin_headers(client)
    invoice, _, driver, _ = create_invoice(client, headers, db_session)
    delivery = client.post(
        "/api/v1/deliveries",
        json={"invoice_id": invoice["id"], "driver_id": driver["id"]},
        headers=headers,
    ).json()
    client.post(f"/api/v1/deliveries/{delivery['id']}/start", json={}, headers=headers)

    response = client.post(f"/api/v1/deliveries/{delivery['id']}/start", json={}, headers=headers)

    assert response.status_code == 409


def test_start_delivery_not_found_returns_404(client):
    headers = admin_headers(client)
    fake_id = uuid.uuid4()

    response = client.post(f"/api/v1/deliveries/{fake_id}/start", json={}, headers=headers)

    assert response.status_code == 404


# ---------- POST /deliveries/{id}/arrive ----------

def test_mark_arrived(client, db_session):
    headers = admin_headers(client)
    delivery, _, _ = create_started_delivery(client, headers, db_session)

    response = client.post(
        f"/api/v1/deliveries/{delivery['id']}/arrive",
        json={"latitude": 19.1234567, "longitude": 77.1234567},
        headers=headers,
    )

    assert response.status_code == 200
    body = response.json()
    assert float(body["latitude"]) == 19.1234567
    assert body["arrival_time"] is not None


def test_mark_arrived_before_start_returns_409(client, db_session):
    headers = admin_headers(client)
    invoice, _, driver, _ = create_invoice(client, headers, db_session)
    delivery = client.post(
        "/api/v1/deliveries",
        json={"invoice_id": invoice["id"], "driver_id": driver["id"]},
        headers=headers,
    ).json()

    response = client.post(
        f"/api/v1/deliveries/{delivery['id']}/arrive",
        json={"latitude": 19.0, "longitude": 77.0},
        headers=headers,
    )

    assert response.status_code == 409


# ---------- POST /deliveries/{id}/complete ----------

def test_complete_delivery_full_cash_payment_marks_paid(client, db_session):
    headers = admin_headers(client)
    delivery, invoice, order = create_started_delivery(client, headers, db_session, qty=1, price=100.00)
    # subtotal 100 + 18% gst = 118 total
    total = 118.00

    response = client.post(
        f"/api/v1/deliveries/{delivery['id']}/complete",
        json={
            "status": "delivered",
            "latitude": 19.0,
            "longitude": 77.0,
            "cash_received": total,
        },
        headers=headers,
    )

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "delivered"
    assert body["invoice_payment_status"] == "paid"

    db_order = db_session.query(SalesOrder).filter(SalesOrder.id == uuid.UUID(order["id"])).first()
    db_session.refresh(db_order)
    assert db_order.status == "delivered"


def test_complete_delivery_partial_payment(client, db_session):
    headers = admin_headers(client)
    delivery, invoice, _ = create_started_delivery(client, headers, db_session, qty=1, price=100.00)

    response = client.post(
        f"/api/v1/deliveries/{delivery['id']}/complete",
        json={"status": "delivered", "latitude": 19.0, "longitude": 77.0, "cash_received": 50.00},
        headers=headers,
    )

    assert response.status_code == 200
    assert response.json()["invoice_payment_status"] == "partial"


def test_complete_delivery_before_start_returns_409(client, db_session):
    headers = admin_headers(client)
    invoice, _, driver, _ = create_invoice(client, headers, db_session)
    delivery = client.post(
        "/api/v1/deliveries",
        json={"invoice_id": invoice["id"], "driver_id": driver["id"]},
        headers=headers,
    ).json()

    response = client.post(
        f"/api/v1/deliveries/{delivery['id']}/complete",
        json={"status": "delivered", "latitude": 19.0, "longitude": 77.0},
        headers=headers,
    )

    assert response.status_code == 409


# ---------- POST /deliveries/{id}/fail ----------

def test_fail_delivery(client, db_session):
    headers = admin_headers(client)
    delivery, _, _ = create_started_delivery(client, headers, db_session)

    response = client.post(
        f"/api/v1/deliveries/{delivery['id']}/fail",
        json={"reason": "Shop was closed"},
        headers=headers,
    )

    assert response.status_code == 200
    assert response.json()["status"] == "failed"


def test_fail_already_completed_delivery_returns_409(client, db_session):
    headers = admin_headers(client)
    delivery, _, _ = create_started_delivery(client, headers, db_session, qty=1, price=100.00)
    client.post(
        f"/api/v1/deliveries/{delivery['id']}/complete",
        json={"status": "delivered", "latitude": 19.0, "longitude": 77.0, "cash_received": 118.00},
        headers=headers,
    )

    response = client.post(
        f"/api/v1/deliveries/{delivery['id']}/fail", json={"reason": "too late"}, headers=headers
    )

    assert response.status_code == 409


def test_fail_delivery_not_found_returns_404(client):
    headers = admin_headers(client)
    fake_id = uuid.uuid4()

    response = client.post(f"/api/v1/deliveries/{fake_id}/fail", json={"reason": "x"}, headers=headers)

    assert response.status_code == 404
