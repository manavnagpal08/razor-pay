from typing import Optional
from sqlalchemy.orm import Session
from app.models import MerchantPolicy, AgentAction
from app.schemas import PolicyResult
import uuid

class PolicyEngine:
    def __init__(self, db: Session, merchant_id: str = "demo_merchant"):
        self.db = db
        self.merchant_id = merchant_id

    def evaluate_discount_proposal(self, cart_total: float, proposed_discount_percentage: float) -> PolicyResult:
        """
        Validates if an AI-proposed discount is within merchant limits.
        """
        policy = self.db.query(MerchantPolicy).filter(MerchantPolicy.merchant_id == self.merchant_id).first()
        
        # If no policy is seeded, default to strict rejection
        if not policy:
            return PolicyResult(allowed=False, reason="No active merchant policy found. All manual discounts blocked.")
            
        max_percent = float(policy.max_discount_percent)
        
        if proposed_discount_percentage > max_percent:
            reason = f"Discount exceeds merchant-configured maximum of {max_percent}%."
            self._log_policy_action("AI_DISCOUNT_PROPOSAL", {"proposed_percent": proposed_discount_percentage}, False, reason)
            return PolicyResult(allowed=False, reason=reason)
            
        self._log_policy_action("AI_DISCOUNT_PROPOSAL", {"proposed_percent": proposed_discount_percentage}, True, "Within policy limits.")
        return PolicyResult(allowed=True, reason="Discount within policy limits.")

    def _log_policy_action(self, action_type: str, input_data: dict, allowed: bool, reason: str):
        action = AgentAction(
            id=str(uuid.uuid4()),
            merchant_id=self.merchant_id,
            agent_name="PolicyEngine",
            action_type=action_type,
            input=input_data,
            policy_result={"allowed": allowed},
            reason=reason,
            execution_status="SUCCESS"
        )
        self.db.add(action)
        self.db.commit()
