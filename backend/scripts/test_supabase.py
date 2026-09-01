import os
from sqlalchemy import create_engine, text

urls = [
    "postgresql://postgres:wz474hxktt%23Y%2B%26Y@db.wvjdygfjjtldghaddrgf.supabase.co:5432/postgres?sslmode=require",
    "postgresql://postgres:wz474hxktt%23Y%2B%26Y@db.wvjdygfjjtldghaddrgf.supabase.co:6543/postgres?sslmode=require",
    "postgresql://postgres.wvjdygfjjtldghaddrgf:wz474hxktt%23Y%2B%26Y@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require",
    "postgresql://postgres.wvjdygfjjtldghaddrgf:wz474hxktt%23Y%2B%26Y@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require"
]

working_url = None
for url in urls:
    host_info = url.split("@")[1]
    try:
        print(f"Testing connection to: {host_info}...")
        eng = create_engine(url, connect_args={"connect_timeout": 8})
        with eng.connect() as conn:
            res = conn.execute(text("SELECT 1")).scalar()
            print(f"SUCCESS! Connected with result: {res}")
            working_url = url
            break
    except Exception as e:
        print(f"Failed to connect to {host_info}: {e}")

if working_url:
    print(f"\nACTIVE SUPABASE DATABASE URL:\n{working_url}")