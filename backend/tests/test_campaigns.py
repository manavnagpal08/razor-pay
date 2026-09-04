import uuid

from fastapi.testclient import TestClient

from app.core.security import create_access_token
from app.database import SessionLocal
from app.main import app
from app.models import AgentAction, Merchant, MerchantPolicy, User


client = TestClient(app)


def create_merchant_fixture():
    db = SessionLocal()
    merchant_id = f"merchant_{uuid.uuid4().hex[:12]}"
    user = User(
        id=merchant_id,
        name="Campaign Merchant",
        email=f"{merchant_id}@example.com",
        password_hash="hash",
        role="merchant",
    )
    merchant = Merchant(id=merchant_id, name="Campaign Merchant", currency="INR")
    policy = MerchantPolicy(
        id=str(uuid.uuid4()),
        merchant_id=merchant_id,
        max_discount_percent=15.0,
        max_discount_amount=5000.0,
        campaign_budget_limit=10000.0,
        approval_rules={},
    )
    db.add_all([user, merchant, policy])
    db.commit()
    db.close()
    return merchant_id, create_access_token(subject=merchant_id)


def test_campaign_proposal_and_approval_are_policy_gated():
    merchant_id, token = create_merchant_fixture()

    proposal = client.post(
        "/api/merchant/campaigns/propose",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "name": "Weekend Upsell Push",
            "objective": "increase_aov",
            "audience": "returning_customers",
            "budget": 5000.0,
            "discount_percent": 10.0,
            "message": "Upgrade bundles for high-intent shoppers",
        },
    )

    assert proposal.status_code == 200
    proposal_body = proposal.json()
    assert proposal_body["status"] == "PENDING_APPROVAL"
    assert proposal_body["policy_result"]["allowed"] is True

    approval = client.post(
        f"/api/merchant/campaigns/{proposal_body['id']}/approve",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert approval.status_code == 200
    assert approval.json()["status"] == "APPROVED"

    db = SessionLocal()
    try:
        action_count = db.query(AgentAction).filter(
            AgentAction.merchant_id == merchant_id,
            AgentAction.action_type.in_(["CAMPAIGN_PROPOSED", "CAMPAIGN_APPROVED"]),
        ).count()
        assert action_count == 2
    finally:
        db.close()


def test_campaign_policy_blocks_excessive_budget_and_discount():
    _merchant_id, token = create_merchant_fixture()

    response = client.post(
        "/api/merchant/campaigns/propose",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "name": "Unsafe Deep Discount",
            "objective": "growth",
            "audience": "all",
            "budget": 50000.0,
            "discount_percent": 40.0,
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "POLICY_BLOCKED"
    assert body["policy_result"]["allowed"] is False
    assert len(body["policy_result"]["violations"]) == 2
