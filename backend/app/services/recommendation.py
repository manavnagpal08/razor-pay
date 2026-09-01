from sqlalchemy.orm import Session
from app.models import Product, ProductRelationship, AgentAction
from typing import List, Optional, Dict, Any
from pydantic import BaseModel

class RecommendationResponse(BaseModel):
    product_id: str
    score: float
    reasons: List[str]
    match_type: str

class UpsellResponse(BaseModel):
    original_product_id: str
    upgrade_product_id: str
    price_difference: float
    reasons: List[str]

class CrossSellResponse(BaseModel):
    original_product_id: str
    recommended_product_ids: List[str]

class RecommendationEngine:
    def __init__(self, db: Session, merchant_id: str = "demo_merchant"):
        self.db = db
        self.merchant_id = merchant_id

    def rank_products(self, products: List[Product], intent: Any) -> List[Dict[str, Any]]:
        ranked = []
        for p in products:
            score = 1.0
            reasons = []
            
            if p.price and intent.max_price and float(p.price) <= intent.max_price:
                score += 0.5
                reasons.append(f"Fits budget under ₹{intent.max_price}")
            
            if intent.use_cases and any(uc in (p.use_cases or []) for uc in intent.use_cases):
                score += 0.5
                reasons.append(f"Matches your intended use: {', '.join(intent.use_cases)}")
                
            ranked.append({
                "product": p,
                "score": score,
                "reasons": reasons,
                "match_type": "BEST_MATCH" if score >= 1.5 else "ALTERNATIVE"
            })
            
        ranked.sort(key=lambda x: x["score"], reverse=True)
        return ranked

    def find_upsell(self, product: Product) -> Optional[UpsellResponse]:
        # Search for UPSELL relationship or find slightly more expensive in same category
        upsells = self.db.query(ProductRelationship).filter(
            ProductRelationship.source_product_id == product.id,
            ProductRelationship.relationship_type == "UPSELL"
        ).order_by(ProductRelationship.priority.desc()).all()
        
        for rel in upsells:
            target = self.db.query(Product).filter(Product.id == rel.target_product_id, Product.inventory > 0).first()
            if target and target.price > product.price:
                diff = float(target.price - product.price)
                return UpsellResponse(
                    original_product_id=product.id,
                    upgrade_product_id=target.id,
                    price_difference=diff,
                    reasons=[f"For ₹{diff} more, you get a premium upgrade."]
                )
        return None

    def find_cross_sell(self, product: Product) -> Optional[CrossSellResponse]:
        cross_sells = self.db.query(ProductRelationship).filter(
            ProductRelationship.source_product_id == product.id,
            ProductRelationship.relationship_type.in_(["CROSS_SELL", "FREQUENTLY_BOUGHT_TOGETHER"])
        ).order_by(ProductRelationship.priority.desc()).limit(3).all()
        
        target_ids = []
        for rel in cross_sells:
            target = self.db.query(Product).filter(Product.id == rel.target_product_id, Product.inventory > 0).first()
            if target:
                target_ids.append(target.id)
                
        if target_ids:
            return CrossSellResponse(
                original_product_id=product.id,
                recommended_product_ids=target_ids
            )
        return None

    def log_action(self, agent_name: str, action_type: str, input_data: str, output_data: str, reason: str):
        import uuid
        action = AgentAction(
            id=str(uuid.uuid4()),
            merchant_id=self.merchant_id,
            agent_name=agent_name,
            action_type=action_type,
            input={"id": input_data},
            decision={"output": output_data},
            reason=reason,
            execution_status="SUCCESS"
        )
        self.db.add(action)
        self.db.commit()
