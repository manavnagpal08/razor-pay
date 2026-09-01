from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.schemas import IntentRequest, IntentResponse, ProductSearchRequest
from app.services.intent_service import IntentService
from app.api.products import search_products
from app.database import get_db

router = APIRouter(prefix="/api/ai", tags=["ai"])

class ChatRequest(BaseModel):
    text: str
    thread_id: Optional[str] = "default_thread"

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

@router.post("/chat/search")
def chat_search(request: ChatRequest, db: Session = Depends(get_db)):
    """
    Orchestrates the Phase 05 AI workflow:
    Intent -> Search -> Recommendation -> Upsell/Cross-sell
    """
    from app.services.ai_supervisor import AICommerceSupervisor
    supervisor = AICommerceSupervisor(db)
    
    try:
        response_data = supervisor.process_chat_message(request.text, request.thread_id)
        return response_data
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        import logging
        logging.error(e)
        raise HTTPException(status_code=500, detail="Failed to process chat search")
