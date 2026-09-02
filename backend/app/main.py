from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

from app.firebase_config import init_firebase
init_firebase()

from app.api import products, ai, cart, orders, merchant, auth, agent_protocol

app = FastAPI(title="Razorpay AI Commerce OS API")

# Configure CORS to explicitly allow Vercel and local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://razorpay-buildthon.vercel.app",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
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
app.include_router(agent_protocol.router)

@app.get("/.well-known/agent.json")
def well_known_agent_manifest():
    return agent_protocol.get_agent_protocol_manifest()

@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "Backend is running"}