"""Tests for POST /files - per api_reference.md Section 17, uploads a file to
object storage and returns its public URL; the caller then passes that URL
into the relevant business API (customer_signature, image, etc.).

The actual storage upload is mocked - these tests check the route's
behavior (auth, category defaulting, path shape), not whether a real bucket
receives bytes.
"""

import io
import uuid

import pytest

from app.core import storage
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


@pytest.fixture()
def fake_storage(monkeypatch):
    uploaded = {}

    def fake_upload_file(file_bytes, relative_path, content_type):
        uploaded["bytes"] = file_bytes
        uploaded["relative_path"] = relative_path
        uploaded["content_type"] = content_type

    monkeypatch.setattr(storage, "upload_file", fake_upload_file)
    monkeypatch.setattr(
        storage, "build_file_url", lambda relative_path: f"https://fake-storage.test/{relative_path}"
    )
    return uploaded


def test_upload_file_returns_url_built_from_category_path(client, fake_storage):
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
    assert body["file_url"].startswith("https://fake-storage.test/deliveries/")
    assert body["file_url"].endswith(".jpg")
    assert fake_storage["bytes"] == file_content
    assert fake_storage["content_type"] == "image/jpeg"


def test_upload_file_defaults_category_to_misc(client, fake_storage):
    headers = auth_headers(client)

    response = client.post(
        "/api/v1/files",
        files={"file": ("note.txt", io.BytesIO(b"hello"), "text/plain")},
        headers=headers,
    )

    assert response.status_code == 201
    assert "/misc/" in response.json()["file_url"]


def test_upload_file_without_token_returns_401_or_403(client):
    response = client.post(
        "/api/v1/files", files={"file": ("photo.jpg", io.BytesIO(b"x"), "image/jpeg")}
    )

    assert response.status_code in (401, 403)
