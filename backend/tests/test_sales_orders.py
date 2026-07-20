"""Tests for POST/PATCH/DELETE /orders - shared by staff (on behalf of a
customer on their route) and customers (self-ordering), per api_reference.md
Sections 10 and 19.
"""

import uuid

from app.core.security import create_access_token


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
        "sku": "SKU-ORD-1",
        "barcode": "8801234567890",
        "name": "Order Test Product",
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
        "customer_code": "CUST-ORD-1",
        "business_name": "Order Test Store",
        "owner_name": "Test Owner",
        "mobile": "9876566666",
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


def setup_salesman_and_customer(client, headers, customer_state="Maharashtra"):
    """Creates a warehouse, a salesman, a route the salesman owns, and a
    customer on that route. Returns (salesman_headers, customer, warehouse)."""
    warehouse = create_warehouse(client, headers)
    salesman = create_user(client)
    route = create_route(client, headers, salesman["id"])
    customer = create_customer(client, headers, route_id=route["id"], state=customer_state)
    salesman_headers = user_token_headers(client, salesman)
    return salesman_headers, customer, warehouse


# ---------- POST /orders (staff, on behalf of a customer) ----------

def test_salesman_creates_order_same_state_applies_cgst_sgst(client):
    headers = admin_headers(client)
    salesman_headers, customer, _ = setup_salesman_and_customer(client, headers)
    product = create_product(client, headers)

    response = client.post(
        "/api/v1/orders",
        json={
            "customer_id": customer["id"],
            "items": [{"product_id": product["id"], "ordered_qty": 2}],
        },
        headers=salesman_headers,
    )

    assert response.status_code == 201
    body = response.json()
    assert body["order_source"] == "salesman"
    assert body["status"] == "pending"
    assert float(body["igst"]) == 0
    assert float(body["cgst"]) > 0
    assert float(body["sgst"]) > 0
    # subtotal = 100 * 2 = 200, gst 18% = 36, cgst+sgst = 18 each
    assert float(body["subtotal"]) == 200.00
    assert float(body["cgst"]) == 18.00
    assert float(body["sgst"]) == 18.00
    assert float(body["total"]) == 236.00


def test_salesman_creates_order_different_state_applies_igst(client):
    headers = admin_headers(client)
    salesman_headers, customer, _ = setup_salesman_and_customer(
        client, headers, customer_state="Karnataka"
    )
    product = create_product(client, headers, sku="SKU-ORD-2", barcode="8801234567891")

    response = client.post(
        "/api/v1/orders",
        json={
            "customer_id": customer["id"],
            "items": [{"product_id": product["id"], "ordered_qty": 1}],
        },
        headers=salesman_headers,
    )

    assert response.status_code == 201
    body = response.json()
    assert float(body["cgst"]) == 0
    assert float(body["sgst"]) == 0
    assert float(body["igst"]) == 18.00


def test_salesman_creates_order_for_customer_outside_route_returns_403(client):
    headers = admin_headers(client)
    salesman_headers, _, _ = setup_salesman_and_customer(client, headers)
    product = create_product(client, headers, sku="SKU-ORD-3", barcode="8801234567892")
    # a second customer with no route at all
    other_customer = create_customer(
        client, headers, mobile="9876577777", customer_code="CUST-ORD-OUTSIDE"
    )

    response = client.post(
        "/api/v1/orders",
        json={
            "customer_id": other_customer["id"],
            "items": [{"product_id": product["id"], "ordered_qty": 1}],
        },
        headers=salesman_headers,
    )

    assert response.status_code == 403


def test_create_order_without_warehouse_returns_409(client):
    headers = admin_headers(client)
    salesman = create_user(client)
    route = create_route(client, headers, salesman["id"])
    customer = create_customer(client, headers, route_id=route["id"])
    salesman_headers = user_token_headers(client, salesman)
    product = create_product(client, headers, sku="SKU-ORD-4", barcode="8801234567893")

    response = client.post(
        "/api/v1/orders",
        json={
            "customer_id": customer["id"],
            "items": [{"product_id": product["id"], "ordered_qty": 1}],
        },
        headers=salesman_headers,
    )

    assert response.status_code == 409


# ---------- POST /orders (customer self-ordering) ----------

def test_customer_creates_own_order(client):
    headers = admin_headers(client)
    create_warehouse(client, headers)
    product = create_product(client, headers, sku="SKU-ORD-5", barcode="8801234567894")
    customer = create_customer(client, headers, mobile="9876588888")
    customer_headers = customer_login_headers(client, "9876588888")

    response = client.post(
        "/api/v1/orders",
        json={"items": [{"product_id": product["id"], "ordered_qty": 3}]},
        headers=customer_headers,
    )

    assert response.status_code == 201
    body = response.json()
    assert body["order_source"] == "customer"
    assert body["salesman_id"] is None
    assert body["customer_id"] == customer["id"]


def test_customer_supplied_customer_id_is_ignored(client):
    headers = admin_headers(client)
    create_warehouse(client, headers)
    product = create_product(client, headers, sku="SKU-ORD-6", barcode="8801234567895")
    customer = create_customer(client, headers, mobile="9876599999")
    other_customer = create_customer(client, headers, mobile="9876500001", customer_code="CUST-OTHER")
    customer_headers = customer_login_headers(client, "9876599999")

    response = client.post(
        "/api/v1/orders",
        json={
            "customer_id": other_customer["id"],
            "items": [{"product_id": product["id"], "ordered_qty": 1}],
        },
        headers=customer_headers,
    )

    assert response.status_code == 201
    assert response.json()["customer_id"] == customer["id"]


# ---------- PATCH /orders/{id} ----------

def test_customer_edits_own_pending_order(client):
    headers = admin_headers(client)
    create_warehouse(client, headers)
    product = create_product(client, headers, sku="SKU-ORD-7", barcode="8801234567896")
    create_customer(client, headers, mobile="9876511122")
    customer_headers = customer_login_headers(client, "9876511122")
    order = client.post(
        "/api/v1/orders",
        json={"items": [{"product_id": product["id"], "ordered_qty": 1}]},
        headers=customer_headers,
    ).json()

    response = client.patch(
        f"/api/v1/orders/{order['id']}",
        json={"remarks": "Please deliver in the evening"},
        headers=customer_headers,
    )

    assert response.status_code == 200
    assert response.json()["remarks"] == "Please deliver in the evening"


def test_customer_cannot_edit_another_customers_order(client):
    headers = admin_headers(client)
    create_warehouse(client, headers)
    product = create_product(client, headers, sku="SKU-ORD-8", barcode="8801234567897")
    create_customer(client, headers, mobile="9876522233")
    create_customer(client, headers, mobile="9876533344", customer_code="CUST-OTHER-2")
    owner_headers = customer_login_headers(client, "9876522233")
    intruder_headers = customer_login_headers(client, "9876533344")
    order = client.post(
        "/api/v1/orders",
        json={"items": [{"product_id": product["id"], "ordered_qty": 1}]},
        headers=owner_headers,
    ).json()

    response = client.patch(
        f"/api/v1/orders/{order['id']}", json={"remarks": "hijack"}, headers=intruder_headers
    )

    assert response.status_code == 404


def test_edit_non_pending_order_returns_409(client, db_session):
    from app.models.sales_order import SalesOrder

    headers = admin_headers(client)
    create_warehouse(client, headers)
    product = create_product(client, headers, sku="SKU-ORD-9", barcode="8801234567898")
    create_customer(client, headers, mobile="9876544455")
    customer_headers = customer_login_headers(client, "9876544455")
    order = client.post(
        "/api/v1/orders",
        json={"items": [{"product_id": product["id"], "ordered_qty": 1}]},
        headers=customer_headers,
    ).json()

    db_order = db_session.query(SalesOrder).filter(SalesOrder.id == uuid.UUID(order["id"])).first()
    db_order.status = "approved"
    db_session.commit()

    response = client.patch(
        f"/api/v1/orders/{order['id']}", json={"remarks": "too late"}, headers=customer_headers
    )

    assert response.status_code == 409


def test_edit_order_not_found_returns_404(client):
    headers = admin_headers(client)
    create_warehouse(client, headers)
    create_customer(client, headers, mobile="9876555566")
    customer_headers = customer_login_headers(client, "9876555566")
    fake_id = uuid.uuid4()

    response = client.patch(
        f"/api/v1/orders/{fake_id}", json={"remarks": "nobody"}, headers=customer_headers
    )

    assert response.status_code == 404


# ---------- POST /orders/{id}/cancel ----------

def test_customer_cancels_own_pending_order(client):
    headers = admin_headers(client)
    create_warehouse(client, headers)
    product = create_product(client, headers, sku="SKU-ORD-10", barcode="8801234567899")
    create_customer(client, headers, mobile="9876566677")
    customer_headers = customer_login_headers(client, "9876566677")
    order = client.post(
        "/api/v1/orders",
        json={"items": [{"product_id": product["id"], "ordered_qty": 1}]},
        headers=customer_headers,
    ).json()

    response = client.post(f"/api/v1/orders/{order['id']}/cancel", headers=customer_headers)

    assert response.status_code == 200
    assert response.json()["status"] == "cancelled"


def test_cancel_non_pending_order_returns_409(client, db_session):
    from app.models.sales_order import SalesOrder

    headers = admin_headers(client)
    create_warehouse(client, headers)
    product = create_product(client, headers, sku="SKU-ORD-11", barcode="8801234567900")
    create_customer(client, headers, mobile="9876577788")
    customer_headers = customer_login_headers(client, "9876577788")
    order = client.post(
        "/api/v1/orders",
        json={"items": [{"product_id": product["id"], "ordered_qty": 1}]},
        headers=customer_headers,
    ).json()

    db_order = db_session.query(SalesOrder).filter(SalesOrder.id == uuid.UUID(order["id"])).first()
    db_order.status = "delivered"
    db_session.commit()

    response = client.post(f"/api/v1/orders/{order['id']}/cancel", headers=customer_headers)

    assert response.status_code == 409


def test_cancel_order_not_found_returns_404(client):
    headers = admin_headers(client)
    create_warehouse(client, headers)
    create_customer(client, headers, mobile="9876588899")
    customer_headers = customer_login_headers(client, "9876588899")
    fake_id = uuid.uuid4()

    response = client.post(f"/api/v1/orders/{fake_id}/cancel", headers=customer_headers)

    assert response.status_code == 404


# ---------- GET /orders ----------

def test_customer_lists_only_own_orders(client):
    headers = admin_headers(client)
    create_warehouse(client, headers)
    product = create_product(client, headers, sku="SKU-ORD-12", barcode="8801234567901")
    create_customer(client, headers, mobile="9876599900")
    create_customer(client, headers, mobile="9876511100", customer_code="CUST-OTHER-3")
    mine_headers = customer_login_headers(client, "9876599900")
    other_headers = customer_login_headers(client, "9876511100")
    client.post(
        "/api/v1/orders",
        json={"items": [{"product_id": product["id"], "ordered_qty": 1}]},
        headers=mine_headers,
    )
    client.post(
        "/api/v1/orders",
        json={"items": [{"product_id": product["id"], "ordered_qty": 1}]},
        headers=other_headers,
    )

    response = client.get("/api/v1/orders", headers=mine_headers)

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["order_source"] == "customer"


def test_create_order_without_token_returns_401_or_403(client):
    response = client.post("/api/v1/orders", json={"items": []})

    assert response.status_code in (401, 403)
