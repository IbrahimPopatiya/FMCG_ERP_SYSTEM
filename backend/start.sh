#!/bin/sh
set -e
python -m scripts.migrate_with_lock
exec uvicorn main:app --host 0.0.0.0 --port "$PORT"
