"""Tests for POST /orders/{id}/invoice and POST /invoices/{id}/cancel.

Per apis_doc.md Section 13, an invoice is generated server-side from an
approved/loaded order - staff-only, one invoice per order.
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
        "sku": "SKU-INV-1",
        "barcode": "8801234500001",
        "name": "Invoice Test Product",
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
        "customer_code": "CUST-INV-1",
        "business_name": "Invoice Test Store",
        "owner_name": "Test Owner",
        "mobile": "9876500011",
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


def create_order(client, headers, db_session, status="approved", **overrides):
    """Creates an order via the API (always starts pending), then flips its
    status directly in the DB - matches the pattern in test_sales_orders.py
    since POST /orders/{id}/approve doesn't exist yet."""
    warehouse = create_warehouse(client, headers)
    salesman = create_user(client)
    route = create_route(client, headers, salesman["id"])
    customer = create_customer(client, headers, route_id=route["id"])
    salesman_headers = user_token_headers(client, salesman)
    product = create_product(client, headers)

    order = client.post(
        "/api/v1/orders",
        json={
            "customer_id": customer["id"],
            "items": [{"product_id": product["id"], "ordered_qty": 2}],
        },
        headers=salesman_headers,
    ).json()

    db_order = db_session.query(SalesOrder).filter(SalesOrder.id == uuid.UUID(order["id"])).first()
    db_order.status = status
    db_session.commit()

    return order, customer, warehouse


# ---------- POST /orders/{id}/invoice ----------

def test_generate_invoice_from_approved_order(client, db_session):
    headers = admin_headers(client)
    order, customer, _ = create_order(client, headers, db_session, status="approved")

    response = client.post(f"/api/v1/orders/{order['id']}/invoice", headers=headers)

    assert response.status_code == 201
    body = response.json()
    assert body["sales_order_id"] == order["id"]
    assert body["place_of_supply"] == "Maharashtra"
    assert float(body["total"]) == float(order["total"])
    assert body["payment_status"] == "unpaid"
    assert body["tally_sync_status"] == "pending"


def test_generate_invoice_from_loaded_order(client, db_session):
    headers = admin_headers(client)
    order, _, _ = create_order(client, headers, db_session, status="loaded")

    response = client.post(f"/api/v1/orders/{order['id']}/invoice", headers=headers)

    assert response.status_code == 201


def test_generate_invoice_from_pending_order_returns_409(client, db_session):
    headers = admin_headers(client)
    order, _, _ = create_order(client, headers, db_session, status="pending")

    response = client.post(f"/api/v1/orders/{order['id']}/invoice", headers=headers)

    assert response.status_code == 409


def test_generate_invoice_twice_returns_409(client, db_session):
    headers = admin_headers(client)
    order, _, _ = create_order(client, headers, db_session, status="approved")
    client.post(f"/api/v1/orders/{order['id']}/invoice", headers=headers)

    response = client.post(f"/api/v1/orders/{order['id']}/invoice", headers=headers)

    assert response.status_code == 409


def test_generate_invoice_order_not_found_returns_404(client):
    headers = admin_headers(client)
    fake_id = uuid.uuid4()

    response = client.post(f"/api/v1/orders/{fake_id}/invoice", headers=headers)

    assert response.status_code == 404


def test_generate_invoice_customer_token_returns_403(client, db_session):
    headers = admin_headers(client)
    order, _, _ = create_order(client, headers, db_session, status="approved")
    customer_headers = customer_login_headers(client, "9876500011")

    response = client.post(f"/api/v1/orders/{order['id']}/invoice", headers=customer_headers)

    assert response.status_code == 403


def test_generate_invoice_without_token_returns_401_or_403(client, db_session):
    headers = admin_headers(client)
    order, _, _ = create_order(client, headers, db_session, status="approved")

    response = client.post(f"/api/v1/orders/{order['id']}/invoice")

    assert response.status_code in (401, 403)


# ---------- POST /invoices/{id}/cancel ----------

def test_cancel_unpaid_invoice(client, db_session):
    headers = admin_headers(client)
    order, _, _ = create_order(client, headers, db_session, status="approved")
    invoice = client.post(f"/api/v1/orders/{order['id']}/invoice", headers=headers).json()

    response = client.post(
        f"/api/v1/invoices/{invoice['id']}/cancel",
        json={"reason": "Order was placed in error"},
        headers=headers,
    )

    assert response.status_code == 200
    assert response.json()["status"] == "cancelled"


def test_cancel_paid_invoice_returns_409(client, db_session):
    from app.models.invoice import Invoice

    headers = admin_headers(client)
    order, _, _ = create_order(client, headers, db_session, status="approved")
    invoice = client.post(f"/api/v1/orders/{order['id']}/invoice", headers=headers).json()

    db_invoice = db_session.query(Invoice).filter(Invoice.id == uuid.UUID(invoice["id"])).first()
    db_invoice.payment_status = "paid"
    db_session.commit()

    response = client.post(
        f"/api/v1/invoices/{invoice['id']}/cancel", json={"reason": "too late"}, headers=headers
    )

    assert response.status_code == 409


def test_cancel_invoice_not_found_returns_404(client):
    headers = admin_headers(client)
    fake_id = uuid.uuid4()

    response = client.post(
        f"/api/v1/invoices/{fake_id}/cancel", json={"reason": "nobody"}, headers=headers
    )

    assert response.status_code == 404


def test_cancel_invoice_without_staff_token_returns_401_or_403(client, db_session):
    headers = admin_headers(client)
    order, _, _ = create_order(client, headers, db_session, status="approved")
    invoice = client.post(f"/api/v1/orders/{order['id']}/invoice", headers=headers).json()

    response = client.post(
        f"/api/v1/invoices/{invoice['id']}/cancel", json={"reason": "no auth"}
    )

    assert response.status_code in (401, 403)
