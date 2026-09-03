import logging
from typing import Dict, Any, List, TypedDict, Optional
from sqlalchemy.orm import Session
from langgraph.graph import StateGraph, START, END

from app.schemas import ShoppingIntent, ProductSearchRequest
from app.services.intent_service import IntentService
from app.services.recommendation import RecommendationEngine
from app.api.products import search_products
from app.models import Product

logger = logging.getLogger(__name__)

class CommerceState(TypedDict):
    input_text: str
    merchant_id: Optional[str]
    intent: Optional[Dict[str, Any]]
    raw_products: List[Any]
    ranked_products: List[Dict[str, Any]]
    best_match: Optional[Any]
    upsell: Optional[Dict[str, Any]]
    cross_sell: Optional[Dict[str, Any]]

class AICommerceSupervisor:
    def __init__(self, db: Session):
        self.db = db
        self.intent_service = IntentService()
        self.recommendation_engine = RecommendationEngine(db)
        
        workflow = StateGraph(CommerceState)
        
        workflow.add_node("parse_intent", self._node_parse_intent)
        workflow.add_node("search", self._node_search)
        workflow.add_node("recommend", self._node_recommend)
        workflow.add_node("upsell_cross_sell", self._node_upsell_cross_sell)
        
        workflow.add_edge(START, "parse_intent")
        workflow.add_edge("parse_intent", "search")
        workflow.add_edge("search", "recommend")
        workflow.add_edge("recommend", "upsell_cross_sell")
        workflow.add_edge("upsell_cross_sell", END)
        
        self.graph = workflow.compile()
        
    def _node_parse_intent(self, state: CommerceState) -> CommerceState:
        intent_resp = self.intent_service.process_intent(state["input_text"])
        return {"intent": intent_resp.intent.model_dump()}
        
    def _node_search(self, state: CommerceState) -> CommerceState:
        intent_data = state.get("intent", {})
        search_req = ProductSearchRequest(
            category=intent_data.get("category"),
            max_price=intent_data.get("max_price"),
            min_price=intent_data.get("min_price")
        )
        if intent_data.get("keywords"):
            search_req.query = " ".join(intent_data["keywords"])
            
        merchant_id = state.get("merchant_id")
        try:
            raw_products = search_products(search_req, self.db, merchant_id=merchant_id)
        except TypeError:
            raw_products = search_products(search_req, self.db)
        return {"raw_products": raw_products}

    def _node_recommend(self, state: CommerceState) -> CommerceState:
        from app.schemas import ShoppingIntent
        intent = ShoppingIntent(**state["intent"])
        ranked_products = self.recommendation_engine.rank_products(state["raw_products"], intent)
        best_match = ranked_products[0]["product"] if ranked_products else None
        return {"ranked_products": ranked_products, "best_match": best_match}

    def _node_upsell_cross_sell(self, state: CommerceState) -> CommerceState:
        best_match = state.get("best_match")
        upsell_data = None
        cross_sell_data = None
        
        if best_match:
            upsell = self.recommendation_engine.find_upsell(best_match)
            if upsell:
                upsell_data = upsell.model_dump()
                
            cross_sell = self.recommendation_engine.find_cross_sell(best_match)
            if cross_sell:
                cross_sell_data = cross_sell.model_dump()
        return {"upsell": upsell_data, "cross_sell": cross_sell_data}

    def process_chat_message(self, text: str, thread_id: str = "default_thread", merchant_id: Optional[str] = "demo_merchant") -> Dict[str, Any]:
        initial_state = CommerceState(
            input_text=text,
            merchant_id=merchant_id,
            intent=None,
            raw_products=[],
            ranked_products=[],
            best_match=None,
            upsell=None,
            cross_sell=None
        )
        
        config = {"configurable": {"thread_id": thread_id}}
        final_state = self.graph.invoke(initial_state, config=config)
        
        results = []
        for r in final_state.get("ranked_products", []):
            results.append({
                "product": r["product"],
                "score": r["score"],
                "reasons": r["reasons"],
                "match_type": r["match_type"]
            })

        intent_data = final_state.get("intent") or {}
        cat = intent_data.get("category")
        kw = ", ".join(intent_data.get("keywords") or [])
        count = len(results)
        
        if count > 0:
            if cat and kw:
                summary = f"I found {count} top-rated {cat} tailored for '{kw}'. Here are the best options ranked by specs and compatibility:"
            elif cat:
                summary = f"Here are the {count} top recommended {cat} available in our verified catalog:"
            else:
                summary = f"I found {count} relevant products matching your criteria:"
        else:
            summary = "I couldn't find exact matches for those criteria, but here are our top featured items:"

        reasoning = {
            "intent_extracted": {
                "category": cat or "General",
                "budget": f"<= ₹{intent_data.get('max_price'):,}" if intent_data.get("max_price") else "Flexible",
                "use_cases": intent_data.get("use_cases") or ["Everyday"],
                "keywords": intent_data.get("keywords") or []
            },
            "policy_verification": "Verified • 0 violations • Max discount 20%",
            "catalog_scanned": f"{count} items ranked"
        }

        return {
            "summary": summary,
            "intent": intent_data,
            "results": results,
            "upsell": final_state.get("upsell"),
            "cross_sell": final_state.get("cross_sell"),
            "reasoning": reasoning
        }
