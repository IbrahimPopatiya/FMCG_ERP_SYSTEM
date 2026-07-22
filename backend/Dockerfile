# Base image: slim Python, enough to run FastAPI without extra OS bloat
FROM python:3.12-slim

WORKDIR /app

# psycopg2-binary needs libpq at runtime; slim images don't include it
RUN apt-get update && apt-get install -y --no-install-recommends libpq-dev gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy only requirements first so Docker caches this layer -
# it only re-runs pip install when requirements.txt actually changes
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Now copy the rest of the source
COPY . .

EXPOSE 8000

# host 0.0.0.0, not localhost - inside a container "localhost" only
# refers to the container itself, other containers couldn't reach it
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
