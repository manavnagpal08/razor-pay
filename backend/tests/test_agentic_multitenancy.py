import uuid

from fastapi.testclient import TestClient

from app.database import SessionLocal
from app.main import app
from app.models import AgentAction, Cart, CartItem, Customer, Merchant, MerchantPolicy, Order, Product, User
from app.services.cart import CartService


client = TestClient(app)


def _merchant_with_product(label: str, price: float = 1000.0):
    db = SessionLocal()
    merchant_id = f"merchant_{label}_{uuid.uuid4().hex[:8]}"
    product_id = f"prod_{label}_{uuid.uuid4().hex[:8]}"
    db.add(Merchant(id=merchant_id, name=f"{label} Merchant", currency="INR"))
    db.add(Product(
        id=product_id,
        merchant_id=merchant_id,
        name=f"{label} Laptop",
        category="Computers",
        description=f"{label} tenant product",
        price=price,
        inventory=10,
        currency="INR",
        features={},
        use_cases=[],
        metadata_={},
    ))
    db.add(MerchantPolicy(
        id=f"policy_{label}_{uuid.uuid4().hex[:8]}",
        merchant_id=merchant_id,
        max_discount_percent=10.0,
        max_discount_amount=5000.0,
        campaign_budget_limit=20000.0,
        approval_rules={},
    ))
    db.commit()
    db.close()
    return merchant_id, product_id


def test_search_with_merchant_scope_never_falls_back_to_other_tenant():
    merchant_a, product_a = _merchant_with_product("alpha")
    _merchant_b, _product_b = _merchant_with_product("beta")

    response = client.post(
        f"/api/products/search?merchant_id={merchant_a}",
        json={"query": "beta", "in_stock": True},
    )

    assert response.status_code == 200
    assert all(item["merchant_id"] == merchant_a for item in response.json())
    assert all(item["id"] != product_a or "beta" not in item["name"].lower() for item in response.json())


def test_cart_rejects_mixed_merchant_products():
    merchant_a, product_a = _merchant_with_product("cartalpha")
    _merchant_b, product_b = _merchant_with_product("cartbeta")
    db = SessionLocal()
    user_id = f"user_{uuid.uuid4().hex[:8]}"
    customer_id = f"customer_{uuid.uuid4().hex[:8]}"
    cart_id = f"cart_{uuid.uuid4().hex[:8]}"
    db.add(User(id=user_id, name="Cart User", email=f"{user_id}@example.com", password_hash="hash", role="customer"))
    db.add(Customer(id=customer_id, user_id=user_id, merchant_id=merchant_a, segment="new"))
    db.add(Cart(id=cart_id, merchant_id=merchant_a, customer_id=customer_id, status="active"))
    db.commit()

    service = CartService(db)
    service.add_item(cart_id, product_a, 1)

    try:
        service.add_item(cart_id, product_b, 1)
        raise AssertionError("Expected mixed-merchant cart to be rejected")
    except ValueError as exc:
        assert "one merchant" in str(exc)
    finally:
        db.close()


def test_agent_transact_idempotency_returns_existing_order(monkeypatch):
    monkeypatch.setattr(
        "app.services.razorpay_service.RazorpayService.create_order",
        lambda self, amount_inr, receipt, notes=None: (f"mock_order_{receipt}", "created"),
    )

    merchant_id, product_id = _merchant_with_product("agentidem", price=2500.0)
    idempotency_key = f"idem_{uuid.uuid4().hex[:12]}"

    payload = {
        "agent_id": "buyer-agent-1",
        "product_id": product_id,
        "quantity": 2,
        "proposed_discount_percent": 5,
        "idempotency_key": idempotency_key,
    }
    first = client.post("/api/agent/transact", json=payload)
    second = client.post("/api/agent/transact", json=payload)

    assert first.status_code == 200
    assert first.json()["status"] == "ORDER_CREATED"
    assert first.json()["merchant_id"] == merchant_id
    assert second.status_code == 200
    assert second.json()["status"] == "DUPLICATE"
    assert second.json()["razorpay_order"]["razorpay_order_id"] == first.json()["razorpay_order"]["razorpay_order_id"]

    db = SessionLocal()
    try:
        order_count = db.query(Order).filter(Order.merchant_id == merchant_id).count()
        action_count = db.query(AgentAction).filter(
            AgentAction.merchant_id == merchant_id,
            AgentAction.action_type == "AGENT_TRANSACTION_ACCEPTED",
            AgentAction.entity_id == idempotency_key,
        ).count()
        assert order_count == 1
        assert action_count == 1
    finally:
        db.close()


def test_chat_does_not_show_irrelevant_product_for_unavailable_specific_category(monkeypatch):
    merchant_id, _product_id = _merchant_with_product("chatlaptop", price=1999.0)
    monkeypatch.setattr("app.services.ai_supervisor.IntentService.process_intent", lambda self, text: type(
        "IntentResp",
        (),
        {
            "intent": type(
                "Intent",
                (),
                {
                    "model_dump": lambda self: {
                        "category": "smartphones",
                        "subcategory": None,
                        "max_price": None,
                        "min_price": None,
                        "currency": "INR",
                        "use_cases": [],
                        "required_features": [],
                        "preferred_features": [],
                        "keywords": ["smartphone"],
                    }
                },
            )(),
            "provider": "mock",
            "model": "test",
            "fallback_reason": None,
        },
    )())

    response = client.post(
        "/api/ai/chat/search",
        json={"text": "i want a smartphone", "thread_id": "test_thread", "merchant_id": merchant_id},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["results"] == []
    assert body["alternatives"]
    assert "don't currently have smartphones" in body["summary"]
    assert body["ai_provider"]["provider"] == "mock"


def test_chat_deals_query_returns_available_store_picks(monkeypatch):
    merchant_id, _product_id = _merchant_with_product("chatdeals", price=1999.0)
    monkeypatch.setattr("app.services.ai_supervisor.IntentService.process_intent", lambda self, text: type(
        "IntentResp",
        (),
        {
            "intent": type(
                "Intent",
                (),
                {
                    "model_dump": lambda self: {
                        "category": None,
                        "subcategory": None,
                        "max_price": None,
                        "min_price": None,
                        "currency": "INR",
                        "use_cases": [],
                        "required_features": [],
                        "preferred_features": [],
                        "keywords": ["best", "deals"],
                    }
                },
            )(),
            "provider": "mock",
            "model": "test",
            "fallback_reason": None,
        },
    )())

    response = client.post(
        "/api/ai/chat/search",
        json={"text": "what are the best deals", "thread_id": "test_thread", "merchant_id": merchant_id},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["results"]
    assert "store picks" in body["summary"]
    assert "not in stock" not in body["summary"].lower()
    assert body["offer"]


def test_chat_specs_query_answers_details_without_auto_discount(monkeypatch):
    db = SessionLocal()
    merchant_id = f"merchant_specs_{uuid.uuid4().hex[:8]}"
    product_id = f"prod_specs_{uuid.uuid4().hex[:8]}"
    db.add(Merchant(id=merchant_id, name="Specs Merchant", currency="INR"))
    db.add(Product(
        id=product_id,
        merchant_id=merchant_id,
        name="Creator Laptop",
        category="Laptops",
        description="A lightweight laptop for coding and creative work.",
        price=74999.0,
        inventory=7,
        currency="INR",
        features={"ram": "16GB", "storage": "512GB SSD", "processor": "Intel Core Ultra 5", "verified": True},
        use_cases=["coding", "editing"],
        metadata_={},
    ))
    db.add(MerchantPolicy(
        id=f"policy_specs_{uuid.uuid4().hex[:8]}",
        merchant_id=merchant_id,
        max_discount_percent=15.0,
        max_discount_amount=5000.0,
        campaign_budget_limit=20000.0,
        approval_rules={},
    ))
    db.commit()
    db.close()

    monkeypatch.setattr("app.services.ai_supervisor.IntentService.process_intent", lambda self, text: type(
        "IntentResp",
        (),
        {
            "intent": type(
                "Intent",
                (),
                {
                    "model_dump": lambda self: {
                        "category": "laptops",
                        "subcategory": None,
                        "max_price": None,
                        "min_price": None,
                        "currency": "INR",
                        "use_cases": [],
                        "required_features": [],
                        "preferred_features": [],
                        "keywords": ["laptop"],
                    }
                },
            )(),
            "provider": "mock",
            "model": "test",
            "fallback_reason": None,
        },
    )())

    response = client.post(
        "/api/ai/chat/search",
        json={"text": "what tech specs are there in this laptop", "thread_id": "test_thread", "merchant_id": merchant_id},
    )

    assert response.status_code == 200
    body = response.json()
    assert "available catalog details" in body["summary"]
    assert "16GB" in body["summary"]
    assert "512GB SSD" in body["summary"]
    assert body["results"] == []
    assert body["offer"] is None


def test_chat_followup_this_laptop_uses_previous_thread_product(monkeypatch):
    db = SessionLocal()
    merchant_id = f"merchant_memory_{uuid.uuid4().hex[:8]}"
    product_id = f"prod_memory_{uuid.uuid4().hex[:8]}"
    db.add(Merchant(id=merchant_id, name="Memory Merchant", currency="INR"))
    db.add(Product(
        id=product_id,
        merchant_id=merchant_id,
        name="Memory Laptop",
        category="Laptops",
        description="A laptop with remembered specs.",
        price=64000.0,
        inventory=4,
        currency="INR",
        features={"ram": "32GB", "storage": "1TB SSD"},
        use_cases=["coding"],
        metadata_={},
    ))
    db.add(MerchantPolicy(
        id=f"policy_memory_{uuid.uuid4().hex[:8]}",
        merchant_id=merchant_id,
        max_discount_percent=10.0,
        max_discount_amount=5000.0,
        campaign_budget_limit=20000.0,
        approval_rules={},
    ))
    db.commit()
    db.close()

    def fake_intent(_self, text):
        category = "laptops" if "laptop" in text.lower() else None
        return type(
            "IntentResp",
            (),
            {
                "intent": type(
                    "Intent",
                    (),
                    {
                        "model_dump": lambda self: {
                            "category": category,
                            "subcategory": None,
                            "max_price": None,
                            "min_price": None,
                            "currency": "INR",
                            "use_cases": [],
                            "required_features": [],
                            "preferred_features": [],
                            "keywords": ["laptop"],
                        }
                    },
                )(),
                "provider": "mock",
                "model": "test",
                "fallback_reason": None,
            },
        )()

    monkeypatch.setattr("app.services.ai_supervisor.IntentService.process_intent", fake_intent)

    thread_id = f"thread_memory_{uuid.uuid4().hex[:8]}"
    first = client.post(
        "/api/ai/chat/search",
        json={"text": "show me laptops", "thread_id": thread_id, "merchant_id": merchant_id},
    )
    second = client.post(
        "/api/ai/chat/search",
        json={"text": "what specs are there in this laptop", "thread_id": thread_id, "merchant_id": merchant_id},
    )

    assert first.status_code == 200
    assert first.json()["results"]
    assert second.status_code == 200
    assert "Memory Laptop" in second.json()["summary"]
    assert "32GB" in second.json()["summary"]
    assert second.json()["results"] == []
