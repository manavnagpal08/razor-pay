from fastapi import APIRouter, Depends, HTTPException, Header, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from app.database import get_db
from app.models import Product, Cart, CartItem, Order, Customer, User, MerchantPolicy, AgentAction
from app.services.order import OrderService
from app.services.policy import PolicyEngine
from app.core.config import settings
import uuid
import secrets

router = APIRouter(prefix="/api/agent", tags=["agent-to-agent protocol"])

class AgentSearchQuery(BaseModel):
    query: str
    max_price: Optional[float] = None
    category: Optional[str] = None

class AgentTransactRequest(BaseModel):
    agent_id: str = Field(description="Identifier of the purchasing AI agent")
    product_id: str
    quantity: int = Field(default=1, gt=0, le=25)
    proposed_discount_percent: Optional[float] = Field(default=0.0, ge=0.0, le=100.0)
    idempotency_key: Optional[str] = Field(default=None, max_length=128)

@router.get("/manifest")
def get_agent_protocol_manifest(
    merchant_id: str = Query(default="demo_merchant"),
    db: Session = Depends(get_db),
):
    """
    Standard Machine-Readable Agent Commerce Manifest (ACP / AP2 / UAP compliant).
    Allows external AI buyers to discover catalog capabilities, discount bounds, and transaction endpoints.
    """
    policy = db.query(MerchantPolicy).filter(MerchantPolicy.merchant_id == merchant_id).first()
    max_discount_cap = float(policy.max_discount_percent) if policy else 0.0
    max_discount_amount = float(policy.max_discount_amount) if policy and policy.max_discount_amount is not None else 0.0

    return {
        "protocol_version": "UAP-1.0-draft",
        "commerce_system": "Razorpay AI Commerce OS",
        "merchant_id": merchant_id,
        "currency": "INR",
        "payment_rail": "Razorpay Test Mode",
        "key_id": settings.razorpay_key_id,
        "capabilities": [
            "catalog_search",
            "semantic_matching",
            "policy_gated_discount_negotiation",
            "autonomous_order_creation",
            "cryptographic_payment_verification"
        ],
        "endpoints": {
            "catalog": "/api/products",
            "search": "/api/products/search",
            "ai_intent": "/api/ai/chat/search",
            "transact": "/api/agent/transact",
            "verify_payment": "/api/orders/verify"
        },
        "policy_bounds": {
            "max_discount_cap": max_discount_cap,
            "max_discount_amount": max_discount_amount,
            "enforcement": "Strict server-side gating via Policy Engine",
            "audit_trail": "100% explainability in agent_actions table"
        }
    }

@router.post("/transact")
def agent_transact(
    req: AgentTransactRequest,
    db: Session = Depends(get_db),
    authorization: str | None = Header(None),
):
    """
    Autonomous Agent-to-Agent Transaction Endpoint:
    Allows an external AI buyer to transact directly:
    1. Validates product availability
    2. Runs proposed discount through Policy Engine
    3. Creates authoritative Cart & Razorpay Order
    4. Returns Razorpay Order ID for cryptographic completion
    """
    if settings.environment.lower() in {"production", "prod"}:
        token = ""
        if authorization and authorization.startswith("Bearer "):
            token = authorization.removeprefix("Bearer ").strip()
        if not token or not any(secrets.compare_digest(token, key) for key in settings.agent_api_keys):
            raise HTTPException(status_code=401, detail="Invalid agent API key")

    product = db.query(Product).filter(Product.id == req.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found in merchant catalog")
    merchant_id = product.merchant_id or "demo_merchant"
    if not product.merchant_id and settings.environment.lower() in {"production", "prod"}:
        raise HTTPException(status_code=400, detail="Product is not assigned to a merchant")
    if product.inventory < req.quantity:
        raise HTTPException(status_code=400, detail="Requested quantity exceeds available inventory")

    idempotency_key = req.idempotency_key.strip() if req.idempotency_key else None
    if idempotency_key:
        replay = db.query(AgentAction).filter(
            AgentAction.merchant_id == merchant_id,
            AgentAction.action_type == "AGENT_TRANSACTION_ACCEPTED",
            AgentAction.entity_id == idempotency_key,
        ).first()
        if replay:
            return {
                "status": "DUPLICATE",
                "agent_id": req.agent_id,
                "idempotency_key": idempotency_key,
                "razorpay_order": replay.decision.get("razorpay_order") if isinstance(replay.decision, dict) else None,
                "financials": replay.decision.get("financials") if isinstance(replay.decision, dict) else None,
            }

    unit_price = float(product.price)
    subtotal = unit_price * req.quantity

    # 1. Evaluate Policy on proposed discount
    policy_engine = PolicyEngine(db, merchant_id=merchant_id)
    policy_eval = policy_engine.evaluate_discount_proposal(
        cart_total=subtotal,
        proposed_discount_percentage=req.proposed_discount_percent or 0.0
    )

    allowed_discount_percent = (req.proposed_discount_percent or 0.0) if policy_eval.allowed else 0.0
    discount_amount = subtotal * (allowed_discount_percent / 100.0)
    total = max(0.0, subtotal - discount_amount)

    # 2. Create or get AI agent customer record
    safe_agent_id = "".join(ch for ch in req.agent_id if ch.isalnum() or ch in {"_", "-"})[:32] or "anonymous"
    agent_user_id = f"agent_{merchant_id[:12]}_{safe_agent_id[:16]}"
    user = db.query(User).filter(User.id == agent_user_id).first()
    if not user:
        user = User(id=agent_user_id, email=f"{agent_user_id}@agentic.network", name=f"AI Buyer ({req.agent_id[:8]})", password_hash="agent_token", role="customer")
        db.add(user)
        db.flush()
        customer = Customer(id=str(uuid.uuid4()), user_id=user.id, merchant_id=merchant_id, segment="ai_buyer")
        db.add(customer)
        db.flush()
    else:
        customer = db.query(Customer).filter(Customer.user_id == user.id, Customer.merchant_id == merchant_id).first()
        if not customer:
            customer = Customer(id=str(uuid.uuid4()), user_id=user.id, merchant_id=merchant_id, segment="ai_buyer")
            db.add(customer)
            db.flush()

    # 3. Create authoritative Cart
    cart = Cart(
        id=str(uuid.uuid4()),
        merchant_id=merchant_id,
        customer_id=customer.id,
        status="active",
        subtotal=subtotal,
        discount=discount_amount,
        total=total
    )
    db.add(cart)
    db.flush()

    cart_item = CartItem(
        id=str(uuid.uuid4()),
        cart_id=cart.id,
        product_id=product.id,
        quantity=req.quantity,
        unit_price=unit_price
    )
    db.add(cart_item)
    db.commit()

    # 4. Create Order via OrderService
    order_service = OrderService(db)
    order_result = order_service.create_order_from_cart(cart.id)

    response = {
        "status": "ORDER_CREATED",
        "agent_id": req.agent_id,
        "idempotency_key": idempotency_key,
        "merchant_id": merchant_id,
        "product": product.name,
        "quantity": req.quantity,
        "financials": {
            "subtotal": subtotal,
            "discount_applied": discount_amount,
            "total_payable": total,
            "policy_result": {
                "allowed": policy_eval.allowed,
                "reason": policy_eval.reason
            }
        },
        "razorpay_order": order_result
    }

    db.add(AgentAction(
        id=str(uuid.uuid4()),
        merchant_id=merchant_id,
        agent_name="AgentCommerceProtocol",
        action_type="AGENT_TRANSACTION_ACCEPTED",
        input=req.model_dump(),
        decision=response,
        reason="Autonomous AI buyer order was policy-gated, merchant-scoped, and converted into a Razorpay order.",
        policy_result={"allowed": policy_eval.allowed, "reason": policy_eval.reason},
        approval_status="auto_approved" if policy_eval.allowed else "discount_removed",
        execution_status="ORDER_CREATED",
        entity_type="idempotency_key" if idempotency_key else "order",
        entity_id=idempotency_key or order_result.get("id"),
    ))
    db.commit()

    return response
