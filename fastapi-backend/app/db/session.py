import json
import uuid
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.types import TypeDecorator, CHAR, TEXT, JSON
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, ARRAY as PG_ARRAY, JSONB as PG_JSONB
from app.core.config import settings

db_uri = settings.SQLALCHEMY_DATABASE_URI

# Dynamic Connection Fallback: Try PostgreSQL first. If it fails, fallback to SQLite.
if db_uri.startswith("postgresql"):
    try:
        # Create a temp engine with short timeout to test connection
        temp_engine = create_engine(
            db_uri,
            connect_args={"connect_timeout": 2} if "timeout" not in db_uri else {}
        )
        with temp_engine.connect() as conn:
            pass
        print(f"[DATABASE] Connected to PostgreSQL at {settings.POSTGRES_SERVER}")
        engine = create_engine(
            db_uri,
            pool_pre_ping=True,  # Automatically check if connection is alive
            pool_size=10,        # Maximum number of database connections to keep
            max_overflow=20,     # Maximum number of connections that can be created beyond pool_size
        )
    except Exception as e:
        print(f"[DATABASE WARNING] PostgreSQL connection failed ({str(e)}). Falling back to SQLite for local session execution.")
        db_uri = "sqlite:///./researchos.db"
        engine = create_engine(
            db_uri,
            connect_args={"check_same_thread": False}
        )
else:
    engine = create_engine(
        db_uri,
        connect_args={"check_same_thread": False} if db_uri.startswith("sqlite") else {}
    )

# SessionLocal session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for DB Models
Base = declarative_base()

# Dependency to yield database sessions to API routes
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# SQLite-Compatible Column Type Decorators
class CompatibleUUID(TypeDecorator):
    impl = CHAR(36)
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(PG_UUID(as_uuid=True))
        else:
            return dialect.type_descriptor(CHAR(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        if dialect.name == "postgresql":
            return value
        else:
            return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        if dialect.name == "postgresql":
            return value
        else:
            try:
                return uuid.UUID(value)
            except ValueError:
                return value

class CompatibleJSONB(TypeDecorator):
    impl = JSON
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(PG_JSONB)
        else:
            return dialect.type_descriptor(JSON)

class CompatibleArray(TypeDecorator):
    impl = TEXT
    cache_ok = True

    def __init__(self, item_type):
        super().__init__()
        self.item_type = item_type

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(PG_ARRAY(self.item_type))
        else:
            return dialect.type_descriptor(TEXT)

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        if dialect.name == "postgresql":
            return value
        else:
            return json.dumps(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        if dialect.name == "postgresql":
            return value
        else:
            try:
                return json.loads(value)
            except Exception:
                return value
