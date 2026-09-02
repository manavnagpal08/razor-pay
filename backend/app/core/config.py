import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(__file__), "..", "..", ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # Supabase PostgreSQL Pooler
    database_url: str = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres.wvjdygfjjtldghaddrgf:wz474hxktt%23Y%2B%26Y@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require"
    )
    
    # Razorpay Test Credentials
    razorpay_key_id: str = os.getenv("RAZORPAY_KEY_ID", "rzp_test_TWpQWcihNk3rD9")
    razorpay_key_secret: str = os.getenv("RAZORPAY_KEY_SECRET", "KEdqU5Tc05yCS5GeR59ZvEKA")
    
    # Google Gemini API
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "AQ.Ab8RN6IpQrvyIxVtU2zSjmMPWiZHi3jz291EGnSOy1NyuxgDtQ")
    
    # JWT Security
    jwt_secret: str = os.getenv("JWT_SECRET", "razorpay-commerce-production-secret-2026")
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7 # 7 days

settings = Settings()