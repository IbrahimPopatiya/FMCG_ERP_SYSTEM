"""Tests for POST /returns, /approve, /reject, /complete, and the credit
notes /approve, /reject that /complete auto-creates.

Per apis_doc.md Section 16, returns are staff-only. Each return item carries
its own reason (damaged/expired/wrong_item/not_needed), and completing a
return writes one stock movement per item AND creates a pending credit note
valued at the original order price, approved by the customer's route salesman
(or an admin).
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
        "sku": "SKU-RET-1",
        "barcode": "8801234800001",
        "name": "Return Test Product",
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
        "customer_code": "CUST-RET-1",
        "business_name": "Return Test Store",
        "owner_name": "Test Owner",
        "mobile": "9876500044",
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


def setup_return_fixture(client, headers, db_session):
    """Creates a warehouse, salesman, route, customer, two products, an
    order for both (qty 2 each), approves it, generates the invoice.
    Returns (invoice, order, customer, warehouse, salesman, salesman_headers,
    product_a, product_b). product_a selling_price=100, product_b=50."""
    warehouse = create_warehouse(client, headers)
    salesman = create_user(client)
    route = create_route(client, headers, salesman["id"])
    customer = create_customer(client, headers, route_id=route["id"])
    salesman_headers = user_token_headers(client, salesman)

    product_a = create_product(
        client, headers, sku="SKU-RET-A", barcode="8801234800010", selling_price=100.00
    )
    product_b = create_product(
        client, headers, sku="SKU-RET-B", barcode="8801234800011", selling_price=50.00
    )

    order = client.post(
        "/api/v1/orders",
        json={
            "customer_id": customer["id"],
            "items": [
                {"product_id": product_a["id"], "ordered_qty": 2},
                {"product_id": product_b["id"], "ordered_qty": 2},
            ],
        },
        headers=salesman_headers,
    ).json()

    db_order = db_session.query(SalesOrder).filter(SalesOrder.id == uuid.UUID(order["id"])).first()
    db_order.status = "approved"
    db_session.commit()

    invoice = client.post(f"/api/v1/orders/{order['id']}/invoice", headers=headers).json()

    return invoice, order, customer, warehouse, salesman, salesman_headers, product_a, product_b


def create_mixed_return(client, headers, db_session, approve=True):
    (
        invoice, order, customer, warehouse, salesman, salesman_headers, product_a, product_b,
    ) = setup_return_fixture(client, headers, db_session)

    ret = client.post(
        "/api/v1/returns",
        json={
            "invoice_id": invoice["id"],
            "warehouse_id": warehouse["id"],
            "reason": "damaged",
            "items": [
                {"product_id": product_a["id"], "quantity": 1, "reason": "damaged"},
                {"product_id": product_b["id"], "quantity": 1, "reason": "not_needed"},
            ],
        },
        headers=headers,
    ).json()

    if approve:
        client.post(f"/api/v1/returns/{ret['id']}/approve", headers=headers)

    return ret, invoice, order, customer, warehouse, salesman, salesman_headers, product_a, product_b


# ---------- POST /returns ----------

def test_create_return_with_mixed_reasons_returns_201(client, db_session):
    headers = admin_headers(client)
    ret, *_ = create_mixed_return(client, headers, db_session, approve=False)

    assert ret["status"] == "requested"
    assert len(ret["items"]) == 2


def test_create_return_invoice_not_found_returns_404(client):
    headers = admin_headers(client)
    fake_id = uuid.uuid4()

    response = client.post(
        "/api/v1/returns",
        json={
            "invoice_id": str(fake_id),
            "warehouse_id": str(uuid.uuid4()),
            "reason": "damaged",
            "items": [],
        },
        headers=headers,
    )

    assert response.status_code == 404


def test_create_return_without_staff_token_returns_401_or_403(client, db_session):
    headers = admin_headers(client)
    invoice, _, _, warehouse, _, _, product_a, _ = setup_return_fixture(client, headers, db_session)

    response = client.post(
        "/api/v1/returns",
        json={
            "invoice_id": invoice["id"],
            "warehouse_id": warehouse["id"],
            "reason": "damaged",
            "items": [{"product_id": product_a["id"], "quantity": 1, "reason": "damaged"}],
        },
    )

    assert response.status_code in (401, 403)


# ---------- POST /returns/{id}/approve, /reject ----------

def test_approve_requested_return(client, db_session):
    headers = admin_headers(client)
    ret, *_ = create_mixed_return(client, headers, db_session, approve=False)

    response = client.post(f"/api/v1/returns/{ret['id']}/approve", headers=headers)

    assert response.status_code == 200
    assert response.json()["status"] == "approved"


def test_approve_already_approved_return_returns_409(client, db_session):
    headers = admin_headers(client)
    ret, *_ = create_mixed_return(client, headers, db_session, approve=True)

    response = client.post(f"/api/v1/returns/{ret['id']}/approve", headers=headers)

    assert response.status_code == 409


def test_reject_requested_return(client, db_session):
    headers = admin_headers(client)
    ret, *_ = create_mixed_return(client, headers, db_session, approve=False)

    response = client.post(
        f"/api/v1/returns/{ret['id']}/reject",
        json={"reason": "No proof of damage"},
        headers=headers,
    )

    assert response.status_code == 200
    assert response.json()["status"] == "rejected"


def test_reject_approved_return_returns_409(client, db_session):
    headers = admin_headers(client)
    ret, *_ = create_mixed_return(client, headers, db_session, approve=True)

    response = client.post(
        f"/api/v1/returns/{ret['id']}/reject", json={"reason": "x"}, headers=headers
    )

    assert response.status_code == 409


# ---------- POST /returns/{id}/complete ----------

def test_complete_return_writes_per_item_movements_and_credit_note(client, db_session):
    from app.models.inventory import Inventory
    from app.models.credit_note import CreditNote

    headers = admin_headers(client)
    ret, invoice, order, customer, warehouse, salesman, salesman_headers, product_a, product_b = (
        create_mixed_return(client, headers, db_session, approve=True)
    )

    response = client.post(f"/api/v1/returns/{ret['id']}/complete", headers=headers)

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "completed"
    assert body["movements_created"] == 2

    inv_a = db_session.query(Inventory).filter(
        Inventory.warehouse_id == uuid.UUID(warehouse["id"]),
        Inventory.product_id == uuid.UUID(product_a["id"]),
    ).first()
    assert inv_a.damaged_stock == 1

    inv_b = db_session.query(Inventory).filter(
        Inventory.warehouse_id == uuid.UUID(warehouse["id"]),
        Inventory.product_id == uuid.UUID(product_b["id"]),
    ).first()
    assert inv_b.physical_stock == 1

    credit_note = db_session.query(CreditNote).filter(
        CreditNote.id == uuid.UUID(body["credit_note_id"])
    ).first()
    # product_a: 1 * 100 + product_b: 1 * 50 = 150
    assert float(credit_note.amount) == 150.00
    assert credit_note.status == "pending"


def test_complete_still_requested_return_returns_409(client, db_session):
    headers = admin_headers(client)
    ret, *_ = create_mixed_return(client, headers, db_session, approve=False)

    response = client.post(f"/api/v1/returns/{ret['id']}/complete", headers=headers)

    assert response.status_code == 409


def test_complete_return_not_found_returns_404(client):
    headers = admin_headers(client)
    fake_id = uuid.uuid4()

    response = client.post(f"/api/v1/returns/{fake_id}/complete", headers=headers)

    assert response.status_code == 404


# ---------- POST /credit-notes/{id}/approve, /reject ----------

def complete_return_and_get_credit_note_id(client, headers, db_session):
    ret, invoice, order, customer, warehouse, salesman, salesman_headers, product_a, product_b = (
        create_mixed_return(client, headers, db_session, approve=True)
    )
    body = client.post(f"/api/v1/returns/{ret['id']}/complete", headers=headers).json()
    return body["credit_note_id"], customer, salesman, salesman_headers


def test_route_salesman_can_approve_credit_note(client, db_session):
    headers = admin_headers(client)
    credit_note_id, _, _, salesman_headers = complete_return_and_get_credit_note_id(
        client, headers, db_session
    )

    response = client.post(f"/api/v1/credit-notes/{credit_note_id}/approve", headers=salesman_headers)

    assert response.status_code == 200
    assert response.json()["status"] == "approved"


def test_unrelated_salesman_cannot_approve_credit_note(client, db_session):
    headers = admin_headers(client)
    credit_note_id, _, _, _ = complete_return_and_get_credit_note_id(client, headers, db_session)
    other_salesman = create_user(
        client, mobile="9222255566", email="other.salesman@example.com"
    )
    other_headers = user_token_headers(client, other_salesman)

    response = client.post(f"/api/v1/credit-notes/{credit_note_id}/approve", headers=other_headers)

    assert response.status_code == 403


def test_admin_can_approve_credit_note(client, db_session):
    headers = admin_headers(client)
    credit_note_id, _, _, _ = complete_return_and_get_credit_note_id(client, headers, db_session)

    response = client.post(f"/api/v1/credit-notes/{credit_note_id}/approve", headers=headers)

    assert response.status_code == 200
    assert response.json()["status"] == "approved"


def test_approve_already_approved_credit_note_returns_409(client, db_session):
    headers = admin_headers(client)
    credit_note_id, _, _, salesman_headers = complete_return_and_get_credit_note_id(
        client, headers, db_session
    )
    client.post(f"/api/v1/credit-notes/{credit_note_id}/approve", headers=salesman_headers)

    response = client.post(f"/api/v1/credit-notes/{credit_note_id}/approve", headers=salesman_headers)

    assert response.status_code == 409


def test_credit_note_not_found_returns_404(client):
    headers = admin_headers(client)
    fake_id = uuid.uuid4()

    response = client.post(f"/api/v1/credit-notes/{fake_id}/approve", headers=headers)

    assert response.status_code == 404


def test_reject_credit_note_by_route_salesman(client, db_session):
    headers = admin_headers(client)
    credit_note_id, _, _, salesman_headers = complete_return_and_get_credit_note_id(
        client, headers, db_session
    )

    response = client.post(f"/api/v1/credit-notes/{credit_note_id}/reject", headers=salesman_headers)

    assert response.status_code == 200
    assert response.json()["status"] == "rejected"
