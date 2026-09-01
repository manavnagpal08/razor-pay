from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
import os
import json
from app.database import get_db
from app.services.order import OrderService
from app.api.dependencies import get_current_customer
from app.models import Order

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
    service = OrderService(db)
    try:
        from app.services.cart import CartService
        cart_resp = CartService(db).get_cart_response(req.cart_id)
        if cart_resp.customer_id != customer_id:
            raise HTTPException(status_code=403, detail="Not authorized to create order for this cart")
        return service.create_order_from_cart(req.cart_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

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

@router.post("/webhook")
async def razorpay_webhook(request: Request, db: Session = Depends(get_db)):
    payload_body = await request.body()
    webhook_signature = request.headers.get("X-Razorpay-Signature")
    
    if not webhook_signature:
        raise HTTPException(status_code=400, detail="Missing signature")
        
    from app.services.razorpay_service import RazorpayService
    rzp = RazorpayService()
    webhook_secret = os.getenv("RAZORPAY_WEBHOOK_SECRET", "mock_webhook_secret")
    
    if not rzp.verify_webhook_signature(payload_body.decode('utf-8'), webhook_signature, webhook_secret):
        raise HTTPException(status_code=400, detail="Invalid signature")
        
    payload = json.loads(payload_body)
    event = payload.get("event")
    
    if event in ["payment.captured", "payment.authorized"]:
        payment_entity = payload.get("payload", {}).get("payment", {}).get("entity", {})
        rzp_order_id = payment_entity.get("order_id")
        rzp_payment_id = payment_entity.get("id")
        
        if rzp_order_id:
            order = db.query(Order).filter(Order.razorpay_order_id == rzp_order_id).first()
            if order and order.status != "COMPLETED":
                order.status = "COMPLETED"
                # Could log payment details here
                db.commit()
                
    return {"status": "ok"}
