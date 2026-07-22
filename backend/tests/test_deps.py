"""Tests for get_current_user() in app/core/deps.py.

We attach a tiny throwaway protected route just for this test file, since
no real domain uses get_current_user() yet (Auth & Users login is deferred -
see api_work_allocation.md). Once a real protected route exists elsewhere
(e.g. Routes domain), prefer testing through that instead of this stub.
"""

import uuid

from fastapi import Depends

from app.core.security import create_access_token
from app.core.deps import get_current_user
from app.models.user import User
from main import app


@app.get("/api/v1/_test/whoami")
def whoami(current_user: User = Depends(get_current_user)):
    return {"id": str(current_user.id)}


def make_user_payload(**overrides):
    payload = {
        "full_name": "Auth Test User",
        "mobile": "9222233344",
        "email": "auth.test@example.com",
        "password": "secret123",
        "role": "admin",
    }
    payload.update(overrides)
    return payload


def test_valid_token_grants_access(client):
    created = client.post("/api/v1/users", json=make_user_payload()).json()
    token = create_access_token(uuid.UUID(created["id"]))

    response = client.get(
        "/api/v1/_test/whoami", headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    assert response.json()["id"] == created["id"]


def test_missing_token_returns_401(client):
    response = client.get("/api/v1/_test/whoami")

    assert response.status_code in (401, 403)  # HTTPBearer returns 403 when no header at all


def test_invalid_token_returns_401(client):
    response = client.get(
        "/api/v1/_test/whoami", headers={"Authorization": "Bearer garbage-token"}
    )

    assert response.status_code == 401


def test_token_for_deleted_user_returns_401(client):
    created = client.post("/api/v1/users", json=make_user_payload()).json()
    token = create_access_token(uuid.UUID(created["id"]))
    client.delete(f"/api/v1/users/{created['id']}")

    response = client.get(
        "/api/v1/_test/whoami", headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 401
