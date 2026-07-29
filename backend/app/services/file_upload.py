import os
import uuid
from datetime import datetime, timezone

from supabase import create_client

from app.core.config import settings

_supabase = create_client(settings.supabase_url, settings.supabase_service_role_key)


def save_file(file_bytes: bytes, original_filename: str, category: str) -> str:
    """Uploads the file to Supabase Storage under <category>/<year>/<random>.<ext>
    and returns its public URL - the same value stored in columns like
    customer_signature/image/photo."""
    year = str(datetime.now(timezone.utc).year)
    ext = os.path.splitext(original_filename)[1]
    filename = f"{uuid.uuid4().hex}{ext}"
    storage_path = f"{category}/{year}/{filename}"

    _supabase.storage.from_(settings.supabase_storage_bucket).upload(storage_path, file_bytes)

    return _supabase.storage.from_(settings.supabase_storage_bucket).get_public_url(storage_path)
