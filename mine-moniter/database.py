import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

POSTGRES_URL = os.getenv("DATABASE_URL", "postgresql+psycopg://postgres:Qwerty%40123@localhost:5432/mine_monitoring")
SQLITE_URL = "sqlite:///./mine_telemetry.db"

engine = None
try:
    engine = create_engine(POSTGRES_URL)
    with engine.connect() as conn:
        pass
    print("[DB] [OK] Connected to PostgreSQL database")
except Exception as e:
    print(f"[DB] [INFO] PostgreSQL not available, falling back to SQLite: {SQLITE_URL}")
    engine = create_engine(SQLITE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()