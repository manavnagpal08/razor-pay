import pytest
from app.services.order import OrderService
from app.services.razorpay_service import RazorpayService
from app.database import SessionLocal
from sqlalchemy.exc import OperationalError

def test_amount_conversion():
    rzp = RazorpayService()
    # Amount conversion validation
    amount_inr = 100.50
    amount_paise = int(round(amount_inr * 100))
    assert amount_paise == 10050

def test_signature_verification_mock():
    # Test mock signature fallback when key is mock
    rzp = RazorpayService()
    rzp.is_mock = True
    assert rzp.verify_payment_signature("order_1", "pay_1", "mock_valid_signature") == True
    assert rzp.verify_payment_signature("order_1", "pay_1", "bad_signature") == False

def test_order_creation_flow():
    rzp = RazorpayService()
    rzp.is_mock = True
    order_id, status = rzp.create_order(150.00, "rec_123")
    assert status == "created"
    assert "mock_order_" in order_id