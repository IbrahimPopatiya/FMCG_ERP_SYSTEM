"""Tests for POST /posts and GET /posts."""

import uuid

from app.core.security import create_access_token


def auth_headers(client):
    user = client.post(
        "/api/v1/users",
        json={
            "full_name": "Post Tester",
            "mobile": "9444455577",
            "email": "post.tester@example.com",
            "password": "secret123",
            "role": "admin",
        },
    ).json()
    token = create_access_token(uuid.UUID(user["id"]))
    return {"Authorization": f"Bearer {token}"}


def create_test_product(client, headers, **overrides):
    payload = {
        "name": "Test Product",
        "unit": "bottle",
        "mrp": 40.00,
        "selling_price": 35.00,
        "gst_rate": 18.00,
        "minimum_stock": 10,
    }
    payload.update(overrides)
    response = client.post("/api/v1/products", json=payload, headers=headers)
    return response.json()


def post_payload(product_id, **overrides):
    payload = {
        "product_id": product_id,
        "product_name": "Test Product",
        "price": 35.00,
        "mrp": 40.00,
        "quantity_in_box": 12,
    }
    payload.update(overrides)
    return payload


# ---------- POST /posts ----------

def test_create_post_returns_201(client):
    headers = auth_headers(client)
    product = create_test_product(client, headers)

    response = client.post("/api/v1/posts", json=post_payload(product["id"]), headers=headers)

    assert response.status_code == 201
    body = response.json()
    assert body["product_name"] == "Test Product"
    assert body["is_active"] is True


def test_create_post_without_token_returns_401_or_403(client):
    response = client.post("/api/v1/posts", json=post_payload(str(uuid.uuid4())))

    assert response.status_code in (401, 403)


def test_create_post_missing_image_returns_422(client):
    """The admin "New post" screen only offers an image upload - a standalone
    post (no product_id) without an image isn't meaningful."""
    headers = auth_headers(client)

    response = client.post("/api/v1/posts", json={}, headers=headers)

    assert response.status_code == 422


def test_create_post_without_product_link_uses_defaults(client):
    """A standalone post - image only, no product link - doesn't need
    product_name/price/mrp/quantity_in_box; the API fills in sane defaults."""
    headers = auth_headers(client)

    response = client.post(
        "/api/v1/posts",
        json={"image": "posts/promo.jpg"},
        headers=headers,
    )

    assert response.status_code == 201
    body = response.json()
    assert body["image"] == "posts/promo.jpg"
    assert body["price"] == "0.00" or float(body["price"]) == 0
    assert body["quantity_in_box"] == 1
    assert body["is_standalone"] is True


def test_create_post_with_product_link_is_not_standalone(client):
    headers = auth_headers(client)
    product = create_test_product(client, headers)

    response = client.post("/api/v1/posts", json=post_payload(product["id"]), headers=headers)

    assert response.status_code == 201
    assert response.json()["is_standalone"] is False


# ---------- POST /posts/repost (bulk) ----------

def test_repost_many_bumps_all_selected_posts(client):
    headers = auth_headers(client)
    product_a = create_test_product(client, headers)
    product_b = create_test_product(
        client, headers, name="Fourth Product"
    )

    post_a = client.post("/api/v1/posts", json=post_payload(product_a["id"]), headers=headers).json()
    post_b = client.post(
        "/api/v1/posts",
        json=post_payload(product_b["id"], product_name="Fourth Product"),
        headers=headers,
    ).json()

    for pid in (post_a["id"], post_b["id"]):
        client.patch(f"/api/v1/posts/{pid}/status", json={"is_active": False}, headers=headers)

    response = client.post(
        "/api/v1/posts/repost", json={"post_ids": [post_a["id"], post_b["id"]]}, headers=headers
    )

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 2
    assert all(p["is_active"] is True for p in body)


def test_repost_many_unknown_id_returns_404(client):
    headers = auth_headers(client)

    response = client.post(
        "/api/v1/posts/repost", json={"post_ids": [str(uuid.uuid4())]}, headers=headers
    )

    assert response.status_code == 404


def test_create_post_unknown_product_returns_404(client):
    headers = auth_headers(client)

    response = client.post(
        "/api/v1/posts", json=post_payload(str(uuid.uuid4())), headers=headers
    )

    assert response.status_code == 404


# ---------- GET /posts ----------

def test_list_posts_returns_newest_first(client):
    headers = auth_headers(client)
    product_a = create_test_product(client, headers)
    product_b = create_test_product(
        client, headers, name="Second Product"
    )

    client.post("/api/v1/posts", json=post_payload(product_a["id"]), headers=headers)
    client.post(
        "/api/v1/posts",
        json=post_payload(product_b["id"], product_name="Second Product"),
        headers=headers,
    )

    response = client.get("/api/v1/posts", headers=headers)

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 2
    assert body[0]["product_name"] == "Second Product"
    assert body[1]["product_name"] == "Test Product"
