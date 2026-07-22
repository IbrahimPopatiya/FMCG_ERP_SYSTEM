"""Tests for POST /files - per api_reference.md Section 17, uploads a file to
object storage (local disk here) and returns its path; the caller then passes
that path into the relevant business API (customer_signature, image, etc.).
"""

import io
import os
import uuid

from app.core.config import settings
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


def test_upload_file_returns_relative_path(client):
    headers = auth_headers(client)
    file_content = b"fake image bytes"

    response = client.post(
        "/api/v1/files",
        files={"file": ("photo.jpg", io.BytesIO(file_content), "image/jpeg")},
        data={"category": "deliveries"},
        headers=headers,
    )

    assert response.status_code == 201
    body = response.json()
    assert body["file_url"].startswith("deliveries/")
    assert body["file_url"].endswith(".jpg")

    saved_path = os.path.join(settings.upload_dir, body["file_url"])
    assert os.path.isfile(saved_path)
    with open(saved_path, "rb") as f:
        assert f.read() == file_content


def test_upload_file_defaults_category_to_misc(client):
    headers = auth_headers(client)

    response = client.post(
        "/api/v1/files",
        files={"file": ("note.txt", io.BytesIO(b"hello"), "text/plain")},
        headers=headers,
    )

    assert response.status_code == 201
    assert response.json()["file_url"].startswith("misc/")


def test_upload_file_without_token_returns_401_or_403(client):
    response = client.post(
        "/api/v1/files", files={"file": ("photo.jpg", io.BytesIO(b"x"), "image/jpeg")}
    )

    assert response.status_code in (401, 403)
