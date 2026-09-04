from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
import json
import logging
import hashlib
from app.database import get_db
from app.core.config import settings
from app.services.order import OrderService
from app.api.dependencies import get_current_customer
from app.models import Order, Cart, Payment, CustomerEvent, AgentAction
import uuid

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/orders", tags=["orders"])

class CreateOrderRequest(BaseModel):
    cart_id: str

class VerifyPaymentRequest(BaseModel):
    internal_order_id: str
    razorpay_order_id: str
    razorpay_payment_id: str
    signature: str

@router.post("/")
def create_order(req: CreateOrderRequest, db: Session = Depends(get_db), customer_id: str = Depends(get_current_customer)):
    cart_model = db.query(Cart).filter(Cart.id == req.cart_id).first()
    if not cart_model:
        raise HTTPException(status_code=404, detail="Cart not found")
        
    if cart_model.customer_id != customer_id:
        raise HTTPException(status_code=403, detail="Not authorized to create order for this cart")
        
    service = OrderService(db)
    try:
        return service.create_order_from_cart(req.cart_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating order from cart: {e}")
        raise HTTPException(status_code=500, detail=f"Order creation failed: {str(e)}")

@router.post("/verify")
def verify_payment(req: VerifyPaymentRequest, db: Session = Depends(get_db), customer_id: str = Depends(get_current_customer)):
    order = db.query(Order).filter(Order.id == req.internal_order_id).first()
    if not order or order.customer_id != customer_id:
        raise HTTPException(status_code=403, detail="Not authorized to verify this order")
        
    service = OrderService(db)
    try:
        return service.verify_payment(
            req.internal_order_id, 
            req.razorpay_payment_id, 
            req.razorpay_order_id, 
            req.signature
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error verifying payment: {e}")
        raise HTTPException(status_code=500, detail=f"Payment verification failed: {str(e)}")

@router.post("/webhook")
async def razorpay_webhook(request: Request, db: Session = Depends(get_db)):
    payload_body = await request.body()
    webhook_signature = request.headers.get("X-Razorpay-Signature")
    
    if not webhook_signature:
        raise HTTPException(status_code=400, detail="Missing signature")
        
    from app.services.razorpay_service import RazorpayService
    rzp = RazorpayService()
    webhook_secret = settings.razorpay_webhook_secret
    if not webhook_secret and not rzp.is_mock:
        raise HTTPException(status_code=500, detail="Webhook secret is not configured")
    
    if not rzp.verify_webhook_signature(payload_body.decode("utf-8"), webhook_signature, webhook_secret):
        raise HTTPException(status_code=400, detail="Invalid signature")
        
    payload = json.loads(payload_body)
    event = payload.get("event")
    event_id = (
        request.headers.get("X-Razorpay-Event-Id")
        or payload.get("id")
        or hashlib.sha256(payload_body).hexdigest()
    )

    existing_webhook = db.query(AgentAction).filter(
        AgentAction.action_type == "RAZORPAY_WEBHOOK_RECEIVED",
        AgentAction.entity_id == event_id,
    ).first()
    if existing_webhook:
        return {"status": "ok", "duplicate": True}

    received_action = AgentAction(
        id=str(uuid.uuid4()),
        merchant_id=None,
        agent_name="RazorpayWebhook",
        action_type="RAZORPAY_WEBHOOK_RECEIVED",
        input={"event": event, "event_id": event_id},
        decision={"accepted": True},
        reason="Webhook signature verified and event accepted for idempotent processing.",
        policy_result={"allowed": True, "event_id": event_id},
        execution_status="RECEIVED",
        entity_type="webhook_event",
        entity_id=event_id,
    )
    db.add(received_action)
    
    if event in ["payment.captured", "payment.authorized"]:
        payment_entity = payload.get("payload", {}).get("payment", {}).get("entity", {})
        rzp_order_id = payment_entity.get("order_id")
        rzp_payment_id = payment_entity.get("id")
        
        if rzp_order_id:
            order = db.query(Order).filter(Order.razorpay_order_id == rzp_order_id).first()
            if order and received_action.merchant_id is None:
                received_action.merchant_id = order.merchant_id
            if order and order.status != "PAID":
                order.status = "PAID"
                payment = db.query(Payment).filter(Payment.razorpay_payment_id == rzp_payment_id).first()
                if not payment and rzp_payment_id:
                    payment = Payment(
                        id=str(uuid.uuid4()),
                        merchant_id=order.merchant_id,
                        order_id=order.id,
                        razorpay_payment_id=rzp_payment_id,
                        status="CAPTURED",
                        amount=order.amount,
                    )
                    db.add(payment)

                event = CustomerEvent(
                    id=str(uuid.uuid4()),
                    merchant_id=order.merchant_id,
                    customer_id=order.customer_id,
                    event_type="ORDER_PAID_WEBHOOK",
                    metadata_={"order_id": order.id, "razorpay_payment_id": rzp_payment_id},
                )
                action = AgentAction(
                    id=str(uuid.uuid4()),
                    merchant_id=order.merchant_id,
                    agent_name="CheckoutAgent",
                    action_type="PAYMENT_WEBHOOK_RECONCILED",
                    input={"razorpay_order_id": rzp_order_id, "razorpay_payment_id": rzp_payment_id},
                    decision={"order_status": "PAID", "payment_status": "CAPTURED"},
                    reason="Razorpay webhook signature was verified and reconciled to the internal order.",
                    policy_result={"allowed": True, "verification": "webhook_signature_valid"},
                    execution_status="SUCCESS",
                    entity_type="order",
                    entity_id=order.id,
                )
                db.add_all([event, action])
                db.commit()

    db.commit()
                
    return {"status": "ok"}
