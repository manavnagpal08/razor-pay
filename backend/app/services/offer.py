from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models import Offer, Cart
from app.services.cart import CartService

class OfferEngine:
    def __init__(self, db: Session):
        self.db = db
        self.cart_service = CartService(db)

    def apply_offer(self, cart_id: str, offer_id: str) -> dict:
        cart = self.db.query(Cart).filter(Cart.id == cart_id).first()
        if not cart:
            raise ValueError("Cart not found")
            
        offer = self.db.query(Offer).filter(Offer.id == offer_id).first()
        if not offer:
            raise ValueError("Offer not found")
            
        if offer.merchant_id != cart.merchant_id:
            raise ValueError("Offer is not valid for this merchant")
            
        if offer.status != "active":
            raise ValueError("Offer is not active")
            
        now = datetime.now(timezone.utc)
        if offer.start_time and now < offer.start_time:
            raise ValueError("Offer has not started yet")
        if offer.end_time and now > offer.end_time:
            raise ValueError("Offer has expired")
            
        # Ensure cart total is updated first
        cart_resp = self.cart_service.get_cart_response(cart_id)
        subtotal = float(cart_resp.subtotal)
        
        if subtotal < float(offer.minimum_cart_value):
            raise ValueError(f"Cart does not meet minimum value of ₹{offer.minimum_cart_value}")
            
        # Calculate discount
        discount_amount = 0.0
        if offer.discount_type == "PERCENTAGE":
            discount_amount = (subtotal * float(offer.discount_value)) / 100.0
        elif offer.discount_type == "FIXED":
            discount_amount = float(offer.discount_value)
            
        # Apply maximum discount cap
        if offer.maximum_discount and discount_amount > float(offer.maximum_discount):
            discount_amount = float(offer.maximum_discount)
            
        # Update cart
        cart.discount = discount_amount
        cart.total = max(0.0, subtotal - discount_amount)
        self.db.commit()
        
        return {
            "offer_id": offer.id,
            "eligible": True,
            "discount_type": offer.discount_type,
            "applied_discount": discount_amount,
            "reason": "Offer successfully applied."
        }
