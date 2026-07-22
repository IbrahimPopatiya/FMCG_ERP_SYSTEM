import uuid
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ALGORITHM = "HS256"


def hash_password(plain_password: str) -> str:
    return pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(user_id: uuid.UUID, principal_type: str = "user") -> str:
    """Builds a signed JWT that identifies a principal (staff user or customer).

    `sub` holds the principal's id, `type` says which table it belongs to
    (`"user"` or `"customer"`) so a single token scheme can serve both.
    """
    expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=settings.access_token_expire_minutes
    )
    payload = {"sub": str(user_id), "type": principal_type, "exp": expires_at}
    return jwt.encode(payload, settings.secret_key, algorithm=ALGORITHM)


def decode_token(token: str) -> dict | None:
    """Returns the decoded payload (with `sub` as a UUID), or None if invalid/expired."""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
    except JWTError:
        return None

    subject = payload.get("sub")
    if subject is None:
        return None

    try:
        payload["sub"] = uuid.UUID(subject)
    except ValueError:
        return None

    return payload


def decode_access_token(token: str) -> uuid.UUID | None:
    """Returns the principal id encoded in the token, or None if invalid/expired."""
    payload = decode_token(token)
    return payload["sub"] if payload else None
