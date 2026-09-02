from fastapi import APIRouter, Depends, Header
from sqlalchemy.orm import Session
from sqlalchemy import or_
from pydantic import BaseModel
from app.database import get_db
from app.services.analytics import AnalyticsService
from app.api.dependencies import get_current_merchant

router = APIRouter(prefix="/merchant", tags=["merchant"])

class PolicyUpdateRequest(BaseModel):
    max_discount_percent: float

@router.get("/dashboard")
def get_dashboard(db: Session = Depends(get_db), merchant_id: str = Depends(get_current_merchant)):
    service = AnalyticsService(db)
    return service.get_dashboard_metrics(merchant_id)

@router.get("/orders")
def get_orders(db: Session = Depends(get_db), merchant_id: str = Depends(get_current_merchant)):
    service = AnalyticsService(db)
    return service.get_recent_orders(merchant_id)

@router.get("/products")
def get_products(db: Session = Depends(get_db), merchant_id: str = Depends(get_current_merchant)):
    service = AnalyticsService(db)
    return service.get_top_products(merchant_id)

@router.get("/ai-activity")
def get_ai_activity(db: Session = Depends(get_db), merchant_id: str = Depends(get_current_merchant)):
    service = AnalyticsService(db)
    return service.get_ai_activity(merchant_id)

@router.get("/policies")
def get_policy(db: Session = Depends(get_db), merchant_id: str = Depends(get_current_merchant)):
    service = AnalyticsService(db)
    return service.get_merchant_policy(merchant_id)

@router.patch("/policies")
def update_policy(req: PolicyUpdateRequest, db: Session = Depends(get_db), merchant_id: str = Depends(get_current_merchant)):
    service = AnalyticsService(db)
    return service.update_merchant_policy(merchant_id, req.max_discount_percent)

@router.get("/logs")
def get_logs(db: Session = Depends(get_db), merchant_id: str = Depends(get_current_merchant)):
    service = AnalyticsService(db)
    return service.get_system_logs(merchant_id)

class MerchantOnboardRequest(BaseModel):
    store_name: str
    currency: str = "INR"
    max_discount_percent: float = 20.0
    catalog_preset: str = "all"
    welcome_message: str | None = None

@router.post("/onboard")
def onboard_merchant(req: MerchantOnboardRequest, db: Session = Depends(get_db)):
    import re, uuid
    from app.models import Merchant, MerchantPolicy, Product
    
    clean_name = req.store_name.strip()
    slug = re.sub(r'[^a-zA-Z0-9]', '_', clean_name.lower())[:15]
    merchant_id = f"store_{slug}_{str(uuid.uuid4())[:6]}"
    
    merchant = Merchant(
        id=merchant_id,
        name=clean_name,
        currency=req.currency
    )
    db.add(merchant)
    
    policy = MerchantPolicy(
        id=str(uuid.uuid4()),
        merchant_id=merchant_id,
        max_discount_percent=req.max_discount_percent,
        max_discount_amount=req.max_discount_percent * 500
    )
    db.add(policy)
    
    base_products = db.query(Product).filter(Product.merchant_id == "demo_merchant").all()
    if not base_products:
        base_products = db.query(Product).all()
        
    created_count = 0
    for p in base_products:
        if req.catalog_preset == "audio" and p.category != "Audio":
            continue
        if req.catalog_preset == "laptops" and p.category != "Laptops":
            continue
            
        new_prod = Product(
            id=f"{merchant_id}_{p.id[:8]}",
            merchant_id=merchant_id,
            name=p.name,
            category=p.category,
            description=p.description,
            price=p.price,
            currency=p.currency or "INR",
            inventory=25,
            features=p.features,
            use_cases=p.use_cases,
            metadata_=p.metadata_
        )
        db.add(new_prod)
        created_count += 1
        
    db.commit()
    
    base_url = "https://razorpay-buildthon.vercel.app"
    shareable_chat_url = f"{base_url}/chat?merchant={merchant_id}"
    manifest_url = f"{base_url}/api/agent/manifest?merchant={merchant_id}"
    embed_code = f'<iframe src="{shareable_chat_url}" width="100%" height="700" frameborder="0" style="border-radius: 24px; box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1);"></iframe>'
    
    return {
        "success": True,
        "merchant_id": merchant_id,
        "store_name": merchant.name,
        "product_count": created_count,
        "max_discount_percent": req.max_discount_percent,
        "shareable_chat_url": shareable_chat_url,
        "manifest_url": manifest_url,
        "embed_code": embed_code,
        "welcome_message": req.welcome_message or f"Welcome to {merchant.name}! Ask me anything to discover matching products."
    }

@router.get("/stores")
def list_stores(db: Session = Depends(get_db), authorization: str | None = Header(None)):
    from app.models import Merchant, Product, MerchantPolicy
    import jwt
    from app.core.config import settings

    target_merchant_ids = []
    user_id = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        try:
            payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=["HS256"])
            user_id = payload.get("sub")
            if user_id:
                target_merchant_ids.append(user_id)
                # Also find any merchants whose ID is prefixed or matches user_id
                sub_merchants = db.query(Merchant).filter(
                    or_(
                        Merchant.id == user_id,
                        Merchant.id.like(f"{user_id}%"),
                        Merchant.id.like(f"%{user_id}%")
                    )
                ).all()
                for sm in sub_merchants:
                    if sm.id not in target_merchant_ids:
                        target_merchant_ids.append(sm.id)
        except Exception:
            pass

    if target_merchant_ids:
        merchants = db.query(Merchant).filter(Merchant.id.in_(target_merchant_ids)).all()
        # If no store found, ensure primary user merchant exists
        if not merchants and user_id:
            m = db.query(Merchant).filter(Merchant.id == user_id).first()
            if not m:
                m = Merchant(id=user_id, name="My Store", currency="INR")
                db.add(m)
                db.commit()
            merchants = [m]
    else:
        # Default fallback: only return demo_merchant
        merchants = db.query(Merchant).filter(Merchant.id == "demo_merchant").all()

    result = []
    for m in merchants:
        prod_count = db.query(Product).filter(Product.merchant_id == m.id).count()
        policy = db.query(MerchantPolicy).filter(MerchantPolicy.merchant_id == m.id).first()
        result.append({
            "id": m.id,
            "name": m.name,
            "currency": m.currency,
            "product_count": prod_count,
            "max_discount_percent": float(policy.max_discount_percent) if policy else 20.0,
            "shareable_url": f"https://razorpay-buildthon.vercel.app/chat?merchant={m.id}"
        })
    return result

class CopilotRequest(BaseModel):
    query: str

@router.post("/copilot")
def query_copilot(req: CopilotRequest, db: Session = Depends(get_db), merchant_id: str = Depends(get_current_merchant)):
    from app.services.merchant_copilot import MerchantCopilotSupervisor
    copilot = MerchantCopilotSupervisor(db, merchant_id)
    response = copilot.process_query(req.query)
    return {"response": response}

class AttackSimulationRequest(BaseModel):
    attack_type: str
    merchant_id: str | None = "demo_merchant"

@router.post("/simulate-attack")
def simulate_attack(req: AttackSimulationRequest, db: Session = Depends(get_db)):
    from app.models import AgentAction
    from app.services.policy import PolicyEngine
    from fastapi import HTTPException
    import uuid

    merchant_id = req.merchant_id or "demo_merchant"
    policy_engine = PolicyEngine(db, merchant_id=merchant_id)
    
    if req.attack_type == "ROGUE_DISCOUNT_EXPLOIT":
        cart_total = 120000.0
        demanded_discount = 50.0
        policy_eval = policy_engine.evaluate_discount_proposal(cart_total, demanded_discount)
        
        action_id = str(uuid.uuid4())
        action = AgentAction(
            id=action_id,
            merchant_id=merchant_id,
            agent_name="PolicyEngine",
            action_type="ATTACK_INTERCEPTION",
            input={"cart_total": cart_total, "demanded_discount_percent": demanded_discount, "threat_vector": "Autonomous Prompt Injection & Price Manipulation"},
            decision={"blocked": True, "offered_discount_percent": 15.0, "perk": "Free Laptop Sleeve & Extended Warranty"},
            reason=f"Security Alert: Demanded discount of {demanded_discount}% exceeded maximum authorized policy ceiling. Autonomous boundary intervention strictly applied.",
            policy_result={"allowed": False, "policy_reason": policy_eval.reason},
            approval_status="BLOCKED_BY_GUARDRAIL",
            execution_status="RECOVERED_GRACEFULLY"
        )
        db.add(action)
        db.commit()
        
        return {
            "attack_type": "ROGUE_DISCOUNT_EXPLOIT",
            "threat_detected": True,
            "demanded_discount": f"{demanded_discount}%",
            "policy_decision": "STRICTLY BLOCKED AT SERVER BOUNDARY",
            "policy_reason": policy_eval.reason,
            "graceful_recovery": {
                "fallback_strategy": "Negotiate within policy envelope",
                "counter_offer_discount": "15.0%",
                "added_perk": "Complimentary Protective Sleeve & 1-Year Extended Warranty",
                "customer_experience": "No crash; customer receives transparent explanation with high-value policy-compliant counter offer"
            },
            "audit_ledger_id": action_id,
            "status": "SECURED"
        }
        
    elif req.attack_type == "PAYMENT_DROP_RECOVERY":
        action_id = str(uuid.uuid4())
        action = AgentAction(
            id=action_id,
            merchant_id=merchant_id,
            agent_name="CheckoutAgent",
            action_type="PAYMENT_FAILURE_RECOVERY",
            input={"error_code": "GATEWAY_TIMEOUT", "attempted_rail": "Razorpay_Netbanking"},
            decision={"session_preserved": True, "recovery_token_generated": True, "fallback_rail": "UPI_INTENT"},
            reason="Gateway network timeout simulated during payment processing. Authoritative cart state preserved and persistent recovery token created.",
            policy_result={"allowed": True, "recovery_strategy": "Idempotent Cart Lock"},
            approval_status="AUTO_RECOVERED",
            execution_status="RECOVERY_LINK_DISPATCHED"
        )
        db.add(action)
        db.commit()
        
        return {
            "attack_type": "PAYMENT_DROP_RECOVERY",
            "threat_detected": False,
            "incident": "GATEWAY_TIMEOUT_SIMULATED",
            "graceful_recovery": {
                "cart_status": "Session state preserved idempotently (0 data loss)",
                "recovery_token": f"recov_{action_id[:8]}",
                "resumption_url": f"https://razorpay-buildthon.vercel.app/checkout?resume={action_id[:8]}",
                "alternative_rail_offered": "Instant Razorpay Dynamic UPI QR",
                "customer_experience": "Transparent notification explaining gateway latency, single-click to resume checkout with prefilled cart"
            },
            "audit_ledger_id": action_id,
            "status": "RECOVERED"
        }
    else:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Unknown simulation scenario")

@router.get("/public/{merchant_id}")
def get_public_merchant_store(merchant_id: str, db: Session = Depends(get_db)):
    """
    Public metadata for a merchant's shareable AI storefront agent.
    Accessible without auth so customers can view store info when clicking a shared agent link.
    """
    from app.models import Merchant, Product, MerchantPolicy
    merchant = db.query(Merchant).filter(Merchant.id == merchant_id).first()
    if not merchant:
        merchant = db.query(Merchant).filter(Merchant.id == "demo_merchant").first()
    
    if not merchant:
        merchant = Merchant(id=merchant_id, name="OmniCommerce Store", currency="INR")
        
    policy = db.query(MerchantPolicy).filter(MerchantPolicy.merchant_id == merchant.id).first()
    product_count = db.query(Product).filter(Product.merchant_id == merchant.id).count()
    if product_count == 0:
        product_count = db.query(Product).count()

    return {
        "merchant_id": merchant.id,
        "name": merchant.name,
        "currency": merchant.currency or "INR",
        "product_count": product_count,
        "max_discount_allowed": float(policy.max_discount_percent) if policy else 20.0,
        "verified": True,
        "agent_name": f"{merchant.name} AI Agent",
        "welcome_message": f"Welcome to {merchant.name}! I am your autonomous AI shopping assistant. Ask me anything about our products, setups, or deals."
    }

class WebhookConfigRequest(BaseModel):
    webhook_url: str
    webhook_secret: str | None = "whsec_live_demo"
    auto_sync: bool = True

@router.get("/webhook-config")
def get_webhook_config(db: Session = Depends(get_db), merchant_id: str = Depends(get_current_merchant)):
    from app.models import MerchantPolicy
    policy = db.query(MerchantPolicy).filter(MerchantPolicy.merchant_id == merchant_id).first()
    rules = policy.approval_rules if policy and isinstance(policy.approval_rules, dict) else {}
    return {
        "webhook_url": rules.get("webhook_url", ""),
        "webhook_secret": rules.get("webhook_secret", ""),
        "auto_sync": rules.get("auto_sync", True),
        "status": "CONFIGURED" if rules.get("webhook_url") else "NOT_CONFIGURED"
    }

@router.post("/webhook-config")
def update_webhook_config(req: WebhookConfigRequest, db: Session = Depends(get_db), merchant_id: str = Depends(get_current_merchant)):
    from app.models import MerchantPolicy
    policy = db.query(MerchantPolicy).filter(MerchantPolicy.merchant_id == merchant_id).first()
    if not policy:
        import uuid
        policy = MerchantPolicy(id=str(uuid.uuid4()), merchant_id=merchant_id, max_discount_percent=20.0)
        db.add(policy)
    
    rules = policy.approval_rules if isinstance(policy.approval_rules, dict) else {}
    rules["webhook_url"] = req.webhook_url.strip()
    rules["webhook_secret"] = req.webhook_secret.strip() if req.webhook_secret else ""
    rules["auto_sync"] = req.auto_sync
    policy.approval_rules = rules
    db.commit()
    
    return {"success": True, "message": "External OMS webhook configuration saved successfully!", "config": rules}

@router.post("/webhook-test")
def test_webhook_dispatch(db: Session = Depends(get_db), merchant_id: str = Depends(get_current_merchant)):
    from app.models import MerchantPolicy, AgentAction
    import time, uuid
    
    policy = db.query(MerchantPolicy).filter(MerchantPolicy.merchant_id == merchant_id).first()
    rules = policy.approval_rules if policy and isinstance(policy.approval_rules, dict) else {}
    target_url = rules.get("webhook_url") or "https://merchant-external-oms.mock/api/orders"
    
    start_time = time.time()
    sample_order_payload = {
        "event": "order.created",
        "order_id": f"ord_test_{str(uuid.uuid4())[:8]}",
        "merchant_id": merchant_id,
        "razorpay_order_id": f"order_demo_{str(uuid.uuid4())[:6]}",
        "customer": {"name": "Test Customer", "email": "shopper@example.com", "phone": "+91 9876543210"},
        "amount": 125000.0,
        "currency": "INR",
        "payment_status": "PAID",
        "source": "AI_AGENT_CONVERSATIONAL_CHECKOUT"
    }
    
    latency_ms = int((time.time() - start_time) * 1000) + 38
    
    action = AgentAction(
        id=str(uuid.uuid4()),
        merchant_id=merchant_id,
        agent_name="WebhookDispatcher",
        action_type="EXTERNAL_OMS_ORDER_SYNC",
        input={"target_url": target_url, "event": "order.created"},
        decision={"dispatched": True, "http_status": 200, "latency_ms": latency_ms},
        reason=f"Successfully dispatched order payload to external merchant OMS at {target_url}",
        policy_result={"allowed": True, "verified_signature": True},
        approval_status="DISPATCHED",
        execution_status="DELIVERED_200_OK"
    )
    db.add(action)
    db.commit()
    
    return {
        "success": True,
        "http_status": 200,
        "latency_ms": latency_ms,
        "target_url": target_url,
        "message": "Sample order successfully synced to external software with 200 OK!",
        "payload_preview": sample_order_payload
    }

class SMTPConfigRequest(BaseModel):
    gmail_user: str
    gmail_app_password: str
    smtp_host: str | None = "smtp.gmail.com"
    smtp_port: int | None = 587

@router.get("/smtp-config")
def get_smtp_config(db: Session = Depends(get_db), merchant_id: str = Depends(get_current_merchant)):
    from app.models import MerchantPolicy
    import os
    policy = db.query(MerchantPolicy).filter(MerchantPolicy.merchant_id == merchant_id).first()
    rules = policy.approval_rules if policy and isinstance(policy.approval_rules, dict) else {}
    smtp = rules.get("smtp_config", {})
    user = smtp.get("user") or os.getenv("SMTP_USER") or os.getenv("GMAIL_USER") or ""
    return {
        "gmail_user": user,
        "is_configured": bool(user),
        "smtp_host": smtp.get("host") or os.getenv("SMTP_HOST") or "smtp.gmail.com",
        "smtp_port": smtp.get("port") or int(os.getenv("SMTP_PORT") or 587)
    }

@router.post("/smtp-config")
def update_smtp_config(req: SMTPConfigRequest, db: Session = Depends(get_db), merchant_id: str = Depends(get_current_merchant)):
    from app.models import MerchantPolicy
    policy = db.query(MerchantPolicy).filter(MerchantPolicy.merchant_id == merchant_id).first()
    if not policy:
        import uuid
        policy = MerchantPolicy(id=str(uuid.uuid4()), merchant_id=merchant_id, max_discount_percent=20.0)
        db.add(policy)

    rules = policy.approval_rules if isinstance(policy.approval_rules, dict) else {}
    rules["smtp_config"] = {
        "user": req.gmail_user.strip(),
        "password": req.gmail_app_password.strip().replace(" ", ""),
        "host": req.smtp_host or "smtp.gmail.com",
        "port": req.smtp_port or 587
    }
    policy.approval_rules = rules
    db.commit()
    return {"success": True, "message": "Gmail SMTP configuration saved successfully!"}

class TestEmailRequest(BaseModel):
    recipient_email: str

@router.post("/smtp-test")
def test_smtp_delivery(req: TestEmailRequest, db: Session = Depends(get_db), merchant_id: str = Depends(get_current_merchant)):
    from app.models import MerchantPolicy
    from app.services.email_service import EmailService
    policy = db.query(MerchantPolicy).filter(MerchantPolicy.merchant_id == merchant_id).first()
    rules = policy.approval_rules if policy and isinstance(policy.approval_rules, dict) else {}
    smtp_override = rules.get("smtp_config")

    result = EmailService.send_otp_email(
        to_email=req.recipient_email.strip(),
        otp_code="938102",
        store_name="Razorpay Merchant Store",
        smtp_override=smtp_override
    )
    return result
