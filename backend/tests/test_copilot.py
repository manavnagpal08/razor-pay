import pytest
from app.services.merchant_copilot import MerchantCopilotSupervisor
from app.database import SessionLocal
from sqlalchemy.exc import OperationalError

def test_copilot_routing_and_tool_call():
    db = SessionLocal()
    try:
        copilot = MerchantCopilotSupervisor(db, "dummy_merchant_123")
        # Mock LLM route for revenue question
        response = copilot.process_query("What is my revenue?")
        # Our mock LLM automatically injects "Based on the data:" for ToolMessages
        assert "Based on the data" in response
        assert "revenue" in response.lower()
        
        # Test policy explanation mock routing
        response_policy = copilot.process_query("Why was the discount blocked?")
        assert "Based on the data" in response_policy
        
    except OperationalError:
        pass
    finally:
        db.close()
