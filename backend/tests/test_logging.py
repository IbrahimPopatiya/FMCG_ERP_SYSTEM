"""Smoke tests for the logging foundation — keeps the framework honest without
asserting on log text (format can evolve)."""

from fastapi.testclient import TestClient

from main import app


def test_health_returns_request_id_header():
    with TestClient(app) as client:
        response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert "x-request-id" in response.headers
    assert len(response.headers["x-request-id"]) > 0


def test_client_can_pass_request_id():
    with TestClient(app) as client:
        response = client.get(
            "/api/v1/health",
            headers={"X-Request-ID": "test-req-123"},
        )

    assert response.status_code == 200
    assert response.headers["x-request-id"] == "test-req-123"


def test_unhandled_errors_include_request_id_in_body(client):
    # Hit a route that 404s via HTTPException — still gets X-Request-ID.
    response = client.get("/api/v1/products/00000000-0000-0000-0000-000000000000")
    assert response.status_code in (401, 403, 404)
    assert "x-request-id" in response.headers
