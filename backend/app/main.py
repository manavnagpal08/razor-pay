from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

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