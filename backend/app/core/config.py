import os

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


DEV_DATABASE_URL = "sqlite:///./dev.db"
DEV_JWT_SECRET = "dev-only-change-me"
DEV_RAZORPAY_KEY_ID = "test"
DEV_RAZORPAY_KEY_SECRET = "test"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(__file__), "..", "..", ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
        populate_by_name=True,
    )

    environment: str = Field(default="development", alias="ENVIRONMENT")
    database_url: str = Field(default=DEV_DATABASE_URL, alias="DATABASE_URL")
    razorpay_key_id: str = Field(default=DEV_RAZORPAY_KEY_ID, alias="RAZORPAY_KEY_ID")
    razorpay_key_secret: str = Field(default=DEV_RAZORPAY_KEY_SECRET, alias="RAZORPAY_KEY_SECRET")
    razorpay_webhook_secret: str = Field(default="", alias="RAZORPAY_WEBHOOK_SECRET")
    gemini_api_key: str = Field(default="", alias="GEMINI_API_KEY")
    jwt_secret: str = Field(default=DEV_JWT_SECRET, alias="JWT_SECRET")
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7
    cors_origins: list[str] = Field(
        default_factory=lambda: [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ],
        alias="CORS_ORIGINS",
    )
    agent_api_keys: list[str] = Field(default_factory=list, alias="AGENT_API_KEYS")
    rate_limit_per_minute: int = Field(default=120, alias="RATE_LIMIT_PER_MINUTE")
    require_live_ai: bool = Field(default=False, alias="REQUIRE_LIVE_AI")

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value):
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    @field_validator("agent_api_keys", mode="before")
    @classmethod
    def parse_agent_api_keys(cls, value):
        if isinstance(value, str):
            return [key.strip() for key in value.split(",") if key.strip()]
        return value

    @model_validator(mode="after")
    def validate_production_secrets(self):
        if self.environment.lower() in {"production", "prod"}:
            missing = []
            if not self.database_url or self.database_url == DEV_DATABASE_URL:
                missing.append("DATABASE_URL")
            if not self.jwt_secret or self.jwt_secret == DEV_JWT_SECRET or len(self.jwt_secret) < 32:
                missing.append("JWT_SECRET")
            if not self.razorpay_key_id or self.razorpay_key_id == DEV_RAZORPAY_KEY_ID:
                missing.append("RAZORPAY_KEY_ID")
            if not self.razorpay_key_secret or self.razorpay_key_secret == DEV_RAZORPAY_KEY_SECRET:
                missing.append("RAZORPAY_KEY_SECRET")
            if not self.razorpay_webhook_secret:
                missing.append("RAZORPAY_WEBHOOK_SECRET")
            if not self.agent_api_keys:
                missing.append("AGENT_API_KEYS")
            if self.require_live_ai and not self.gemini_api_key:
                missing.append("GEMINI_API_KEY")
            if missing:
                raise ValueError(f"Missing production settings: {', '.join(missing)}")
        return self


settings = Settings()
