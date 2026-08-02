"""Tests for GET /recommendations/products/{id}/similar, GET /recommendations/for-me,
POST /recommendations/impressions.

Product create/update embeds via the real sentence-transformers model (see
app/services/embedding.py), so these tests exercise the actual embedding
pipeline rather than a mock - first run downloads the model, which is slow.
"""

import uuid


def admin_headers(client):
    admin = client.post(
        "/api/v1/users",
        json={
            "full_name": "Rec Admin",
            "mobile": "9000022222",
            "email": "rec.admin@example.com",
            "password": "secret123",
            "role": "admin",
        },
    ).json()
    login = client.post(
        "/api/v1/auth/login", json={"identifier": admin["email"], "password": "secret123"}
    ).json()
    return {"Authorization": f"Bearer {login['access_token']}"}


def create_product(client, headers, **overrides):
    payload = {
        "sku": "SKU-REC-1",
        "barcode": "8801111111111",
        "name": "Coca-Cola 500ml",
        "unit": "bottle",
        "packing": "12 x 500ml",
        "mrp": 40.00,
        "selling_price": 35.00,
        "gst_rate": 18.00,
        "minimum_stock": 10,
    }
    payload.update(overrides)
    return client.post("/api/v1/products", json=payload, headers=headers).json()


def create_warehouse(client, headers):
    return client.post(
        "/api/v1/warehouses",
        json={"name": "Main Warehouse", "address": "Plot 1", "state": "Maharashtra"},
        headers=headers,
    ).json()


def create_customer(client, headers, **overrides):
    payload = {
        "customer_code": "CUST-REC-1",
        "business_name": "Rec Test Store",
        "owner_name": "Test Owner",
        "mobile": "9876500001",
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


def customer_headers(client, mobile, password="customerpass123"):
    login = client.post(
        "/api/v1/auth/login", json={"identifier": mobile, "password": password}
    ).json()
    return {"Authorization": f"Bearer {login['access_token']}"}


def create_order(client, headers, customer_id, product_id, qty=1):
    return client.post(
        "/api/v1/orders",
        json={"customer_id": customer_id, "items": [{"product_id": product_id, "ordered_qty": qty}]},
        headers=headers,
    )


# ---------- GET /recommendations/products/{id}/similar ----------

def test_get_similar_products_excludes_the_target_product(client):
    headers = admin_headers(client)
    target = create_product(client, headers)
    other = create_product(client, headers, sku="SKU-REC-2", barcode="8801111111112", name="Pepsi 500ml")

    response = client.get(f"/api/v1/recommendations/products/{target['id']}/similar", headers=headers)

    assert response.status_code == 200
    ids = [item["id"] for item in response.json()]
    assert target["id"] not in ids
    assert other["id"] in ids


def test_get_similar_products_for_unknown_product_returns_empty_list(client):
    headers = admin_headers(client)

    response = client.get(
        f"/api/v1/recommendations/products/{uuid.uuid4()}/similar", headers=headers
    )

    assert response.status_code == 200
    assert response.json() == []


def test_get_similar_products_without_token_returns_401_or_403(client):
    response = client.get(f"/api/v1/recommendations/products/{uuid.uuid4()}/similar")

    assert response.status_code in (401, 403)


# ---------- GET /recommendations/for-me ----------

def test_for_me_without_token_returns_401_or_403(client):
    response = client.get("/api/v1/recommendations/for-me")

    assert response.status_code in (401, 403)


def test_for_me_staff_token_returns_403(client):
    headers = admin_headers(client)

    response = client.get("/api/v1/recommendations/for-me", headers=headers)

    assert response.status_code == 403


def test_for_me_cold_start_falls_back_to_popular_products(client):
    """A customer with no order history yet still gets a feed, from the
    popularity fallback rather than an embedding similarity crash."""
    headers = admin_headers(client)
    create_product(client, headers)
    customer = create_customer(client, headers)

    response = client.get(
        "/api/v1/recommendations/for-me", headers=customer_headers(client, "9876500001")
    )

    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 1
    assert len(body["items"]) == 1


def test_for_me_is_not_capped_and_pages_through_the_whole_catalog(client):
    """The personalized feed isn't limited to a fixed-size preview - a
    customer can keep paging until every active product has been seen."""
    headers = admin_headers(client)
    create_warehouse(client, headers)
    products = [
        create_product(
            client, headers, sku=f"SKU-REC-PAGE-{i}", barcode=f"88011111111{i}0", name=f"Soft Drink {i}"
        )
        for i in range(15)
    ]
    customer = create_customer(client, headers)
    cust_headers = customer_headers(client, "9876500001")
    # Order history is what activates the personalized (embedding) branch.
    create_order(client, cust_headers, customer["id"], products[0]["id"])

    seen_ids = set()
    page = 1
    while True:
        body = client.get(
            f"/api/v1/recommendations/for-me?page={page}&page_size=5", headers=cust_headers
        ).json()
        assert body["total"] == 15
        if not body["items"]:
            break
        seen_ids.update(item["id"] for item in body["items"])
        page += 1

    assert seen_ids == {p["id"] for p in products}


# ---------- POST /recommendations/impressions ----------

def test_record_impressions_returns_204_and_is_idempotent(client):
    headers = admin_headers(client)
    product = create_product(client, headers)
    customer = create_customer(client, headers)
    cust_headers = customer_headers(client, "9876500001")

    first = client.post(
        "/api/v1/recommendations/impressions",
        json={"product_ids": [product["id"]]},
        headers=cust_headers,
    )
    second = client.post(
        "/api/v1/recommendations/impressions",
        json={"product_ids": [product["id"]]},
        headers=cust_headers,
    )

    assert first.status_code == 204
    assert second.status_code == 204
