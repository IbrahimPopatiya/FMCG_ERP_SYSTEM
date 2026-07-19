"""Tests for the JWT helpers in app/core/security.py.

There's no /auth/login route yet (deliberately deferred - see api_work_allocation.md),
so these test the token functions directly instead of through an API call.
Once login exists, add end-to-end tests that go through the real endpoint.
"""

import uuid

from app.core.security import create_access_token, decode_access_token


def test_decode_returns_the_same_user_id_that_was_encoded():
    user_id = uuid.uuid4()

    token = create_access_token(user_id)

    assert decode_access_token(token) == user_id


def test_decode_returns_none_for_garbage_token():
    assert decode_access_token("this-is-not-a-real-token") is None


def test_decode_returns_none_for_tampered_token():
    user_id = uuid.uuid4()
    token = create_access_token(user_id)

    tampered = token[:-1] + ("A" if token[-1] != "A" else "B")

    assert decode_access_token(tampered) is None
