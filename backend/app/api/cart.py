from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
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
