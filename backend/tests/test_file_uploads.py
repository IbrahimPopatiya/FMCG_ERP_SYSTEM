"""Tests for POST /files - per api_reference.md Section 17, uploads a file to
S3 and returns its public URL; the caller then passes that URL into the
relevant business API (customer_signature, image, etc.).

The real S3 client is mocked so these tests don't hit the network.
"""

import io
import uuid
from unittest.mock import MagicMock, patch

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


def test_upload_file_returns_public_s3_url(client):
    headers = auth_headers(client)

    with patch("app.services.file_upload._s3", MagicMock()):
        response = client.post(
            "/api/v1/files",
            files={"file": ("photo.jpg", io.BytesIO(b"fake image bytes"), "image/jpeg")},
            data={"category": "deliveries"},
            headers=headers,
        )

    assert response.status_code == 201
    file_url = response.json()["file_url"]
    bucket_url = f"https://{settings.s3_bucket_name}.s3.{settings.aws_region}.amazonaws.com/"
    assert file_url.startswith(bucket_url + "deliveries/")
    assert file_url.endswith(".jpg")


def test_upload_file_defaults_category_to_misc(client):
    headers = auth_headers(client)

    with patch("app.services.file_upload._s3", MagicMock()):
        response = client.post(
            "/api/v1/files",
            files={"file": ("note.txt", io.BytesIO(b"hello"), "text/plain")},
            headers=headers,
        )

    assert response.status_code == 201
    assert "/misc/" in response.json()["file_url"]


def test_upload_file_stores_bytes_with_content_type_and_cache_header(client):
    headers = auth_headers(client)
    mock_s3 = MagicMock()

    with patch("app.services.file_upload._s3", mock_s3):
        response = client.post(
            "/api/v1/files",
            files={"file": ("photo.png", io.BytesIO(b"png bytes"), "image/png")},
            data={"category": "products"},
            headers=headers,
        )

    upload = mock_s3.put_object.call_args.kwargs
    assert upload["Bucket"] == settings.s3_bucket_name
    assert upload["Body"] == b"png bytes"
    assert upload["ContentType"] == "image/png"
    assert "max-age=31536000" in upload["CacheControl"]
    assert response.json()["file_url"].endswith(upload["Key"])


def test_upload_file_guesses_content_type_from_filename_when_missing(client):
    headers = auth_headers(client)
    mock_s3 = MagicMock()

    with patch("app.services.file_upload._s3", mock_s3):
        client.post(
            "/api/v1/files",
            files={"file": ("photo.jpeg", io.BytesIO(b"x"), "")},
            headers=headers,
        )

    assert mock_s3.put_object.call_args.kwargs["ContentType"] == "image/jpeg"


def test_upload_file_uses_cloudfront_domain_when_set(client):
    headers = auth_headers(client)

    with (
        patch("app.services.file_upload._s3", MagicMock()),
        patch.object(settings, "cloudfront_domain", "d123.cloudfront.net"),
    ):
        response = client.post(
            "/api/v1/files",
            files={"file": ("photo.jpg", io.BytesIO(b"x"), "image/jpeg")},
            headers=headers,
        )

    assert response.json()["file_url"].startswith("https://d123.cloudfront.net/misc/")


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
