import uuid
from sqlalchemy.orm import Session
from app.models import Order, Cart, Payment, CustomerEvent
from app.services.cart import CartService
from app.services.razorpay_service import RazorpayService

class OrderService:
    def __init__(self, db: Session):
        self.db = db
        self.cart_service = CartService(db)

    def _get_razorpay_service_for_merchant(self, merchant_id: str = None) -> RazorpayService:
        from app.models import MerchantPolicy
        if merchant_id:
            policy = self.db.query(MerchantPolicy).filter(MerchantPolicy.merchant_id == merchant_id).first()
            if policy and isinstance(policy.approval_rules, dict):
                rzp_conf = policy.approval_rules.get("razorpay_credentials", {})
                if isinstance(rzp_conf, dict) and rzp_conf.get("key_id") and rzp_conf.get("key_secret"):
                    return RazorpayService(
                        key_id=rzp_conf.get("key_id"),
                        key_secret=rzp_conf.get("key_secret")
                    )
        return RazorpayService()

    def create_order_from_cart(self, cart_id: str) -> dict:
        """
        Creates an internal Order and Razorpay order from a Cart using merchant-specific credentials.
        """
        # Revalidate cart
        cart_resp = self.cart_service.get_cart_response(cart_id)
        if not cart_resp.validation.valid:
            raise ValueError(f"Cart validation failed: {', '.join(cart_resp.validation.issues)}")
            
        if cart_resp.total <= 0:
            raise ValueError("Cart total must be greater than zero.")
            
        # Create Internal Order
        cart_model = self.db.query(Cart).filter(Cart.id == cart_id).first()
        internal_order = Order(
            id=str(uuid.uuid4()),
            cart_id=cart_id,
            customer_id=cart_model.customer_id,
            merchant_id=cart_model.merchant_id,
            amount=cart_resp.total,
            currency="INR",
            status="CREATED"
        )
        self.db.add(internal_order)
        self.db.commit()
        
        # Create Razorpay Order with merchant's specific Razorpay account
        rzp_service = self._get_razorpay_service_for_merchant(cart_model.merchant_id)
        rzp_order_id, rzp_status = rzp_service.create_order(
            amount_inr=float(cart_resp.total),
            receipt=internal_order.id,
            notes={"cart_id": cart_id}
        )
        
        # Update Internal Order
        internal_order.razorpay_order_id = rzp_order_id
        internal_order.status = "PAYMENT_PENDING"
        
        # Log Event
        event = CustomerEvent(
            id=str(uuid.uuid4()),
            event_type="ORDER_CREATED",
            metadata_={"order_id": internal_order.id, "razorpay_order_id": rzp_order_id}
        )
        self.db.add(event)
        self.db.commit()
        
        return {
            "internal_order_id": internal_order.id,
            "razorpay_order_id": rzp_order_id,
            "amount": float(internal_order.amount),
            "currency": internal_order.currency,
            "key_id": rzp_service.key_id
        }

    def verify_payment(self, internal_order_id: str, rzp_payment_id: str, rzp_order_id: str, signature: str) -> dict:
        """
        Verifies payment signature using merchant-specific Razorpay secret.
        """
        order = self.db.query(Order).filter(Order.id == internal_order_id).first()
        if not order:
            raise ValueError("Order not found")
            
        if order.status == "PAID":
            # Idempotent response
            return {"success": True, "order_id": order.id, "payment_status": "PAID"}
            
        if order.razorpay_order_id != rzp_order_id:
            raise ValueError("Razorpay Order ID mismatch")
            
        # Verify Signature with merchant's specific key secret
        rzp_service = self._get_razorpay_service_for_merchant(order.merchant_id)
        is_valid = rzp_service.verify_payment_signature(rzp_order_id, rzp_payment_id, signature)
        
        # Record Payment
        payment = Payment(
            id=str(uuid.uuid4()),
            order_id=order.id,
            merchant_id=order.merchant_id,
            razorpay_payment_id=rzp_payment_id,
            amount=order.amount,
            status="CAPTURED" if is_valid else "FAILED"
        )
        self.db.add(payment)
        
        if not is_valid:
            order.status = "FAILED"
            self.db.commit()
            return {"success": False, "order_id": order.id, "payment_status": "FAILED", "message": "Signature verification failed."}
            
        order.status = "PAID"
        
        # Mark cart inactive
        cart = self.db.query(Cart).filter(Cart.id == order.cart_id).first()
        if cart:
            cart.status = "completed"
            
        # Log event
        event = CustomerEvent(
            id=str(uuid.uuid4()),
            event_type="ORDER_PAID",
            metadata_={"order_id": order.id, "razorpay_payment_id": rzp_payment_id}
        )
        self.db.add(event)
        self.db.commit()
        
        return {"success": True, "order_id": order.id, "payment_status": "CAPTURED"}
