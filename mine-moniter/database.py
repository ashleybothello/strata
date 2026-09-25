import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Load .env from parent directory
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

db_url = os.getenv("DATABASE_URL", "postgresql+psycopg://postgres:Qwerty%40123@localhost:5432/mine_monitoring")
if db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgresql://", "postgresql+psycopg://", 1)

# Fix unescaped @ in password (Qwerty@123) for SQLAlchemy URI
if "Qwerty@123" in db_url:
    db_url = db_url.replace("Qwerty@123", "Qwerty%40123")

POSTGRES_URL = db_url
SQLITE_URL = "sqlite:///./mine_telemetry.db"

engine = None
try:
    engine = create_engine(POSTGRES_URL)
    with engine.connect() as conn:
        pass
    print("[DB] [OK] Connected to PostgreSQL database")
except Exception as e:
    print(f"[DB] [INFO] PostgreSQL not available, falling back to SQLite: {SQLITE_URL}")
    print(f"Error: {e}")
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