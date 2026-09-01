from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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

from app.firebase_config import init_firebase
init_firebase()

from app.api import products, ai, cart, orders, merchant, auth

app = FastAPI(title="Razorpay AI Commerce OS API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(products.router)
app.include_router(ai.router)
app.include_router(cart.router, prefix="/api")
app.include_router(orders.router, prefix="/api")
app.include_router(merchant.router, prefix="/api")

@app.on_event("startup")
def on_startup():
    from app.database import engine, Base
    try:
        Base.metadata.create_all(bind=engine)
        from scripts.seed import seed_database
        seed_database()
    except Exception as e:
        import logging
        logging.warning(f"Database auto-init on startup skipped or failed: {e}")

@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "Backend is running"}
