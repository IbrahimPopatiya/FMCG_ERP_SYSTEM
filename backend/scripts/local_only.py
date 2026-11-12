"""Guard for scripts that delete or overwrite data.

Call require_local_database() at the top of any script that wipes tables, so
it can never run against the production database by mistake - only against
Postgres on this machine, or the `db` container from docker-compose.yml.
"""

import sys
from urllib.parse import urlparse

from app.core.config import settings

LOCAL_HOSTS = {"localhost", "127.0.0.1", "db"}


def require_local_database() -> None:
    url = urlparse(settings.database_url)
    if url.hostname not in LOCAL_HOSTS:
        sys.exit(
            f"Refusing to run: DATABASE_URL points at {url.hostname!r}. "
            "This script deletes data, so it only runs against a local database."
        )
    print(f"Target database: {url.hostname}:{url.port}{url.path}")
