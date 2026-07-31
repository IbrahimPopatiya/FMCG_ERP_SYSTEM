from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.core.config import settings

engine = create_engine(
    settings.database_url,
    pool_size=10,
    max_overflow=20,
    # Supabase's pooler drops idle connections - without this, the first
    # request after a quiet period grabs a dead connection and fails/stalls
    # instead of transparently reconnecting.
    pool_pre_ping=True,
    # Recycle connections before Supabase's pooler would drop them itself.
    pool_recycle=1800,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
