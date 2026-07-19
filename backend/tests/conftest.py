"""Shared test setup.

Tests run against a separate database (same credentials as .env, but
`dms_test_db` instead of your real `dms_db`) so running tests never touches
your local dev data. Each test runs inside its own transaction that gets
rolled back afterwards, so tests never leak data into each other.
"""

import pytest
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from app.core.config import settings
from app.db.session import Base, get_db
import app.models  # noqa: F401 - registers all models on Base.metadata
from main import app

TEST_DATABASE_URL = settings.database_url.rsplit("/", 1)[0] + "/dms_test_db"

engine = create_engine(TEST_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def db_session():
    """One outer transaction per test, plus a savepoint so a `db.rollback()`
    inside the code under test (e.g. our duplicate-user handling) only undoes
    that one operation - not the whole test's data.
    """
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


@pytest.fixture()
def client(db_session):
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()
