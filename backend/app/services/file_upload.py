import os
import uuid
from datetime import datetime, timezone

from app.core.config import settings


def save_file(file_bytes: bytes, original_filename: str, category: str) -> str:
    """Saves the file under UPLOAD_DIR/<category>/<year>/<random>.<ext> and
    returns that relative path - the same path shape stored in columns like
    customer_signature/image/photo."""
    year = str(datetime.now(timezone.utc).year)
    ext = os.path.splitext(original_filename)[1]
    filename = f"{uuid.uuid4().hex}{ext}"

    relative_path = os.path.join(category, year, filename)
    absolute_path = os.path.join(settings.upload_dir, relative_path)

    os.makedirs(os.path.dirname(absolute_path), exist_ok=True)
    with open(absolute_path, "wb") as f:
        f.write(file_bytes)

    return relative_path.replace(os.sep, "/")
