"""Creates all database tables from the models, if they don't already exist.

This is a convenience for local development so `python main.py` gives you a
ready-to-use database in one step. It only ever CREATES missing tables — it
never alters or drops existing ones. Once the team starts changing the schema
regularly, switch to Alembic migrations (`alembic upgrade head`) as the real
source of truth; this function is safe to keep running alongside Alembic
since it won't touch tables that already exist.
"""

from app.db.session import Base, engine

# Importing app.models registers every table on Base.metadata.
import app.models  # noqa: F401


def create_all_tables() -> None:
    Base.metadata.create_all(bind=engine)
