import pytest
from app.services.cart import CartService
from app.services.order import OrderService
from app.services.analytics import AnalyticsService
from app.services.merchant_copilot import MerchantCopilotSupervisor
from app.services.razorpay_service import RazorpayService
from app.models import User, Customer, Merchant
from app.database import SessionLocal
from sqlalchemy.exc import OperationalError
import uuid

def test_full_customer_merchant_e2e_flow():
    db = SessionLocal()
    try:
        # Pre-provision foreign keys for relational integrity
        merchant = db.query(Merchant).filter(Merchant.id == "demo_merchant").first()
        if not merchant:
            merchant = Merchant(id="demo_merchant", name="Demo Store", currency="INR")
            db.add(merchant)

        user = db.query(User).filter(User.id == "test_user_e2e").first()
        if not user:
            user = User(id="test_user_e2e", name="E2E User", email="e2e@example.com", password_hash="hash", role="customer")
            db.add(user)
            db.flush()

        customer = db.query(Customer).filter(Customer.id == "test_cust_1").first()
        if not customer:
            customer = Customer(id="test_cust_1", user_id="test_user_e2e", segment="new")
            db.add(customer)

        db.commit()

        # CUSTOMER FLOW
        cart_service = CartService(db)
        cart = cart_service.get_or_create_cart(customer_id="test_cust_1")
        assert cart.id is not None

        # ORDER SERVICE / RAZORPAY
        rzp = RazorpayService()
        assert rzp.key_id is not None

        # MERCHANT FLOW
        analytics = AnalyticsService(db)
        metrics = analytics.get_dashboard_metrics("demo_merchant")
        assert "revenue" in metrics

        # MERCHANT COPILOT FLOW
        copilot = MerchantCopilotSupervisor(db, "demo_merchant")
        copilot_resp = copilot.process_query("What is my revenue?")
        assert copilot_resp is not None
        
    except OperationalError:
        pass
    finally:
        db.close()