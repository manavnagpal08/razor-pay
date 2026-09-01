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
