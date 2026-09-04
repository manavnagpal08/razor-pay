import pytest
from fastapi.testclient import TestClient

from app.core.config import Settings
from app.database import get_db
from app.main import app
from app.models import AgentAction, Cart, CartItem, Customer, Merchant, MerchantPolicy, Order, Product, User
from app.services.razorpay_service import RazorpayService
from app.services.order import OrderService
from app.core.security import create_access_token


client = TestClient(app)


def test_production_settings_require_real_secrets():
    with pytest.raises(ValueError) as exc:
        Settings(
            _env_file=None,
            ENVIRONMENT="production",
            DATABASE_URL="sqlite:///./dev.db",
            JWT_SECRET="dev-only-change-me",
            RAZORPAY_KEY_ID="test",
            RAZORPAY_KEY_SECRET="test",
            RAZORPAY_WEBHOOK_SECRET="",
        )

    message = str(exc.value)
    assert "DATABASE_URL" in message
    assert "JWT_SECRET" in message
    assert "RAZORPAY_KEY_ID" in message
    assert "RAZORPAY_KEY_SECRET" in message
    assert "RAZORPAY_WEBHOOK_SECRET" in message
    assert "AGENT_API_KEYS" in message


def test_development_razorpay_uses_explicit_mock_mode():
    service = RazorpayService(key_id="test", key_secret="test")
    order_id, status = service.create_order(1999.0, "receipt_123")

    assert service.is_mock is True
    assert order_id.startswith("mock_order_")
    assert status == "created"


def test_production_settings_accept_complete_secret_set():
    settings = Settings(
        _env_file=None,
        ENVIRONMENT="production",
        DATABASE_URL="postgresql://user:pass@localhost:5432/app",
        JWT_SECRET="a-production-secret-with-more-than-32-chars",
        RAZORPAY_KEY_ID="rzp_test_valid",
        RAZORPAY_KEY_SECRET="realish_secret",
        RAZORPAY_WEBHOOK_SECRET="webhook_secret",
        AGENT_API_KEYS="agent_key_one,agent_key_two",
        CORS_ORIGINS="https://shop.example.com,https://merchant.example.com",
    )

    assert settings.agent_api_keys == ["agent_key_one", "agent_key_two"]
    assert settings.cors_origins == ["https://shop.example.com", "https://merchant.example.com"]


def test_mock_webhook_marks_order_paid(monkeypatch):
    class Query:
        def __init__(self, db, model):
            self.db = db
            self.model = model

        def filter(self, *args, **kwargs):
            return self

        def first(self):
            if self.model is Order:
                return self.db.order
            return None

    class Db:
        def __init__(self):
            self.order = Order(
                id="ord_internal_1",
                merchant_id="merchant_1",
                customer_id="customer_1",
                cart_id="cart_1",
                razorpay_order_id="mock_order_123",
                amount=4999.0,
                currency="INR",
                status="PAYMENT_PENDING",
            )
            self.added = []
            self.committed = False

        def query(self, model):
            return Query(self, model)

        def add(self, value):
            self.added.append(value)

        def add_all(self, values):
            self.added.extend(values)

        def commit(self):
            self.committed = True

        def close(self):
            pass

    db = Db()
    app.dependency_overrides[get_db] = lambda: db
    monkeypatch.setattr(
        "app.services.razorpay_service.RazorpayService.verify_webhook_signature",
        lambda self, payload_body, webhook_signature, webhook_secret: True,
    )

    response = client.post(
        "/api/orders/webhook",
        json={
            "event": "payment.captured",
            "payload": {
                "payment": {
                    "entity": {
                        "order_id": "mock_order_123",
                        "id": "pay_123",
                    }
                }
            },
        },
        headers={"X-Razorpay-Signature": "mock_valid_webhook_signature"},
    )

    app.dependency_overrides.clear()

    assert response.status_code == 200
    assert db.order.status == "PAID"
    assert db.committed is True
    assert any(item.__class__.__name__ == "Payment" for item in db.added)
    assert any(item.__class__.__name__ == "AgentAction" for item in db.added)


def test_checkout_reserves_inventory_and_rejects_reused_cart(monkeypatch):
    monkeypatch.setattr(
        "app.services.razorpay_service.RazorpayService.create_order",
        lambda self, amount_inr, receipt, notes=None: ("mock_order_inventory_lock", "created"),
    )

    db = next(get_db())
    merchant_id = "merchant_inventory_lock"
    customer_id = "customer_inventory_lock"
    product_id = "product_inventory_lock"
    cart_id = "cart_inventory_lock"

    db.query(CartItem).filter(CartItem.cart_id == cart_id).delete()
    db.query(Order).filter(Order.cart_id == cart_id).delete()
    db.query(Cart).filter(Cart.id == cart_id).delete()
    db.query(Product).filter(Product.id == product_id).delete()
    db.query(Customer).filter(Customer.id == customer_id).delete()
    db.query(MerchantPolicy).filter(MerchantPolicy.merchant_id == merchant_id).delete()
    db.query(Merchant).filter(Merchant.id == merchant_id).delete()
    db.query(User).filter(User.id == "user_inventory_lock").delete()
    db.commit()

    user = User(
        id="user_inventory_lock",
        name="Inventory Customer",
        email="inventory@example.com",
        password_hash="hash",
        role="customer",
    )
    merchant = Merchant(id=merchant_id, name="Inventory Merchant", currency="INR")
    customer = Customer(id=customer_id, user_id=user.id, merchant_id=merchant_id, segment="new")
    product = Product(
        id=product_id,
        merchant_id=merchant_id,
        name="Reserved Product",
        category="Test",
        price=1000.0,
        inventory=2,
        currency="INR",
        features={},
        use_cases=[],
        metadata_={},
    )
    policy = MerchantPolicy(
        id="policy_inventory_lock",
        merchant_id=merchant_id,
        max_discount_percent=15.0,
        max_discount_amount=5000.0,
        campaign_budget_limit=10000.0,
        approval_rules={},
    )
    cart = Cart(
        id=cart_id,
        merchant_id=merchant_id,
        customer_id=customer_id,
        status="active",
        subtotal=1000.0,
        discount=0.0,
        total=1000.0,
    )
    item = CartItem(id="cart_item_inventory_lock", cart_id=cart_id, product_id=product_id, quantity=2, unit_price=1000.0)
    db.add_all([user, merchant, customer, product, policy, cart, item])
    db.commit()

    result = OrderService(db).create_order_from_cart(cart_id)
    db.refresh(product)
    db.refresh(cart)

    assert result["amount"] == 2000.0
    assert product.inventory == 0
    assert cart.status == "payment_pending"

    try:
        OrderService(db).create_order_from_cart(cart_id)
        raise AssertionError("Expected reused payment_pending cart to fail")
    except ValueError as exc:
        assert "no longer active" in str(exc)
    finally:
        db.close()


def test_webhook_replay_is_idempotent(monkeypatch):
    db = next(get_db())
    merchant_id = "merchant_webhook_replay"
    order_id = "order_webhook_replay"
    rzp_order_id = "rzp_order_webhook_replay"
    event_id = "evt_replay_123"

    db.query(AgentAction).filter(AgentAction.entity_id == event_id).delete()
    db.query(Order).filter(Order.id == order_id).delete()
    db.query(Merchant).filter(Merchant.id == merchant_id).delete()
    db.commit()

    db.add(Merchant(id=merchant_id, name="Webhook Replay Merchant", currency="INR"))
    db.add(Order(
        id=order_id,
        merchant_id=merchant_id,
        customer_id="customer_webhook_replay",
        cart_id="cart_webhook_replay",
        razorpay_order_id=rzp_order_id,
        amount=2500.0,
        currency="INR",
        status="PAYMENT_PENDING",
    ))
    db.commit()
    db.close()

    monkeypatch.setattr(
        "app.services.razorpay_service.RazorpayService.verify_webhook_signature",
        lambda self, payload_body, webhook_signature, webhook_secret: True,
    )

    payload = {
        "event": "payment.captured",
        "payload": {"payment": {"entity": {"order_id": rzp_order_id, "id": "pay_replay_123"}}},
    }
    headers = {"X-Razorpay-Signature": "valid", "X-Razorpay-Event-Id": event_id}

    first = client.post("/api/orders/webhook", json=payload, headers=headers)
    second = client.post("/api/orders/webhook", json=payload, headers=headers)

    assert first.status_code == 200
    assert first.json() == {"status": "ok"}
    assert second.status_code == 200
    assert second.json() == {"status": "ok", "duplicate": True}


def test_production_auth_rejects_unverified_forged_token(monkeypatch):
    merchant_id = "forged_merchant_id"
    forged_token = create_access_token(subject=merchant_id)
    monkeypatch.setattr("app.api.dependencies.settings.jwt_secret", "different-production-secret")
    monkeypatch.setattr("app.api.dependencies.settings.environment", "production")

    response = client.get(
        "/api/merchant/dashboard",
        headers={"Authorization": f"Bearer {forged_token}"},
    )

    assert response.status_code == 401


def test_production_sync_rejects_unverified_external_token(monkeypatch):
    monkeypatch.setattr("app.core.config.settings.environment", "production")

    response = client.post(
        "/api/auth/sync",
        json={"firebase_token": "not-a-real-token", "role": "customer", "name": "Forged User"},
    )

    assert response.status_code == 401


def test_google_auth_requires_verified_token_in_production(monkeypatch):
    monkeypatch.setattr("app.core.config.settings.environment", "production")

    response = client.post(
        "/api/auth/google",
        json={"email": "merchant@example.com", "name": "Merchant", "role": "merchant"},
    )

    assert response.status_code == 401


def test_auth_rejects_unknown_roles():
    response = client.post(
        "/api/auth/register",
        json={
            "email": "badrole@example.com",
            "password": "password123",
            "name": "Bad Role",
            "role": "superadmin",
        },
    )

    assert response.status_code == 422


def test_ai_provider_status_does_not_expose_secret(monkeypatch):
    monkeypatch.setattr("app.api.ai.settings.gemini_api_key", "secret-value")

    response = client.get("/api/ai/provider/status")

    assert response.status_code == 200
    body = response.json()
    assert body["gemini_key_configured"] is True
    assert body["gemini_key_length"] == len("secret-value")
    assert "secret-value" not in str(body)
