import uuid
from sqlalchemy.orm import Session
from app.models import Order, Cart, CartItem, Product, Payment, CustomerEvent, AgentAction
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
        cart_model = self.db.query(Cart).filter(Cart.id == cart_id).first()
        if not cart_model:
            raise ValueError("Cart not found")
        if cart_model.status != "active":
            raise ValueError("Cart is no longer active.")

        # Revalidate cart
        cart_resp = self.cart_service.get_cart_response(cart_id)
        if not cart_resp.validation.valid:
            raise ValueError(f"Cart validation failed: {', '.join(cart_resp.validation.issues)}")
            
        if cart_resp.total <= 0:
            raise ValueError("Cart total must be greater than zero.")
            
        resolved_merchant_id = cart_model.merchant_id
        items = self.db.query(CartItem).filter(CartItem.cart_id == cart_id).all()
        if not items:
            raise ValueError("Cart is empty.")

        product_ids = [item.product_id for item in items]
        locked_products = self.db.query(Product).filter(Product.id.in_(product_ids)).with_for_update().all()
        products_by_id = {product.id: product for product in locked_products}

        for item in items:
            product = products_by_id.get(item.product_id)
            if not product:
                raise ValueError(f"Product {item.product_id} no longer exists.")
            if resolved_merchant_id and product.merchant_id != resolved_merchant_id:
                raise ValueError("Cart contains products from multiple merchants.")
            resolved_merchant_id = product.merchant_id or resolved_merchant_id
            if product.inventory < item.quantity:
                raise ValueError(f"Product {product.name} has insufficient inventory.")
            product.inventory -= item.quantity

        cart_model.merchant_id = resolved_merchant_id
        cart_model.status = "payment_pending"

        internal_order = Order(
            id=str(uuid.uuid4()),
            cart_id=cart_id,
            customer_id=cart_model.customer_id,
            merchant_id=resolved_merchant_id,
            amount=cart_resp.total,
            currency="INR",
            status="CREATED"
        )
        self.db.add(internal_order)
        self.db.commit()
        
        # Create Razorpay Order with merchant's specific Razorpay account
        rzp_service = self._get_razorpay_service_for_merchant(resolved_merchant_id)
        try:
            rzp_order_id, rzp_status = rzp_service.create_order(
                amount_inr=float(cart_resp.total),
                receipt=internal_order.id,
                notes={"cart_id": cart_id}
            )
        except Exception:
            for item in items:
                product = products_by_id.get(item.product_id)
                if product:
                    product.inventory += item.quantity
            cart_model.status = "active"
            internal_order.status = "FAILED"
            self.db.commit()
            raise
        
        # Update Internal Order
        internal_order.razorpay_order_id = rzp_order_id
        internal_order.status = "PAYMENT_PENDING"
        
        # Log Event
        event = CustomerEvent(
            id=str(uuid.uuid4()),
            merchant_id=resolved_merchant_id,
            customer_id=cart_model.customer_id,
            event_type="ORDER_CREATED",
            metadata_={"order_id": internal_order.id, "razorpay_order_id": rzp_order_id}
        )
        action = AgentAction(
            id=str(uuid.uuid4()),
            merchant_id=resolved_merchant_id,
            agent_name="CheckoutAgent",
            action_type="CHECKOUT_ORDER_CREATED",
            input={"cart_id": cart_id},
            decision={
                "internal_order_id": internal_order.id,
                "razorpay_order_id": rzp_order_id,
                "amount": float(internal_order.amount),
                "currency": internal_order.currency,
            },
            reason="Server recalculated the cart total and created a Razorpay order from the authoritative amount.",
            policy_result={
                "allowed": True,
                "amount_source": "server_cart_recalculation",
                "inventory_reserved": True,
            },
            execution_status="PAYMENT_PENDING",
            entity_type="order",
            entity_id=internal_order.id,
        )
        self.db.add_all([event, action])
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
            
        # Re-resolve merchant_id if needed
        if order.merchant_id in ["demo_merchant", None]:
            first_item = self.db.query(CartItem).filter(CartItem.cart_id == order.cart_id).first()
            if first_item:
                item_prod = self.db.query(Product).filter(Product.id == first_item.product_id).first()
                if item_prod and item_prod.merchant_id:
                    order.merchant_id = item_prod.merchant_id

        # Verify Signature with merchant's specific key secret
        rzp_service = self._get_razorpay_service_for_merchant(order.merchant_id)
        is_valid = rzp_service.verify_payment_signature(rzp_order_id, rzp_payment_id, signature)
        
        payment = self.db.query(Payment).filter(Payment.razorpay_payment_id == rzp_payment_id).first()
        if not payment:
            payment = Payment(
                id=str(uuid.uuid4()),
                order_id=order.id,
                merchant_id=order.merchant_id,
                razorpay_payment_id=rzp_payment_id,
                amount=order.amount,
                status="CAPTURED" if is_valid else "FAILED"
            )
            self.db.add(payment)
        else:
            payment.status = "CAPTURED" if is_valid else "FAILED"
        
        if not is_valid:
            order.status = "FAILED"
            cart = self.db.query(Cart).filter(Cart.id == order.cart_id).first()
            if cart and cart.status == "payment_pending":
                items = self.db.query(CartItem).filter(CartItem.cart_id == cart.id).all()
                product_ids = [item.product_id for item in items]
                products = self.db.query(Product).filter(Product.id.in_(product_ids)).with_for_update().all()
                products_by_id = {product.id: product for product in products}
                for item in items:
                    product = products_by_id.get(item.product_id)
                    if product:
                        product.inventory += item.quantity
                cart.status = "active"
            action = AgentAction(
                id=str(uuid.uuid4()),
                merchant_id=order.merchant_id,
                agent_name="CheckoutAgent",
                action_type="PAYMENT_VERIFICATION_FAILED",
                input={"internal_order_id": internal_order_id, "razorpay_order_id": rzp_order_id},
                decision={"payment_status": "FAILED"},
                reason="Razorpay payment signature verification failed.",
                policy_result={
                    "allowed": False,
                    "verification": "hmac_signature_invalid",
                    "inventory_released": True,
                },
                execution_status="FAILED",
                entity_type="order",
                entity_id=order.id,
            )
            self.db.add(action)
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
            merchant_id=order.merchant_id,
            customer_id=order.customer_id,
            event_type="ORDER_PAID",
            metadata_={"order_id": order.id, "razorpay_payment_id": rzp_payment_id}
        )
        action = AgentAction(
            id=str(uuid.uuid4()),
            merchant_id=order.merchant_id,
            agent_name="CheckoutAgent",
            action_type="PAYMENT_VERIFIED",
            input={"internal_order_id": internal_order_id, "razorpay_order_id": rzp_order_id},
            decision={"payment_status": "PAID", "razorpay_payment_id": rzp_payment_id},
            reason="Backend verified the Razorpay signature before marking the order paid.",
            policy_result={"allowed": True, "verification": "hmac_signature_valid"},
            execution_status="SUCCESS",
            entity_type="order",
            entity_id=order.id,
        )
        self.db.add_all([event, action])
        self.db.commit()
        
        return {"success": True, "order_id": order.id, "payment_status": "PAID"}
