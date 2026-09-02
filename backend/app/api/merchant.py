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

@router.get("/logs")
def get_logs(db: Session = Depends(get_db), merchant_id: str = Depends(get_current_merchant)):
    service = AnalyticsService(db)
    return service.get_system_logs(merchant_id)

class MerchantOnboardRequest(BaseModel):
    store_name: str
    currency: str = "INR"
    max_discount_percent: float = 20.0
    catalog_preset: str = "all"
    welcome_message: str | None = None

@router.post("/onboard")
def onboard_merchant(req: MerchantOnboardRequest, db: Session = Depends(get_db)):
    import re, uuid
    from app.models import Merchant, MerchantPolicy, Product
    
    clean_name = req.store_name.strip()
    slug = re.sub(r'[^a-zA-Z0-9]', '_', clean_name.lower())[:15]
    merchant_id = f"store_{slug}_{str(uuid.uuid4())[:6]}"
    
    merchant = Merchant(
        id=merchant_id,
        name=clean_name,
        currency=req.currency
    )
    db.add(merchant)
    
    policy = MerchantPolicy(
        id=str(uuid.uuid4()),
        merchant_id=merchant_id,
        max_discount_percent=req.max_discount_percent,
        max_discount_amount=req.max_discount_percent * 500
    )
    db.add(policy)
    
    base_products = db.query(Product).filter(Product.merchant_id == "demo_merchant").all()
    if not base_products:
        base_products = db.query(Product).all()
        
    created_count = 0
    for p in base_products:
        if req.catalog_preset == "audio" and p.category != "Audio":
            continue
        if req.catalog_preset == "laptops" and p.category != "Laptops":
            continue
            
        new_prod = Product(
            id=f"{merchant_id}_{p.id[:8]}",
            merchant_id=merchant_id,
            name=p.name,
            category=p.category,
            description=p.description,
            price=p.price,
            currency=p.currency or "INR",
            inventory=25,
            features=p.features,
            use_cases=p.use_cases,
            metadata_=p.metadata_
        )
        db.add(new_prod)
        created_count += 1
        
    db.commit()
    
    base_url = "https://razorpay-buildthon.vercel.app"
    shareable_chat_url = f"{base_url}/chat?merchant={merchant_id}"
    manifest_url = f"{base_url}/api/agent/manifest?merchant={merchant_id}"
    embed_code = f'<iframe src="{shareable_chat_url}" width="100%" height="700" frameborder="0" style="border-radius: 24px; box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1);"></iframe>'
    
    return {
        "success": True,
        "merchant_id": merchant_id,
        "store_name": merchant.name,
        "product_count": created_count,
        "max_discount_percent": req.max_discount_percent,
        "shareable_chat_url": shareable_chat_url,
        "manifest_url": manifest_url,
        "embed_code": embed_code,
        "welcome_message": req.welcome_message or f"Welcome to {merchant.name}! Ask me anything to discover matching products."
    }

@router.get("/stores")
def list_stores(db: Session = Depends(get_db)):
    from app.models import Merchant, Product, MerchantPolicy
    merchants = db.query(Merchant).order_by(Merchant.created_at.desc()).limit(20).all()
    result = []
    for m in merchants:
        prod_count = db.query(Product).filter(Product.merchant_id == m.id).count()
        policy = db.query(MerchantPolicy).filter(MerchantPolicy.merchant_id == m.id).first()
        result.append({
            "id": m.id,
            "name": m.name,
            "currency": m.currency,
            "product_count": prod_count,
            "max_discount_percent": float(policy.max_discount_percent) if policy else 20.0,
            "shareable_url": f"https://razorpay-buildthon.vercel.app/chat?merchant={m.id}"
        })
    return result

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
