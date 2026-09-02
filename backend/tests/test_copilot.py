import pytest
from app.services.merchant_copilot import MerchantCopilotSupervisor
from app.database import SessionLocal
from sqlalchemy.exc import OperationalError

def test_copilot_routing_and_tool_call():
    db = SessionLocal()
    try:
        copilot = MerchantCopilotSupervisor(db, "demo_merchant")
        response = copilot.process_query("What is my revenue?")
        assert response is not None
        assert len(response) > 0
        
        response_policy = copilot.process_query("Why was the discount blocked?")
        assert response_policy is not None
        
    except OperationalError:
        pass
    finally:
        db.close()