"""Tests for the Loading Supervisor trip workflow: POST/GET /trips,
GET /trips/loadable-orders, POST /trips/{id}/start, /complete, /cancel.
"""


def admin_headers(client):
    admin = client.post(
        "/api/v1/users",
        json={
            "full_name": "Admin Tester",
            "mobile": "9000022222",
            "email": "admin.trips@example.com",
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


def create_user(client, **overrides):
    payload = {
        "full_name": "Trip Tester",
        "mobile": "9111122222",
        "email": "salesman.trips@example.com",
        "password": "secret123",
        "role": "salesman",
    }
    payload.update(overrides)
    return client.post("/api/v1/users", json=payload).json()


def create_warehouse(client, headers):
    return client.post(
        "/api/v1/warehouses",
        json={"name": "Main Warehouse", "address": "Plot 1", "state": "Maharashtra"},
        headers=headers,
    ).json()


def create_product(client, headers, **overrides):
    payload = {
        "sku": "SKU-TRIP-1",
        "barcode": "8801234500001",
        "name": "Trip Test Product",
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
        "/api/v1/routes", json={"name": "Trip Route", "salesman_id": salesman_id}, headers=headers
    ).json()


def create_customer(client, headers, route_id=None, **overrides):
    payload = {
        "customer_code": "CUST-TRIP-1",
        "business_name": "Trip Test Store",
        "owner_name": "Test Owner",
        "mobile": "9876500001",
        "address": "Shop 1",
        "city": "Pune",
        "state": "Maharashtra",
        "pincode": "411001",
        "credit_limit": 10000.00,
        "payment_terms": 15,
        "route_id": route_id,
        "password": "customerpass123",
    }
    payload.update(overrides)
    return client.post("/api/v1/customers", json=payload, headers=headers).json()


def create_vehicle(client, headers, **overrides):
    payload = {"vehicle_number": "MH12TR1234", "capacity": 100.00}
    payload.update(overrides)
    return client.post("/api/v1/vehicles", json=payload, headers=headers).json()


def create_approved_order(client, headers, salesman_headers, customer, product, qty=5):
    order = client.post(
        "/api/v1/orders",
        json={"customer_id": customer["id"], "items": [{"product_id": product["id"], "ordered_qty": qty}]},
        headers=salesman_headers,
    ).json()
    item_id = order["items"][0]["id"]
    client.post(
        f"/api/v1/orders/{order['id']}/approve",
        json={"items": [{"item_id": item_id, "approved_qty": qty}]},
        headers=headers,
    )
    return order


def setup_trip_fixtures(client, qty=5):
    headers = admin_headers(client)
    warehouse = create_warehouse(client, headers)
    salesman = create_user(client)
    route = create_route(client, headers, salesman["id"])
    customer = create_customer(client, headers, route_id=route["id"])
    salesman_headers = user_token_headers(client, salesman)
    product = create_product(client, headers)
    order = create_approved_order(client, headers, salesman_headers, customer, product, qty=qty)
    driver = create_user(
        client, full_name="Driver One", mobile="9222233333", email="driver.trips@example.com", role="driver"
    )
    vehicle = create_vehicle(client, headers)
    return headers, order, driver, vehicle, warehouse


# ---------- GET /trips/loadable-orders ----------

def test_loadable_orders_lists_approved_order(client):
    headers, order, _, _, _ = setup_trip_fixtures(client)

    response = client.get("/api/v1/trips/loadable-orders", headers=headers)

    assert response.status_code == 200
    ids = [o["id"] for o in response.json()]
    assert order["id"] in ids
    matching = next(o for o in response.json() if o["id"] == order["id"])
    assert float(matching["lc_value"]) == 5.0


# ---------- POST /trips ----------

def test_create_trip_returns_201(client):
    headers, order, driver, vehicle, _ = setup_trip_fixtures(client)

    response = client.post(
        "/api/v1/trips",
        json={"vehicle_id": vehicle["id"], "driver_id": driver["id"], "order_ids": [order["id"]]},
        headers=headers,
    )

    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "pending"
    assert float(body["total_lc"]) == 5.0
    assert body["orders"][0]["order_number"] == order["order_number"]


def test_create_trip_removes_order_from_loadable_pool(client):
    headers, order, driver, vehicle, _ = setup_trip_fixtures(client)
    client.post(
        "/api/v1/trips",
        json={"vehicle_id": vehicle["id"], "driver_id": driver["id"], "order_ids": [order["id"]]},
        headers=headers,
    )

    response = client.get("/api/v1/trips/loadable-orders", headers=headers)

    ids = [o["id"] for o in response.json()]
    assert order["id"] not in ids


def test_create_trip_exceeding_capacity_returns_409(client):
    headers, order, driver, vehicle, _ = setup_trip_fixtures(client, qty=500)

    response = client.post(
        "/api/v1/trips",
        json={"vehicle_id": vehicle["id"], "driver_id": driver["id"], "order_ids": [order["id"]]},
        headers=headers,
    )

    assert response.status_code == 409


def test_create_trip_with_non_driver_user_returns_404(client):
    headers, order, _, vehicle, _ = setup_trip_fixtures(client)
    non_driver = create_user(
        client, full_name="Not Driver", mobile="9333344444", email="notdriver.trips@example.com", role="salesman"
    )

    response = client.post(
        "/api/v1/trips",
        json={"vehicle_id": vehicle["id"], "driver_id": non_driver["id"], "order_ids": [order["id"]]},
        headers=headers,
    )

    assert response.status_code == 404


# ---------- start / complete / cancel ----------

def test_start_and_complete_trip_flow(client):
    headers, order, driver, vehicle, _ = setup_trip_fixtures(client)
    trip = client.post(
        "/api/v1/trips",
        json={"vehicle_id": vehicle["id"], "driver_id": driver["id"], "order_ids": [order["id"]]},
        headers=headers,
    ).json()

    start_response = client.post(f"/api/v1/trips/{trip['id']}/start", headers=headers)
    assert start_response.status_code == 200
    assert start_response.json()["status"] == "loading"

    # Completing before the order is actually loaded should fail.
    early_complete = client.post(f"/api/v1/trips/{trip['id']}/complete", headers=headers)
    assert early_complete.status_code == 409

    item_id = order["items"][0]["id"]
    client.post(
        f"/api/v1/orders/{order['id']}/load",
        json={"items": [{"item_id": item_id, "loaded_qty": 5}]},
        headers=headers,
    )

    complete_response = client.post(f"/api/v1/trips/{trip['id']}/complete", headers=headers)
    assert complete_response.status_code == 200
    assert complete_response.json()["status"] == "out_for_delivery"


def test_driver_only_sees_own_trips(client):
    headers, order, driver, vehicle, _ = setup_trip_fixtures(client)
    client.post(
        "/api/v1/trips",
        json={"vehicle_id": vehicle["id"], "driver_id": driver["id"], "order_ids": [order["id"]]},
        headers=headers,
    )
    other_driver = create_user(
        client, full_name="Driver Two", mobile="9444455555", email="driver2.trips@example.com", role="driver"
    )
    driver_headers = user_token_headers(client, driver)
    other_driver_headers = user_token_headers(client, other_driver)

    mine = client.get("/api/v1/trips", headers=driver_headers).json()
    others = client.get("/api/v1/trips", headers=other_driver_headers).json()

    assert len(mine) == 1
    assert len(others) == 0


def test_cancel_trip(client):
    headers, order, driver, vehicle, _ = setup_trip_fixtures(client)
    trip = client.post(
        "/api/v1/trips",
        json={"vehicle_id": vehicle["id"], "driver_id": driver["id"], "order_ids": [order["id"]]},
        headers=headers,
    ).json()

    response = client.post(f"/api/v1/trips/{trip['id']}/cancel", headers=headers)

    assert response.status_code == 200
    assert response.json()["status"] == "cancelled"
