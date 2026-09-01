import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(__file__), "..", "..", ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    database_url: str = "postgresql://user:password@localhost:5432/razorpay_ai_commerce"
    razorpay_key_id: str = "test"
    razorpay_key_secret: str = "test"
    gemini_api_key: str = ""
    jwt_secret: str = "super-secret-key-for-development-only"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7 # 7 days

settings = Settings()