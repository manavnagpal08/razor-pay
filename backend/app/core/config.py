import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/razorpay_ai_commerce")
    razorpay_key_id: str = os.getenv("RAZORPAY_KEY_ID", "test")
    razorpay_key_secret: str = os.getenv("RAZORPAY_KEY_SECRET", "test")
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
    jwt_secret: str = os.getenv("JWT_SECRET", "super-secret-key-for-development-only")
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7 # 7 days

settings = Settings()