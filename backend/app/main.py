import time
from collections import defaultdict, deque

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

from app.firebase_config import init_firebase
init_firebase()

from app.api import products, ai, cart, orders, merchant, auth, agent_protocol

app = FastAPI(title="Razorpay AI Commerce OS API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins if settings.cors_origins else ["*"],
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

request_windows = defaultdict(deque)


@app.middleware("http")
async def rate_limit_requests(request: Request, call_next):
    if request.url.path == "/api/health":
        return await call_next(request)

    client_host = request.client.host if request.client else "unknown"
    now = time.monotonic()
    window = request_windows[client_host]

    while window and now - window[0] > 60:
        window.popleft()

    if len(window) >= settings.rate_limit_per_minute:
        return JSONResponse(
            status_code=429,
            content={"detail": "Too many requests. Please retry shortly."},
        )

    window.append(now)
    return await call_next(request)

app.include_router(auth.router, prefix="/api")
app.include_router(products.router)
app.include_router(ai.router)
app.include_router(cart.router, prefix="/api")
app.include_router(orders.router, prefix="/api")
app.include_router(merchant.router, prefix="/api")
app.include_router(agent_protocol.router)
from app.api import chat_auth
app.include_router(chat_auth.router)

@app.get("/.well-known/agent.json")
def well_known_agent_manifest():
    return agent_protocol.get_agent_protocol_manifest()

@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "Backend is running"}
