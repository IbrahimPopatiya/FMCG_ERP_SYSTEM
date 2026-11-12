"""Creates an admin user directly in the database.

POST /users is admin-only, so on a fresh database nobody can call it yet.
Run this once to create the first admin; that admin then creates every other
user from the app.

Works against whatever DATABASE_URL in backend/.env points to - check it
before running.

Run with:
    cd backend
    venv\\Scripts\\activate          (Windows)
    python -m scripts.create_admin --name "Owner Name" --mobile 9000000000 --email owner@example.com

The password is asked for at the prompt, so it never lands in shell history.
"""

import argparse
import getpass
import sys

from app.core.enums import UserRole
from app.db.session import SessionLocal
import app.models  # noqa: F401 - registers all models on Base.metadata
from app.schemas.user import UserCreate
from app.services import user as user_service
from app.services.user import DuplicateUserError


def read_password() -> str:
    password = getpass.getpass("Password: ")
    if password != getpass.getpass("Repeat password: "):
        sys.exit("Passwords do not match.")
    if not password:
        sys.exit("Password cannot be empty.")
    return password


def main() -> None:
    parser = argparse.ArgumentParser(description="Create an admin user.")
    parser.add_argument("--name", required=True, help="Full name")
    parser.add_argument("--mobile", required=True, help="Mobile number (login identifier)")
    parser.add_argument("--email", required=True, help="Email (login identifier)")
    args = parser.parse_args()

    data = UserCreate(
        full_name=args.name,
        mobile=args.mobile,
        email=args.email,
        password=read_password(),
        role=UserRole.ADMIN,
    )

    db = SessionLocal()
    try:
        admin = user_service.create_user(db, data)
    except DuplicateUserError as e:
        sys.exit(str(e))
    finally:
        db.close()

    print(f"Admin created: {admin.full_name} ({admin.mobile})")


if __name__ == "__main__":
    main()
