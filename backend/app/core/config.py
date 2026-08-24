from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str
    # Migrations only — direct/session connection, not the transaction pooler.
    # The transaction pooler doesn't guarantee Alembic's multi-statement
    # migration transactions stay atomic, which caused a table to get created
    # without alembic_version being updated to match. Falls back to
    # database_url so this is opt-in per environment.
    direct_database_url: str = ""
    # Pytest only — always local. Independent of database_url so the app can
    # point at Supabase while the suite stays on localhost.
    test_database_url: str = "postgresql://postgres@localhost:5432/dms_test_db"
    secret_key: str
    access_token_expire_minutes: int = 60
    cors_extra_origins: str = ""
    # Matches this client's Vercel preview deploys (project-name-git-branch-*.vercel.app).
    # Each client's Render service should set this to their own Vercel project name.
    cors_vercel_preview_regex: str = r"https://fmcg-erp-system.*\.vercel\.app"
    supabase_url: str
    supabase_service_role_key: str
    supabase_storage_bucket: str = "fmcg_products"

    # Gemini API key - server-side only, used to generate AI product ad
    # posters (admin > Poster AI). Get one at aistudio.google.com.
    gemini_api_key: str = ""

    # Logging — stdout only (not DB). Use ENVIRONMENT=production on deploy
    # so LOG_FORMAT=auto switches to JSON for log drains.
    environment: str = "development"
    log_level: str = "INFO"
    # auto | json | text — auto picks json in production, text otherwise
    log_format: str = "auto"

    @property
    def cors_extra_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_extra_origins.split(",") if origin.strip()]

    @property
    def migration_database_url(self) -> str:
        return self.direct_database_url or self.database_url

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
