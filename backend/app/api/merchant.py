from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.services.analytics import AnalyticsService
from app.api.dependencies import get_current_merchant

router = APIRouter(prefix="/merchant", tags=["merchant"])

class PolicyUpdateRequest(BaseModel):
    max_discount_percent: float

@router.get("/dashboard")
def get_dashboard(db: Session = Depends(get_db), merchant_id: str = Depends(get_current_merchant)):
    service = AnalyticsService(db)
    return service.get_dashboard_metrics(merchant_id)

@router.get("/orders")
def get_orders(db: Session = Depends(get_db), merchant_id: str = Depends(get_current_merchant)):
    service = AnalyticsService(db)
    return service.get_recent_orders(merchant_id)

@router.get("/products")
def get_products(db: Session = Depends(get_db), merchant_id: str = Depends(get_current_merchant)):
    service = AnalyticsService(db)
    return service.get_top_products(merchant_id)

@router.get("/ai-activity")
def get_ai_activity(db: Session = Depends(get_db), merchant_id: str = Depends(get_current_merchant)):
    service = AnalyticsService(db)
    return service.get_ai_activity(merchant_id)

@router.get("/policies")
def get_policy(db: Session = Depends(get_db), merchant_id: str = Depends(get_current_merchant)):
    service = AnalyticsService(db)
    return service.get_merchant_policy(merchant_id)

@router.patch("/policies")
def update_policy(req: PolicyUpdateRequest, db: Session = Depends(get_db), merchant_id: str = Depends(get_current_merchant)):
    service = AnalyticsService(db)
    return service.update_merchant_policy(merchant_id, req.max_discount_percent)

class CopilotRequest(BaseModel):
    query: str

@router.post("/copilot")
def query_copilot(req: CopilotRequest, db: Session = Depends(get_db), merchant_id: str = Depends(get_current_merchant)):
    from app.services.merchant_copilot import MerchantCopilotSupervisor
    copilot = MerchantCopilotSupervisor(db, merchant_id)
    response = copilot.process_query(req.query)
    return {"response": response}

@router.get("/public/{merchant_id}")
def get_public_merchant_store(merchant_id: str, db: Session = Depends(get_db)):
    """
    Public metadata for a merchant's shareable AI storefront agent.
    Accessible without auth so customers can view store info when clicking a shared agent link.
    """
    from app.models import Merchant, Product, MerchantPolicy
    merchant = db.query(Merchant).filter(Merchant.id == merchant_id).first()
    if not merchant:
        merchant = db.query(Merchant).filter(Merchant.id == "demo_merchant").first()
    
    if not merchant:
        merchant = Merchant(id=merchant_id, name="OmniCommerce Store", currency="INR")
        
    policy = db.query(MerchantPolicy).filter(MerchantPolicy.merchant_id == merchant.id).first()
    product_count = db.query(Product).filter(Product.merchant_id == merchant.id).count()
    if product_count == 0:
        product_count = db.query(Product).count()

    return {
        "merchant_id": merchant.id,
        "name": merchant.name,
        "currency": merchant.currency or "INR",
        "product_count": product_count,
        "max_discount_allowed": float(policy.max_discount_percent) if policy else 20.0,
        "verified": True,
        "agent_name": f"{merchant.name} AI Agent",
        "welcome_message": f"Welcome to {merchant.name}! I am your autonomous AI shopping assistant. Ask me anything about our products, setups, or deals."
    }
