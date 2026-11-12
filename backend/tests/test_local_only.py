"""Tests for scripts/local_only.py - the guard that stops data-wiping scripts
from running against a remote (production) database."""

import pytest

from app.core.config import settings
from scripts.local_only import require_local_database


@pytest.mark.parametrize(
    "url",
    [
        "postgresql://postgres@localhost:5432/dms_dev",
        "postgresql://postgres:pw@127.0.0.1:5432/dms_db",
        "postgresql://postgres:pw@db:5432/dms_db",  # docker-compose container
    ],
)
def test_local_database_is_allowed(monkeypatch, url):
    monkeypatch.setattr(settings, "database_url", url)

    require_local_database()  # does not exit


@pytest.mark.parametrize(
    "url",
    [
        "postgresql://user:pw@aws-1-ap-south-1.pooler.supabase.com:5432/postgres",
        "postgresql://user:pw@mydb.abc123.ap-south-1.rds.amazonaws.com:5432/dms",
        "postgresql://user:pw@localhost.evil.example.com:5432/dms",
    ],
)
def test_remote_database_is_refused(monkeypatch, url):
    monkeypatch.setattr(settings, "database_url", url)

    with pytest.raises(SystemExit):
        require_local_database()


def test_refusal_message_does_not_print_the_password(monkeypatch):
    monkeypatch.setattr(
        settings, "database_url", "postgresql://user:s3cret@db.example.com:5432/dms"
    )

    with pytest.raises(SystemExit) as exc:
        require_local_database()

    assert "s3cret" not in str(exc.value)
