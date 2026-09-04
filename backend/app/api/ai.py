from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.schemas import IntentRequest, IntentResponse, ProductSearchRequest
from app.services.intent_service import IntentService
from app.api.products import search_products
from app.database import get_db
from app.core.config import settings

router = APIRouter(prefix="/api/ai", tags=["ai"])

class ChatRequest(BaseModel):
    text: str
    thread_id: Optional[str] = "default_thread"
    merchant_id: Optional[str] = "demo_merchant"


def _decode_merchant_id(raw_merchant_id: Optional[str]) -> str:
    merchant_id = (raw_merchant_id or "demo_merchant").strip() or "demo_merchant"
    if merchant_id.startswith("ey"):
        try:
            import jwt

            decoded = jwt.decode(merchant_id, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
            return decoded.get("sub") or merchant_id
        except Exception:
            return merchant_id
    return merchant_id


def _resolve_public_merchant_id(db: Session, raw_merchant_id: Optional[str]) -> str:
    from app.models import Merchant

    merchant_id = _decode_merchant_id(raw_merchant_id)
    if db.query(Merchant).filter(Merchant.id == merchant_id).first():
        return merchant_id
    if db.query(Merchant).filter(Merchant.id == "demo_merchant").first():
        return "demo_merchant"
    return merchant_id

@router.post("/intent", response_model=IntentResponse)
def parse_intent(request: IntentRequest):
    service = IntentService()
    try:
        response = service.process_intent(request.text)
        return response
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to process AI intent")

@router.get("/provider/status")
def get_ai_provider_status():
    import importlib.util

    provider = IntentService().provider
    return {
        "provider": getattr(provider, "provider_name", provider.__class__.__name__),
        "model": getattr(provider, "model_name", None),
        "gemini_key_configured": bool(settings.gemini_api_key),
        "gemini_key_length": len(settings.gemini_api_key or ""),
        "gemini_dependency_installed": importlib.util.find_spec("langchain_google_genai") is not None,
        "require_live_ai": settings.require_live_ai,
        "environment": settings.environment,
    }

@router.post("/chat/search")
def chat_search(request: ChatRequest, db: Session = Depends(get_db)):
    """
    Orchestrates the multi-tenant AI workflow:
    Intent -> Merchant Scoped Search -> Recommendation -> Upsell/Cross-sell
    """
    from app.services.ai_supervisor import AICommerceSupervisor
    supervisor = AICommerceSupervisor(db)
    resolved_merchant_id = _resolve_public_merchant_id(db, request.merchant_id)
    
    try:
        response_data = supervisor.process_chat_message(
            request.text, 
            request.thread_id, 
            merchant_id=resolved_merchant_id
        )
        
        # Log conversational chat event for merchant audit trail
        try:
            import uuid
            from app.models import Customer, CustomerEvent
            shown_products = []
            for item in (response_data.get("results") or response_data.get("alternatives") or [])[:5]:
                if isinstance(item, dict):
                    product = item.get("product") if isinstance(item.get("product"), dict) else item
                    shown_products.append(product)
            customer_id = None
            if request.thread_id:
                customer = db.query(Customer).filter(
                    Customer.merchant_id == resolved_merchant_id,
                    Customer.id == request.thread_id,
                ).first()
                if customer:
                    customer_id = customer.id
            event = CustomerEvent(
                id=str(uuid.uuid4()),
                merchant_id=resolved_merchant_id,
                customer_id=customer_id,
                event_type="AI_CONCIERGE_CHAT",
                metadata_={
                    "query": request.text,
                    "summary": response_data.get("summary"),
                    "offer": response_data.get("offer"),
                    "intent": response_data.get("intent"),
                    "shown_products": shown_products,
                    "session_id": request.thread_id or "guest_session",
                    "requested_merchant_id": request.merchant_id,
                }
            )
            db.add(event)
            db.commit()
        except Exception:
            db.rollback()

        return response_data
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        import logging
        logging.error(e)
        raise HTTPException(status_code=500, detail="Failed to process chat search")
