import mimetypes
import os
import uuid
from datetime import datetime, timezone

from supabase import create_client

from app.core.config import settings

_supabase = create_client(settings.supabase_url, settings.supabase_service_role_key)


def save_file(
    file_bytes: bytes,
    original_filename: str,
    category: str,
    content_type: str | None = None,
) -> str:
    """Uploads the file to Supabase Storage under <category>/<year>/<random>.<ext>
    and returns its public URL - the same value stored in columns like
    customer_signature/image/photo.

    Supabase defaults to `text/plain` for the stored object's content-type
    when none is given, which makes some browsers/image loaders refuse to
    render the file even though the upload itself succeeded - so this always
    passes a real content-type, guessing from the filename when the browser
    didn't send one."""
    year = str(datetime.now(timezone.utc).year)
    ext = os.path.splitext(original_filename)[1]
    filename = f"{uuid.uuid4().hex}{ext}"
    storage_path = f"{category}/{year}/{filename}"

    resolved_content_type = (
        content_type or mimetypes.guess_type(original_filename)[0] or "application/octet-stream"
    )

    _supabase.storage.from_(settings.supabase_storage_bucket).upload(
        storage_path,
        file_bytes,
        file_options={"content-type": resolved_content_type, "cache-control": "31536000"},
    )

    return _supabase.storage.from_(settings.supabase_storage_bucket).get_public_url(storage_path)
