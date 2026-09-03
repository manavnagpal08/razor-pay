from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from app.database import get_db
from app.schemas import (
    CartResponse, AddItemRequest, UpdateItemRequest, ApplyOfferRequest
)
from app.services.cart import CartService
from app.services.offer import OfferEngine
from app.api.dependencies import get_current_customer

router = APIRouter(prefix="/cart", tags=["cart"])

@router.post("/", response_model=CartResponse)
def create_cart(db: Session = Depends(get_db), customer_id: str = Depends(get_current_customer)):
    service = CartService(db)
    cart = service.get_or_create_cart(customer_id)
    return service.get_cart_response(cart.id)

@router.get("/{cart_id}", response_model=CartResponse)
def get_cart(cart_id: str, db: Session = Depends(get_db), customer_id: str = Depends(get_current_customer)):
    service = CartService(db)
    try:
        cart_resp = service.get_cart_response(cart_id)
        if cart_resp.customer_id != customer_id:
            raise HTTPException(status_code=403, detail="Not authorized to access this cart")
        return cart_resp
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/items", response_model=CartResponse)
def add_item_to_current_cart(req: AddItemRequest, db: Session = Depends(get_db), customer_id: str = Depends(get_current_customer)):
    service = CartService(db)
    try:
        cart = service.get_or_create_cart(customer_id)
        return service.add_item(cart.id, req.product_id, req.quantity)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{cart_id}/items", response_model=CartResponse)
def add_item_to_cart(cart_id: str, req: AddItemRequest, db: Session = Depends(get_db), customer_id: str = Depends(get_current_customer)):
    service = CartService(db)
    try:
        # verify ownership
        cart_resp = service.get_cart_response(cart_id)
        if cart_resp.customer_id != customer_id:
            raise HTTPException(status_code=403, detail="Not authorized to modify this cart")
        return service.add_item(cart_id, req.product_id, req.quantity)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.patch("/{cart_id}/items/{item_id}", response_model=CartResponse)
def update_cart_item(cart_id: str, item_id: str, req: UpdateItemRequest, db: Session = Depends(get_db), customer_id: str = Depends(get_current_customer)):
    service = CartService(db)
    try:
        cart_resp = service.get_cart_response(cart_id)
        if cart_resp.customer_id != customer_id:
            raise HTTPException(status_code=403, detail="Not authorized to modify this cart")
        return service.update_item_quantity(cart_id, item_id, req.quantity)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{cart_id}/items/{item_id}", response_model=CartResponse)
def remove_cart_item(cart_id: str, item_id: str, db: Session = Depends(get_db), customer_id: str = Depends(get_current_customer)):
    service = CartService(db)
    try:
        cart_resp = service.get_cart_response(cart_id)
        if cart_resp.customer_id != customer_id:
            raise HTTPException(status_code=403, detail="Not authorized to modify this cart")
        return service.remove_item(cart_id, item_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/{cart_id}/apply-offer")
def apply_offer(cart_id: str, req: ApplyOfferRequest, db: Session = Depends(get_db), customer_id: str = Depends(get_current_customer)):
    engine = OfferEngine(db)
    try:
        cart_resp_check = CartService(db).get_cart_response(cart_id)
        if cart_resp_check.customer_id != customer_id:
            raise HTTPException(status_code=403, detail="Not authorized to access this cart")
        
        result = engine.apply_offer(cart_id, req.offer_id)
        cart_resp = CartService(db).get_cart_response(cart_id)
        return {"offer_result": result, "cart": cart_resp}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

class ApplyPromoRequest(BaseModel):
    code: str

@router.post("/{cart_id}/apply-promo")
def apply_promo_code(cart_id: str, req: ApplyPromoRequest, db: Session = Depends(get_db), customer_id: str = Depends(get_current_customer)):
    from app.models import Cart, CartItem, Product, MerchantPolicy
    from app.services.policy import PolicyEngine
    
    cart = db.query(Cart).filter(Cart.id == cart_id).first()
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
    if cart.customer_id != customer_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this cart")
        
    code_str = req.code.strip().upper()
    if not code_str:
        raise HTTPException(status_code=400, detail="Please enter a valid coupon code")

    # Determine merchant
    merchant_id = cart.merchant_id or "demo_merchant"
    policy = db.query(MerchantPolicy).filter(MerchantPolicy.merchant_id == merchant_id).first()
    if not policy:
        policy = db.query(MerchantPolicy).first()

    rules = dict(policy.approval_rules) if (policy and isinstance(policy.approval_rules, dict)) else {}
    promo_codes = rules.get("promo_codes", [
        {"code": "WELCOME10", "discount": 10, "type": "percentage", "active": True},
        {"code": "SAVE15", "discount": 15, "type": "percentage", "active": True},
        {"code": "FLASH20", "discount": 20, "type": "percentage", "active": True},
        {"code": "FLAT500", "discount": 500, "type": "fixed", "active": True},
    ])

    matched_promo = next((p for p in promo_codes if p.get("code") == code_str and p.get("active", True)), None)
    if not matched_promo:
        raise HTTPException(status_code=400, detail=f"Coupon '{code_str}' is invalid or expired.")

    # Calculate cart subtotal
    items = db.query(CartItem).filter(CartItem.cart_id == cart_id).all()
    subtotal = sum(float(it.unit_price) * it.quantity for it in items)
    if subtotal <= 0:
        raise HTTPException(status_code=400, detail="Cart is empty")

    min_cart = float(rules.get("min_cart_amount", 0.0) or 0.0)
    if subtotal < min_cart:
        raise HTTPException(status_code=400, detail=f"Order subtotal (₹{subtotal:,.2f}) is below minimum requirement (₹{min_cart:,.2f}) for coupon '{code_str}'.")

    disc_val = float(matched_promo.get("discount", 0))
    disc_type = matched_promo.get("type", "percentage")

    if disc_type == "percentage":
        proposed_discount_amount = (subtotal * disc_val) / 100.0
        proposed_discount_percent = disc_val
    else:
        proposed_discount_amount = disc_val
        proposed_discount_percent = (disc_val / subtotal) * 100.0 if subtotal > 0 else 0.0

    # Validate against Policy Engine
    policy_engine = PolicyEngine(db, merchant_id=merchant_id)
    eval_result = policy_engine.evaluate_discount_proposal(
        cart_total=subtotal,
        proposed_discount_percentage=proposed_discount_percent
    )

    if not eval_result.allowed:
        max_pct = float(policy.max_discount_percent if policy else 20.0)
        max_amt = float(rules.get("max_discount_amount", 10000.0) or 10000.0)
        clamped_amt = min((subtotal * max_pct) / 100.0, max_amt)
        cart.discount = clamped_amt
        cart.total = max(0.0, subtotal - clamped_amt)
        db.commit()
        service = CartService(db)
        cart_resp = service.get_cart_response(cart_id)
        return {
            "success": True,
            "code": code_str,
            "discount": clamped_amt,
            "cart": cart_resp,
            "message": f"Coupon '{code_str}' applied with safety cap: Saved ₹{clamped_amt:,.2f} ({eval_result.reason})"
        }

    cart.discount = proposed_discount_amount
    cart.total = max(0.0, subtotal - proposed_discount_amount)
    db.commit()

    service = CartService(db)
    cart_resp = service.get_cart_response(cart_id)
    return {
        "success": True,
        "code": code_str,
        "discount": proposed_discount_amount,
        "cart": cart_resp,
        "message": f"Coupon '{code_str}' applied successfully! Saved ₹{proposed_discount_amount:,.2f}"
    }

@router.post("/{cart_id}/remove-promo")
def remove_promo_code(cart_id: str, db: Session = Depends(get_db), customer_id: str = Depends(get_current_customer)):
    from app.models import Cart
    cart = db.query(Cart).filter(Cart.id == cart_id).first()
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
    if cart.customer_id != customer_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this cart")
        
    cart.discount = 0.0
    cart.total = float(cart.subtotal)
    db.commit()

    service = CartService(db)
    cart_resp = service.get_cart_response(cart_id)
    return {"success": True, "cart": cart_resp, "message": "Coupon removed successfully."}
