from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

DATABASE_URL = settings.database_url

if "sqlite" in DATABASE_URL:
    engine = create_engine(
        DATABASE_URL,
        echo=False,
        connect_args={"check_same_thread": False}
    )
else:
    engine = create_engine(
        DATABASE_URL, 
        echo=False,
        pool_size=5,
        max_overflow=10,
        pool_pre_ping=True
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def init_dev_database():
    if "sqlite" not in DATABASE_URL:
        return
    import app.models  # noqa: F401
    Base.metadata.create_all(bind=engine)


init_dev_database()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
