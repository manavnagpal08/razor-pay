import os
import sys

# Ensure backend root is in sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

supabase_url = os.environ.get("DATABASE_URL")
if not supabase_url:
    raise RuntimeError("DATABASE_URL must be set before running setup_supabase.py")
if not os.environ.get("GEMINI_API_KEY"):
    raise RuntimeError("GEMINI_API_KEY must be set before running setup_supabase.py")
os.environ["DATABASE_URL"] = supabase_url

from sqlalchemy import create_engine, text
from app.models import Base
from scripts.seed import seed_database

engine = create_engine(supabase_url)

print("1. Enabling pgvector extension on Supabase...")
with engine.connect() as conn:
    conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
    conn.commit()
print("[OK] pgvector enabled on Supabase!")

print("2. Creating all schema tables on Supabase...")
Base.metadata.create_all(bind=engine)
print("[OK] All tables created on Supabase PostgreSQL!")

print("3. Seeding enterprise product catalog & Gemini vector embeddings...")
seed_database()
print("[OK] Enterprise database seed complete on live Supabase!")
