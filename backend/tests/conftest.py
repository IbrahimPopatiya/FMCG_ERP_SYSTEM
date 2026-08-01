"""Shared test setup.

The suite ALWAYS talks to a local Postgres database via TEST_DATABASE_URL —
never the deployed Supabase URL from DATABASE_URL. That keeps the app free to
use a remote DB for day-to-day work while tests stay fast and isolated.

Override in backend/.env if needed:
  TEST_DATABASE_URL=postgresql://postgres@localhost:5432/dms_test_db

Set TEST_SQL_ECHO=1 in the environment to print every SQL statement:
  TEST_SQL_ECHO=1 pytest tests/test_products.py

Each test runs inside its own transaction that gets rolled back afterwards,
so tests never leak data into each other.
"""

import os
import re

import pytest
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from app.core.config import settings
from app.db.session import Base, get_db
import app.models  # noqa: F401 - registers all models on Base.metadata
from main import app

TEST_DATABASE_URL = settings.test_database_url
SQL_ECHO = os.getenv("TEST_SQL_ECHO", "").strip() in {"1", "true", "True", "yes"}


def _redact_url(url: str) -> str:
    return re.sub(r":([^:@/]+)@", ":***@", url)


engine = create_engine(TEST_DATABASE_URL, echo=SQL_ECHO)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    print(f"\n[pytest] Using LOCAL test database: {_redact_url(TEST_DATABASE_URL)}")
    if "supabase.com" in TEST_DATABASE_URL or "pooler." in TEST_DATABASE_URL:
        raise RuntimeError(
            "TEST_DATABASE_URL points at a remote/deployed database. "
            "Tests must use a local Postgres URL (e.g. localhost dms_test_db)."
        )
    if SQL_ECHO:
        print("[pytest] TEST_SQL_ECHO=1 — SQL statements will be printed")
    # Drop first so a stale local schema (missing newer columns) can't linger —
    # create_all alone never alters existing tables.
    print("[pytest] Resetting schema (drop_all → create_all)…")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    print("[pytest] Tables ready — running tests\n")
    yield
    print("\n[pytest] Dropping test tables (drop_all)…")
    Base.metadata.drop_all(bind=engine)
    print("[pytest] Test database cleaned up")


@pytest.fixture()
def db_session(request):
    """One outer transaction per test, plus a savepoint so a `db.rollback()`
    inside the code under test (e.g. our duplicate-user handling) only undoes
    that one operation - not the whole test's data.
    """
    print(f"[pytest] → begin transaction for {request.node.name}")
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    session.begin_nested()

    @event.listens_for(session, "after_transaction_end")
    def restart_savepoint(sess, trans):
        if trans.nested and not trans._parent.nested:
            sess.begin_nested()

    yield session
    session.close()
    transaction.rollback()
    connection.close()
    print(f"[pytest] ← rolled back transaction for {request.node.name}")


@pytest.fixture()
def client(db_session):
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()
