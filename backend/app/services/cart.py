import uuid
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models import Cart, CartItem, Product
from app.schemas import CartResponse, CartItemSchema, CartValidationSchema

class CartService:
    def __init__(self, db: Session):
        self.db = db

    def get_or_create_cart(self, customer_id: str = None, merchant_id: str = "demo_merchant") -> Cart:
        # Resolve customer cart for specific merchant
        cart = self.db.query(Cart).filter(
            Cart.status == "active",
            Cart.customer_id == customer_id,
            Cart.merchant_id == merchant_id
        ).first()
        
        if not cart:
            cart = Cart(id=str(uuid.uuid4()), customer_id=customer_id, merchant_id=merchant_id)
            self.db.add(cart)
            self.db.commit()
            self.db.refresh(cart)
        return cart

    def get_cart_response(self, cart_id: str) -> CartResponse:
        cart = self.db.query(Cart).filter(Cart.id == cart_id).first()
        if not cart:
            raise ValueError("Cart not found")
        
        items = self.db.query(CartItem).filter(CartItem.cart_id == cart_id).all()
        
        schema_items = []
        issues = []
        subtotal = 0.0
        
        for item in items:
            product = self.db.query(Product).filter(Product.id == item.product_id).first()
            if not product:
                issues.append(f"Product {item.product_id} no longer exists.")
                continue
                
            if product.inventory < item.quantity:
                issues.append(f"Product {product.name} has insufficient inventory.")
                
            if float(product.price) != float(item.unit_price):
                issues.append(f"Price for {product.name} has changed from {item.unit_price} to {product.price}. Updating cart.")
                item.unit_price = product.price
                self.db.commit()
                
            item_sub = float(item.unit_price) * item.quantity
            subtotal += item_sub
            
            schema_items.append(CartItemSchema(
                id=item.id,
                product_id=product.id,
                name=product.name,
                quantity=item.quantity,
                unit_price=float(item.unit_price),
                subtotal=item_sub
            ))
            
        cart.subtotal = subtotal
        # Recalculate total
        cart.total = float(cart.subtotal) - float(cart.discount)
        if cart.total < 0:
            cart.total = 0.0
            
        self.db.commit()
        
        return CartResponse(
            id=cart.id,
            items=schema_items,
            subtotal=float(cart.subtotal),
            discount=float(cart.discount),
            charges=0.0,
            total=float(cart.total),
            currency="INR",
            validation=CartValidationSchema(
                valid=len(issues) == 0,
                issues=issues
            )
        )

    def add_item(self, cart_id: str, product_id: str, quantity: int) -> CartResponse:
        cart = self.db.query(Cart).filter(Cart.id == cart_id).first()
        if not cart:
            raise ValueError("Cart not found")
            
        product = self.db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise ValueError("Product not found")
            
        if product.inventory < quantity:
            raise ValueError("Not enough inventory")
            
        item = self.db.query(CartItem).filter(CartItem.cart_id == cart_id, CartItem.product_id == product_id).first()
        if item:
            new_qty = item.quantity + quantity
            if product.inventory < new_qty:
                raise ValueError("Not enough inventory for combined quantity")
            item.quantity = new_qty
        else:
            item = CartItem(
                id=str(uuid.uuid4()),
                cart_id=cart.id,
                product_id=product.id,
                quantity=quantity,
                unit_price=product.price
            )
            self.db.add(item)
            
        self.db.commit()
        return self.get_cart_response(cart_id)

    def update_item_quantity(self, cart_id: str, item_id: str, quantity: int) -> CartResponse:
        item = self.db.query(CartItem).filter(CartItem.cart_id == cart_id, CartItem.id == item_id).first()
        if not item:
            raise ValueError("Item not found in cart")
            
        if quantity <= 0:
            self.db.delete(item)
        else:
            product = self.db.query(Product).filter(Product.id == item.product_id).first()
            if product.inventory < quantity:
                raise ValueError("Not enough inventory")
            item.quantity = quantity
            
        self.db.commit()
        return self.get_cart_response(cart_id)

    def remove_item(self, cart_id: str, item_id: str) -> CartResponse:
        item = self.db.query(CartItem).filter(CartItem.cart_id == cart_id, CartItem.id == item_id).first()
        if item:
            self.db.delete(item)
            self.db.commit()
        return self.get_cart_response(cart_id)
