import uuid
from datetime import datetime, timezone

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.enums import UserStatus
from app.core.security import hash_password
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate


class DuplicateUserError(Exception):
    """Raised when mobile or email is already used by another user."""


def create_user(db: Session, data: UserCreate) -> User:
    user = User(
        full_name=data.full_name,
        mobile=data.mobile,
        email=data.email,
        password_hash=hash_password(data.password),
        role=data.role,
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise DuplicateUserError("A user with this mobile or email already exists")
    db.refresh(user)
    return user


def get_user(db: Session, user_id: uuid.UUID) -> User | None:
    return db.query(User).filter(User.id == user_id, User.deleted_at.is_(None)).first()


def update_user(db: Session, user_id: uuid.UUID, data: UserUpdate) -> User | None:
    user = get_user(db, user_id)
    if user is None:
        return None

    # Only overwrite fields the caller actually sent.
    updates = data.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)
    return user


def set_user_status(db: Session, user_id: uuid.UUID, new_status: UserStatus) -> User | None:
    user = get_user(db, user_id)
    if user is None:
        return None

    user.status = new_status
    db.commit()
    db.refresh(user)
    return user



def soft_delete_user(db: Session, user_id: uuid.UUID) -> User | None:
    user = get_user(db, user_id)
    if user is None:
        return None

    user.deleted_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user)
    return user
