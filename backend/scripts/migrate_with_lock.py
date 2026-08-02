"""Run `alembic upgrade head` under a Postgres advisory lock.

If Render (or any platform) starts more than one container at once, each
one's start.sh runs this. Without a lock, two containers can both read
alembic_version before either commits, both attempt the same CREATE TABLE,
and one crashes with DuplicateTable while alembic_version never advances.
The lock makes the migration runs queue up instead of racing.
"""
import subprocess
import sys

import psycopg2

from app.core.config import settings

# Arbitrary fixed key - just needs to be the same every time this script runs.
ADVISORY_LOCK_KEY = 727271


def main() -> int:
    conn = psycopg2.connect(settings.migration_database_url)
    conn.autocommit = True
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT pg_advisory_lock(%s)", (ADVISORY_LOCK_KEY,))
        result = subprocess.run(["alembic", "upgrade", "head"])
        return result.returncode
    finally:
        with conn.cursor() as cur:
            cur.execute("SELECT pg_advisory_unlock(%s)", (ADVISORY_LOCK_KEY,))
        conn.close()


if __name__ == "__main__":
    sys.exit(main())
