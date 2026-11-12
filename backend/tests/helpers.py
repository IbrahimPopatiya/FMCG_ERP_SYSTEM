"""Small helpers shared by many test files."""

from app.db.session import get_db
from app.schemas.user import UserCreate, UserResponse
from app.services import user as user_service


def create_test_user(client, payload: dict) -> dict:
    """Insert a staff user straight into the test database and return it in
    the same shape POST /users returns.

    POST /users is admin-only, so a test can't use it to make its first user.
    The `client` fixture points get_db at the test's own session, so the user
    lands in the same rolled-back transaction as everything else in the test.
    """
    db = next(client.app.dependency_overrides[get_db]())
    user = user_service.create_user(db, UserCreate(**payload))
    return UserResponse.model_validate(user).model_dump(mode="json")
