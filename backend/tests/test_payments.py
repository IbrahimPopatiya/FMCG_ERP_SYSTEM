"""Tests for POST /payments, /verify, /bounce.

Per api_reference.md Section 15, a payment is recorded pending and must be
explicitly verified (cleared) or bounced - staff-only. Verifying recomputes
the invoice's payment_status (app/services/invoice.py::recompute_payment_status).
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
        "sku": "SKU-PAY-1",
        "barcode": "8801234700001",
        "name": "Payment Test Product",
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
        "customer_code": "CUST-PAY-1",
        "business_name": "Payment Test Store",
        "owner_name": "Test Owner",
        "mobile": "9876500033",
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
    """Creates an order (flipped to approved) and generates its invoice.
    Returns (invoice, order). subtotal=price*qty, +18% gst -> total."""
    create_warehouse(client, headers)
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
    return invoice, order


# ---------- POST /payments ----------

def test_record_payment_returns_pending(client, db_session):
    headers = admin_headers(client)
    invoice, _ = create_invoice(client, headers, db_session)

    response = client.post(
        "/api/v1/payments",
        json={"invoice_id": invoice["id"], "cash_amount": 50.00, "upi_amount": 20.00},
        headers=headers,
    )

    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "pending"
    assert float(body["total_amount"]) == 70.00


def test_record_payment_all_zero_amounts_returns_422(client, db_session):
    headers = admin_headers(client)
    invoice, _ = create_invoice(client, headers, db_session)

    response = client.post(
        "/api/v1/payments", json={"invoice_id": invoice["id"]}, headers=headers
    )

    assert response.status_code == 422


def test_record_payment_invoice_not_found_returns_404(client):
    headers = admin_headers(client)
    fake_id = uuid.uuid4()

    response = client.post(
        "/api/v1/payments",
        json={"invoice_id": str(fake_id), "cash_amount": 10.00},
        headers=headers,
    )

    assert response.status_code == 404


def test_record_payment_without_staff_token_returns_401_or_403(client, db_session):
    headers = admin_headers(client)
    invoice, _ = create_invoice(client, headers, db_session)

    response = client.post(
        "/api/v1/payments", json={"invoice_id": invoice["id"], "cash_amount": 10.00}
    )

    assert response.status_code in (401, 403)


# ---------- POST /payments/{id}/verify ----------

def test_verify_pending_payment_clears_it_and_updates_invoice(client, db_session):
    headers = admin_headers(client)
    # subtotal 100 + 18% gst = 118 total
    invoice, _ = create_invoice(client, headers, db_session, qty=1, price=100.00)
    payment = client.post(
        "/api/v1/payments",
        json={"invoice_id": invoice["id"], "cash_amount": 118.00},
        headers=headers,
    ).json()

    response = client.post(f"/api/v1/payments/{payment['id']}/verify", headers=headers)

    assert response.status_code == 200
    assert response.json()["status"] == "cleared"

    from app.models.invoice import Invoice

    db_invoice = db_session.query(Invoice).filter(Invoice.id == uuid.UUID(invoice["id"])).first()
    db_session.refresh(db_invoice)
    assert db_invoice.payment_status == "paid"


def test_verify_already_cleared_payment_returns_409(client, db_session):
    headers = admin_headers(client)
    invoice, _ = create_invoice(client, headers, db_session)
    payment = client.post(
        "/api/v1/payments",
        json={"invoice_id": invoice["id"], "cash_amount": 50.00},
        headers=headers,
    ).json()
    client.post(f"/api/v1/payments/{payment['id']}/verify", headers=headers)

    response = client.post(f"/api/v1/payments/{payment['id']}/verify", headers=headers)

    assert response.status_code == 409


def test_verify_payment_not_found_returns_404(client):
    headers = admin_headers(client)
    fake_id = uuid.uuid4()

    response = client.post(f"/api/v1/payments/{fake_id}/verify", headers=headers)

    assert response.status_code == 404


def test_verify_payment_without_staff_token_returns_401_or_403(client, db_session):
    headers = admin_headers(client)
    invoice, _ = create_invoice(client, headers, db_session)
    payment = client.post(
        "/api/v1/payments",
        json={"invoice_id": invoice["id"], "cash_amount": 50.00},
        headers=headers,
    ).json()

    response = client.post(f"/api/v1/payments/{payment['id']}/verify")

    assert response.status_code in (401, 403)


# ---------- POST /payments/{id}/bounce ----------

def test_bounce_pending_payment(client, db_session):
    headers = admin_headers(client)
    invoice, _ = create_invoice(client, headers, db_session)
    payment = client.post(
        "/api/v1/payments",
        json={"invoice_id": invoice["id"], "cheque_amount": 50.00},
        headers=headers,
    ).json()

    response = client.post(
        f"/api/v1/payments/{payment['id']}/bounce",
        json={"reason": "Insufficient funds"},
        headers=headers,
    )

    assert response.status_code == 200
    assert response.json()["status"] == "bounced"


def test_bounce_already_bounced_payment_returns_409(client, db_session):
    headers = admin_headers(client)
    invoice, _ = create_invoice(client, headers, db_session)
    payment = client.post(
        "/api/v1/payments",
        json={"invoice_id": invoice["id"], "cheque_amount": 50.00},
        headers=headers,
    ).json()
    client.post(
        f"/api/v1/payments/{payment['id']}/bounce", json={"reason": "x"}, headers=headers
    )

    response = client.post(
        f"/api/v1/payments/{payment['id']}/bounce", json={"reason": "again"}, headers=headers
    )

    assert response.status_code == 409


def test_bounce_cleared_payment_returns_409(client, db_session):
    headers = admin_headers(client)
    invoice, _ = create_invoice(client, headers, db_session)
    payment = client.post(
        "/api/v1/payments",
        json={"invoice_id": invoice["id"], "cash_amount": 50.00},
        headers=headers,
    ).json()
    client.post(f"/api/v1/payments/{payment['id']}/verify", headers=headers)

    response = client.post(
        f"/api/v1/payments/{payment['id']}/bounce", json={"reason": "x"}, headers=headers
    )

    assert response.status_code == 409


def test_bounce_payment_not_found_returns_404(client):
    headers = admin_headers(client)
    fake_id = uuid.uuid4()

    response = client.post(
        f"/api/v1/payments/{fake_id}/bounce", json={"reason": "x"}, headers=headers
    )

    assert response.status_code == 404


def test_bounce_payment_without_staff_token_returns_401_or_403(client, db_session):
    headers = admin_headers(client)
    invoice, _ = create_invoice(client, headers, db_session)
    payment = client.post(
        "/api/v1/payments",
        json={"invoice_id": invoice["id"], "cheque_amount": 50.00},
        headers=headers,
    ).json()

    response = client.post(
        f"/api/v1/payments/{payment['id']}/bounce", json={"reason": "x"}
    )

    assert response.status_code in (401, 403)
