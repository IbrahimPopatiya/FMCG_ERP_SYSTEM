"""Tests for POST /files - per api_reference.md Section 17, uploads a file to
Supabase Storage and returns its public URL; the caller then passes that URL
into the relevant business API (customer_signature, image, etc.).

The real Supabase client is mocked so these tests don't hit the network.
"""

import io
import uuid
from unittest.mock import MagicMock, patch

from app.core.security import create_access_token


def auth_headers(client):
    user = client.post(
        "/api/v1/users",
        json={
            "full_name": "File Upload Tester",
            "mobile": "9333344455",
            "email": "file.tester@example.com",
            "password": "secret123",
            "role": "admin",
        },
    ).json()
    token = create_access_token(uuid.UUID(user["id"]))
    return {"Authorization": f"Bearer {token}"}


def mock_supabase_storage():
    """Returns a mock whose from_(bucket).get_public_url(path) echoes back a
    predictable fake URL derived from the storage path."""
    mock_client = MagicMock()
    mock_client.storage.from_.return_value.get_public_url.side_effect = (
        lambda path: f"https://fake.supabase.co/storage/v1/object/public/fmcg_products/{path}"
    )
    return mock_client


def test_upload_file_returns_public_url(client):
    headers = auth_headers(client)

    with patch("app.services.file_upload._supabase", mock_supabase_storage()):
        response = client.post(
            "/api/v1/files",
            files={"file": ("photo.jpg", io.BytesIO(b"fake image bytes"), "image/jpeg")},
            data={"category": "deliveries"},
            headers=headers,
        )

    assert response.status_code == 201
    body = response.json()
    assert "deliveries/" in body["file_url"]
    assert body["file_url"].endswith(".jpg")


def test_upload_file_defaults_category_to_misc(client):
    headers = auth_headers(client)

    with patch("app.services.file_upload._supabase", mock_supabase_storage()):
        response = client.post(
            "/api/v1/files",
            files={"file": ("note.txt", io.BytesIO(b"hello"), "text/plain")},
            headers=headers,
        )

    assert response.status_code == 201
    assert "misc/" in response.json()["file_url"]


def test_upload_file_without_token_returns_401_or_403(client):
    response = client.post(
        "/api/v1/files", files={"file": ("photo.jpg", io.BytesIO(b"x"), "image/jpeg")}
    )

    assert response.status_code in (401, 403)


def test_upload_file_too_large_returns_413(client):
    oversized = b"x" * (10 * 1024 * 1024 + 1)
    headers = auth_headers(client)

    response = client.post(
        "/api/v1/files",
        files={"file": ("big.jpg", io.BytesIO(oversized), "image/jpeg")},
        headers=headers,
    )

    assert response.status_code == 413
