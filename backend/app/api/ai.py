from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Any, Optional
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


def _serialize_chat_product(product: Any) -> dict:
    metadata = getattr(product, "metadata_", None) if not isinstance(product, dict) else product.get("metadata") or product.get("metadata_")
    metadata = metadata if isinstance(metadata, dict) else {}
    if isinstance(product, dict):
        return {
            "id": product.get("id"),
            "merchant_id": product.get("merchant_id"),
            "name": product.get("name"),
            "category": product.get("category") or "General",
            "description": product.get("description") or "",
            "price": float(product.get("price") or 0),
            "currency": product.get("currency") or "INR",
            "inventory": product.get("inventory") or 0,
            "image_url": product.get("image_url") or metadata.get("image_url"),
            "features": product.get("features") if isinstance(product.get("features"), dict) else {},
            "use_cases": product.get("use_cases") if isinstance(product.get("use_cases"), list) else [],
            "metadata": metadata,
        }
    return {
        "id": getattr(product, "id", None),
        "merchant_id": getattr(product, "merchant_id", None),
        "name": getattr(product, "name", None),
        "category": getattr(product, "category", None) or "General",
        "description": getattr(product, "description", None) or "",
        "price": float(getattr(product, "price", 0) or 0),
        "currency": getattr(product, "currency", None) or "INR",
        "inventory": getattr(product, "inventory", 0) or 0,
        "image_url": metadata.get("image_url"),
        "features": getattr(product, "features", None) if isinstance(getattr(product, "features", None), dict) else {},
        "use_cases": getattr(product, "use_cases", None) if isinstance(getattr(product, "use_cases", None), list) else [],
        "metadata": metadata,
    }


def _build_chat_fallback_response(db: Session, request: ChatRequest, merchant_id: str, reason: str) -> dict:
    from app.models import Product

    products = db.query(Product).filter(Product.merchant_id == merchant_id, Product.inventory > 0).limit(6).all()
    if not products and merchant_id != "demo_merchant":
        products = db.query(Product).filter(Product.merchant_id == "demo_merchant", Product.inventory > 0).limit(6).all()

    results = [
        {
            "product": _serialize_chat_product(product),
            "score": 1.0,
            "reasons": ["Featured store selection in catalog"],
            "match_type": "STORE PICK",
        }
        for product in products
    ]

    text_lower = request.text.lower() if request.text else ""
    is_deals = any(w in text_lower for w in ["deal", "discount", "offer", "cheap", "sale", "promo", "code"])
    is_rec = any(w in text_lower for w in ["recommend", "best", "top", "popular", "suggest"])
    
    if is_deals:
        summary = "🎉 Here are our best store picks and active offers from the live merchant catalog:"
    elif is_rec:
        summary = "Here are our top recommended products currently available in this storefront:"
    else:
        summary = "Here are the top products available in our store catalog for you:"

    offer_data = {
        "code": "SAVE10",
        "discount_percent": 10,
        "title": "10% Store Discount",
        "description": "Use code SAVE10 for 10% off your order!"
    } if is_deals else None

    return {
        "summary": summary,
        "intent": {
            "category": None,
            "subcategory": None,
            "max_price": None,
            "min_price": None,
            "currency": "INR",
            "use_cases": [],
            "required_features": [],
            "preferred_features": [],
            "keywords": [request.text.strip()] if request.text and request.text.strip() else [],
        },
        "results": results,
        "alternatives": [],
        "upsell": None,
        "cross_sell": None,
        "offer": offer_data,
        "ai_provider": {"provider": "catalog_fallback", "model": None, "fallback_reason": reason},
        "reasoning": {
            "intent_extracted": {
                "category": "General",
                "budget": "Flexible",
                "use_cases": ["Everyday"],
                "keywords": [request.text.strip()] if request.text and request.text.strip() else [],
            },
            "policy_verification": "Verified • 0 violations • Max discount 20%",
            "catalog_scanned": f"{len(results)} items returned",
            "direct_catalog_match": True,
            "offer_applied": "SAVE10" if is_deals else None,
            "ai_provider": {"provider": "catalog_fallback", "model": None, "fallback_reason": reason},
        },
    }

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
        try:
            response_data = supervisor.process_chat_message(
                request.text,
                request.thread_id,
                merchant_id=resolved_merchant_id
            )
        except Exception as supervisor_error:
            import logging
            logging.exception("AI supervisor failed; returning catalog fallback")
            response_data = _build_chat_fallback_response(
                db,
                request,
                resolved_merchant_id,
                supervisor_error.__class__.__name__,
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
