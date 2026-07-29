import os
import uuid
from datetime import datetime, timezone

from app.core import storage


def save_file(file_bytes: bytes, original_filename: str, category: str, content_type: str) -> str:
    """Uploads the file under <category>/<year>/<random>.<ext> in the
    configured object storage bucket and returns its public URL - the same
    value stored in columns like customer_signature/image/photo."""
    year = str(datetime.now(timezone.utc).year)
    ext = os.path.splitext(original_filename)[1]
    filename = f"{uuid.uuid4().hex}{ext}"

    relative_path = "/".join([category, year, filename])
    storage.upload_file(file_bytes, relative_path, content_type)

    return storage.build_file_url(relative_path)
