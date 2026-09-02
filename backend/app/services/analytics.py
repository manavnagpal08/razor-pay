from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.models import Order, AgentAction, Product, CartItem, MerchantPolicy
from typing import Dict, Any, List

class AnalyticsService:
    def __init__(self, db: Session):
        self.db = db

    def get_dashboard_metrics(self, merchant_id: str) -> Dict[str, Any]:
        """
        Calculates KPIs from transactional data isolated by merchant_id.
        """
        paid_orders = self.db.query(
            func.sum(Order.amount).label("revenue"),
            func.count(Order.id).label("total_orders")
        ).filter(Order.status == "PAID", Order.merchant_id == merchant_id).first()
        
        revenue = float(paid_orders.revenue or 0)
        total_orders = int(paid_orders.total_orders or 0)
        aov = revenue / total_orders if total_orders > 0 else 0.0

        ai_recommendations = self.db.query(func.count(AgentAction.id)).filter(
            AgentAction.merchant_id == merchant_id,
            AgentAction.action_type.in_(["RECOMMENDATION", "UPSELL_RECOMMENDATION", "CROSS_SELL_RECOMMENDATION"])
        ).scalar() or 0

        try:
            policy_actions = self.db.query(AgentAction).filter(
                AgentAction.merchant_id == merchant_id,
                AgentAction.action_type == "AI_DISCOUNT_PROPOSAL"
            ).all()
            policy_blocks = sum(
                1 for a in policy_actions 
                if isinstance(a.policy_result, dict) and not a.policy_result.get("allowed", True)
            )
        except Exception:
            policy_blocks = 0
        
        upsell_count = self.db.query(func.count(AgentAction.id)).filter(
            AgentAction.merchant_id == merchant_id,
            AgentAction.action_type == "UPSELL_RECOMMENDATION"
        ).scalar() or 0

        cross_sell_count = self.db.query(func.count(AgentAction.id)).filter(
            AgentAction.merchant_id == merchant_id,
            AgentAction.action_type == "CROSS_SELL_RECOMMENDATION"
        ).scalar() or 0

        return {
            "revenue": revenue,
            "orders": total_orders,
            "average_order_value": aov,
            "ai_recommendations": ai_recommendations,
            "ai_assisted_orders": 0, 
            "upsell_proposals": upsell_count,
            "cross_sell_proposals": cross_sell_count,
            "policy_blocks": policy_blocks
        }

    def get_recent_orders(self, merchant_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        orders = self.db.query(Order).filter(Order.merchant_id == merchant_id)\
            .order_by(desc(Order.created_at)).limit(limit).all()
        
        return [{
            "id": o.id,
            "customer_id": o.customer_id or "Guest",
            "amount": float(o.amount),
            "status": o.status,
            "created_at": o.created_at
        } for o in orders]

    def get_ai_activity(self, merchant_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        actions = self.db.query(AgentAction).filter(AgentAction.merchant_id == merchant_id)\
            .order_by(desc(AgentAction.timestamp)).limit(limit).all()
            
        return [{
            "id": action.id,
            "agent": action.agent_name,
            "action": action.action_type,
            "reason": action.reason,
            "result": action.policy_result if action.policy_result else "Logged",
            "timestamp": action.timestamp
        } for action in actions]

    def get_top_products(self, merchant_id: str, limit: int = 5) -> List[Dict[str, Any]]:
        products = self.db.query(Product).filter(Product.merchant_id == merchant_id).all()
        stats = []
        for p in products:
            ordered_qty = self.db.query(func.sum(CartItem.quantity)).join(Order, Order.cart_id == CartItem.cart_id).filter(
                Order.status == "PAID",
                CartItem.product_id == p.id
            ).scalar() or 0
            
            stats.append({
                "id": p.id,
                "name": p.name,
                "price": float(p.price),
                "orders": int(ordered_qty),
                "revenue": float(p.price) * int(ordered_qty)
            })
        
        stats.sort(key=lambda x: x["revenue"], reverse=True)
        return stats[:limit]

    def get_merchant_policy(self, merchant_id: str) -> Dict[str, Any]:
        policy = self.db.query(MerchantPolicy).filter(MerchantPolicy.merchant_id == merchant_id).first()
        if not policy:
            return {}
        return {
            "id": policy.id,
            "max_discount_percent": float(policy.max_discount_percent) if policy.max_discount_percent else 0,
            "max_discount_amount": float(policy.max_discount_amount) if policy.max_discount_amount else 0,
        }

    def update_merchant_policy(self, merchant_id: str, max_discount_percent: float) -> Dict[str, Any]:
        policy = self.db.query(MerchantPolicy).filter(MerchantPolicy.merchant_id == merchant_id).first()
        if not policy:
            policy = MerchantPolicy(merchant_id=merchant_id, max_discount_percent=max_discount_percent)
            self.db.add(policy)
        else:
            policy.max_discount_percent = max_discount_percent
        self.db.commit()
        return self.get_merchant_policy(merchant_id)
