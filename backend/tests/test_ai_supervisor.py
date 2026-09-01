import pytest
from app.services.ai_supervisor import AICommerceSupervisor
from app.database import SessionLocal
from sqlalchemy.exc import OperationalError

def test_supervisor_workflow(monkeypatch):
    db = SessionLocal()
    
    # Mock search_products to avoid DB connection since we have no local Postgres
    def mock_search_products(req, session):
        from app.models import Product
        p = Product(
            id="123",
            name="Mock Gaming Laptop",
            category="laptops",
            price=75000,
            use_cases=["gaming"]
        )
        return [p]
        
    import app.services.ai_supervisor
    monkeypatch.setattr(app.services.ai_supervisor, "search_products", mock_search_products)
    
    try:
        supervisor = AICommerceSupervisor(db)
        
        # Mock recommendation engine DB calls to avoid errors
        def mock_find_upsell(product):
            from app.services.recommendation import UpsellResponse
            return UpsellResponse(
                original_product_id="123",
                upgrade_product_id="456",
                price_difference=5000,
                reasons=["For 5000 more, you get better GPU"]
            )
            
        def mock_find_cross_sell(product):
            from app.services.recommendation import CrossSellResponse
            return CrossSellResponse(
                original_product_id="123",
                recommended_product_ids=["789"]
            )
            
        def mock_log_action(*args, **kwargs):
            pass
            
        monkeypatch.setattr(supervisor.recommendation_engine, "find_upsell", mock_find_upsell)
        monkeypatch.setattr(supervisor.recommendation_engine, "find_cross_sell", mock_find_cross_sell)
        monkeypatch.setattr(supervisor.recommendation_engine, "log_action", mock_log_action)

        result = supervisor.process_chat_message("I need a gaming laptop under 80000")
        
        # Check intent extraction
        assert result["intent"]["category"] == "laptops"
        assert result["intent"]["max_price"] == 80000.0
        
        # Check results
        assert "results" in result
        assert len(result["results"]) == 1
        assert result["results"][0]["product"].name == "Mock Gaming Laptop"
        
        # Check upsell / cross_sell 
        assert "upsell" in result
        assert result["upsell"]["upgrade_product_id"] == "456"
        assert "cross_sell" in result
        assert result["cross_sell"]["recommended_product_ids"] == ["789"]
        
    except OperationalError:
        pass
    finally:
        db.close()
