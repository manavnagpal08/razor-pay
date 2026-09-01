import hmac
import hashlib
from typing import Dict, Any, Tuple

class RazorpayService:
    """
    Abstracts Razorpay Test Mode integration.
    Falls back to a MOCK provider if no real credentials are set.
    """
    def __init__(self):
        from app.core.config import settings
        self.key_id = settings.razorpay_key_id
        self.key_secret = settings.razorpay_key_secret
        self.is_mock = self.key_id == "test" or not self.key_id
        
        if not self.is_mock:
            # Import razorpay SDK lazily
            import razorpay
            self.client = razorpay.Client(auth=(self.key_id, self.key_secret))
            
    def create_order(self, amount_inr: float, receipt: str, notes: Dict[str, str] = None) -> Tuple[str, str]:
        """
        Takes decimal amount in INR, converts to paise, and creates Razorpay order.
        Returns: (razorpay_order_id, status)
        """
        # Strictly convert INR decimal to paise (integer)
        amount_paise = int(round(amount_inr * 100))
        
        if amount_paise <= 0:
            raise ValueError("Amount must be greater than zero.")
            
        if self.is_mock:
            import uuid
            mock_order_id = f"mock_order_{uuid.uuid4().hex[:10]}"
            return mock_order_id, "created"
            
        data = {
            "amount": amount_paise,
            "currency": "INR",
            "receipt": receipt,
            "notes": notes or {}
        }
        
        try:
            order = self.client.order.create(data=data)
            return order["id"], order["status"]
        except Exception as e:
            raise ValueError(f"Razorpay API Error: {str(e)}")
            
    def verify_payment_signature(self, razorpay_order_id: str, razorpay_payment_id: str, signature: str) -> bool:
        """
        Verifies the HMAC-SHA256 signature from Razorpay checkout.
        """
        if self.is_mock:
            # In mock mode, if signature equals a dummy string, accept it.
            return signature == "mock_valid_signature"
            
        msg = f"{razorpay_order_id}|{razorpay_payment_id}"
        expected_signature = hmac.new(
            self.key_secret.encode('utf-8'),
            msg.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(expected_signature, signature)

    def verify_webhook_signature(self, payload_body: str, webhook_signature: str, webhook_secret: str) -> bool:
        """
        Verifies the HMAC-SHA256 signature for Razorpay Webhooks.
        """
        if self.is_mock:
            return webhook_signature == "mock_valid_webhook_signature"
            
        expected_signature = hmac.new(
            webhook_secret.encode('utf-8'),
            payload_body.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(expected_signature, webhook_signature)
