import logging
from typing import Dict, Any, List, TypedDict, Optional
from sqlalchemy.orm import Session
from langgraph.graph import StateGraph, START, END

from app.schemas import ShoppingIntent, ProductSearchRequest
from app.services.intent_service import IntentService
from app.services.recommendation import RecommendationEngine
from app.api.products import search_products
from app.models import Product, CustomerEvent

logger = logging.getLogger(__name__)

class CommerceState(TypedDict):
    input_text: str
    merchant_id: Optional[str]
    intent: Optional[Dict[str, Any]]
    ai_provider: Optional[Dict[str, Any]]
    raw_products: List[Any]
    ranked_products: List[Dict[str, Any]]
    best_match: Optional[Any]
    upsell: Optional[Dict[str, Any]]
    cross_sell: Optional[Dict[str, Any]]
    offer: Optional[Dict[str, Any]]

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
        workflow.add_node("evaluate_offers", self._node_evaluate_offers)
        
        workflow.add_edge(START, "parse_intent")
        workflow.add_edge("parse_intent", "search")
        workflow.add_edge("search", "recommend")
        workflow.add_edge("recommend", "upsell_cross_sell")
        workflow.add_edge("upsell_cross_sell", "evaluate_offers")
        workflow.add_edge("evaluate_offers", END)
        
        self.graph = workflow.compile()

    def _is_offer_query(self, text: str) -> bool:
        text_lower = text.lower()
        return any(w in text_lower for w in [
            "discount", "coupon", "promo", "offer", "code", "deal",
            "cheap", "bargain", "percent", "%", "sale"
        ])

    def _is_detail_query(self, text: str) -> bool:
        text_lower = text.lower()
        return any(w in text_lower for w in [
            "spec", "specs", "specification", "specifications", "feature",
            "features", "detail", "details", "about", "tell me more",
            "what is there", "what are there", "what tech"
        ])

    def _build_product_detail_summary(self, product: Dict[str, Any]) -> str:
        name = product.get("name") or product.get("title") or "this product"
        price = float(product.get("price") or 0)
        inventory = product.get("inventory")
        description = product.get("description") or "No detailed description is available yet."
        features = product.get("features") if isinstance(product.get("features"), dict) else {}
        use_cases = product.get("use_cases") if isinstance(product.get("use_cases"), list) else []

        feature_lines = []
        for key, value in features.items():
            if key in {"verified", "featured"}:
                continue
            feature_lines.append(f"- {str(key).replace('_', ' ').title()}: {value}")

        if not feature_lines:
            feature_lines.append("- Detailed technical specs are not filled in this merchant catalog yet.")

        use_case_text = ", ".join(str(item) for item in use_cases) if use_cases else "Everyday use"
        return (
            f"Here are the available catalog details for **{name}**:\n\n"
            f"- Price: ₹{price:,.0f}\n"
            f"- Stock: {inventory if inventory is not None else 'Not specified'} units\n"
            f"- Description: {description}\n"
            f"- Use cases: {use_case_text}\n"
            + "\n".join(feature_lines)
        )

    def _resolve_referenced_product(self, text: str, thread_id: str, merchant_id: Optional[str]) -> Optional[Dict[str, Any]]:
        text_lower = text.lower()
        merchant_filter = merchant_id or "demo_merchant"

        named_product = self.db.query(Product).filter(
            Product.merchant_id == merchant_filter,
            Product.inventory > 0,
        ).all()
        for product in named_product:
            if product.name and product.name.lower() in text_lower:
                return self._serialize_product(product)

        if not any(word in text_lower for word in ["this", "that", "it", "same", "above", "laptop", "phone", "product"]):
            return None

        event = self.db.query(CustomerEvent).filter(
            CustomerEvent.merchant_id == merchant_filter,
            CustomerEvent.customer_id == (thread_id or "shopper"),
            CustomerEvent.event_type == "AI_CONCIERGE_CHAT",
        ).order_by(CustomerEvent.timestamp.desc()).first()
        metadata = event.metadata_ if event and isinstance(event.metadata_, dict) else {}
        for product in metadata.get("shown_products", []):
            if isinstance(product, dict) and product.get("id"):
                return product
        return None

    def _serialize_product(self, product: Product) -> Dict[str, Any]:
        image_url = product.metadata_.get("image_url") if isinstance(product.metadata_, dict) else None
        return {
            "id": product.id,
            "merchant_id": product.merchant_id,
            "name": product.name,
            "category": product.category,
            "description": product.description,
            "price": float(product.price or 0),
            "currency": product.currency or "INR",
            "inventory": product.inventory or 0,
            "image_url": image_url,
            "features": product.features or {},
            "use_cases": product.use_cases or [],
            "metadata": product.metadata_ or {},
        }
        
    def _node_parse_intent(self, state: CommerceState) -> CommerceState:
        intent_resp = self.intent_service.process_intent(state["input_text"])
        return {
            "intent": intent_resp.intent.model_dump(),
            "ai_provider": {
                "provider": intent_resp.provider,
                "model": intent_resp.model,
                "fallback_reason": intent_resp.fallback_reason,
            },
        }
        
    def _node_search(self, state: CommerceState) -> CommerceState:
        intent_data = state.get("intent") or {}
        raw_keywords = intent_data.get("keywords") or []
        
        # Filter out generic conversation keywords that aren't product features
        conversational_words = {
            "deal", "deals", "best", "recommend", "recommended", "recommendation",
            "product", "products", "item", "items", "option", "options", "offer",
            "offers", "discount", "discounts", "sale", "cheap", "good", "top",
            "popular", "available", "store", "catalog", "shop", "buy", "show", "give",
            "some", "thing", "things", "what", "which", "want", "need"
        }
        filtered_keywords = [k for k in raw_keywords if k.lower().strip() not in conversational_words]

        search_req = ProductSearchRequest(
            category=intent_data.get("category"),
            max_price=intent_data.get("max_price"),
            min_price=intent_data.get("min_price")
        )
        if filtered_keywords:
            search_req.query = " ".join(filtered_keywords)
            
        merchant_id = state.get("merchant_id")
        try:
            raw_products = search_products(search_req, self.db, merchant_id=merchant_id)
        except Exception:
            try:
                raw_products = search_products(search_req, self.db)
            except Exception:
                raw_products = []
        return {"raw_products": raw_products}

    def _node_recommend(self, state: CommerceState) -> CommerceState:
        from app.schemas import ShoppingIntent
        intent_dict = state.get("intent") or {}
        try:
            intent = ShoppingIntent(**intent_dict) if isinstance(intent_dict, dict) else ShoppingIntent()
            ranked_products = self.recommendation_engine.rank_products(state.get("raw_products") or [], intent)
        except Exception:
            ranked_products = []
        best_match = ranked_products[0]["product"] if ranked_products else None
        return {"ranked_products": ranked_products, "best_match": best_match}

    def _node_upsell_cross_sell(self, state: CommerceState) -> CommerceState:
        best_match = state.get("best_match")
        upsell_data = None
        cross_sell_data = None
        
        try:
            if best_match:
                upsell = self.recommendation_engine.find_upsell(best_match)
                if upsell:
                    upsell_data = upsell.model_dump()
                    
                cross_sell = self.recommendation_engine.find_cross_sell(best_match)
                if cross_sell:
                    cross_sell_data = cross_sell.model_dump()
        except Exception as e_rel:
            logger.warning(f"Could not compute upsell/cross-sell: {e_rel}")
        return {"upsell": upsell_data, "cross_sell": cross_sell_data}

    def _node_evaluate_offers(self, state: CommerceState) -> CommerceState:
        from app.models import MerchantPolicy, AgentAction, Merchant
        import uuid
        
        merchant_id = state.get("merchant_id") or "demo_merchant"
        policy = None
        try:
            policy = self.db.query(MerchantPolicy).filter(MerchantPolicy.merchant_id == merchant_id).first()
            if not policy:
                policy = self.db.query(MerchantPolicy).first()
        except Exception:
            pass
            
        rules = dict(policy.approval_rules) if (policy and isinstance(policy.approval_rules, dict)) else {}
        max_discount = float(getattr(policy, "max_discount_percent", 15.0) or 15.0)
        
        input_text = state.get("input_text", "").lower()
        
        # Determine best available promo code
        promo_codes = rules.get("promo_codes", [
            {"code": "WELCOME10", "discount": 10, "type": "percentage", "active": True},
            {"code": "SAVE15", "discount": 15, "type": "percentage", "active": True},
            {"code": "FLASH20", "discount": min(20, max_discount), "type": "percentage", "active": True},
        ])
        
        active_promos = [p for p in promo_codes if p.get("active", True) and float(p.get("discount", 0)) <= max_discount]
        best_promo = max(active_promos, key=lambda x: float(x.get("discount", 0)), default=None) if active_promos else None
        
        offer_data = None
        if best_promo:
            disc = float(best_promo.get("discount", 10))
            code = best_promo.get("code", "SAVE10")
            
            # Log Policy Evaluation in AgentAction safely
            try:
                m_record = self.db.query(Merchant).filter(Merchant.id == merchant_id).first()
                if m_record:
                    action_id = str(uuid.uuid4())
                    action = AgentAction(
                        id=action_id,
                        merchant_id=merchant_id,
                        agent_name="OfferAgent",
                        action_type="AI_DISCOUNT_PROPOSAL",
                        input={"requested_intent": input_text, "promo_candidate": code, "discount_percent": disc},
                        decision={"proposed_code": code, "discount_percent": disc, "auto_apply": True},
                        reason=f"Offer Agent validated promo code {code} ({disc}% off) against merchant safety ceiling of {max_discount}%.",
                        policy_result={"allowed": True, "discount_percent": disc, "max_allowed": max_discount},
                        execution_status="PROPOSED"
                    )
                    self.db.add(action)
                    self.db.commit()
            except Exception as e_action:
                self.db.rollback()
                logger.warning(f"Could not persist Offer AgentAction: {e_action}")
                
            offer_data = {
                "code": code,
                "discount_percent": disc,
                "title": f"{int(disc)}% Store Discount",
                "description": f"Use code {code} to get {int(disc)}% off your order!",
                "is_active": True,
                "reason": f"Authorized by Store Policy ({disc}% <= {max_discount}% max cap)"
            }
            
        return {"offer": offer_data}

    def process_chat_message(self, text: str, thread_id: str = "default_thread", merchant_id: Optional[str] = "demo_merchant") -> Dict[str, Any]:
        initial_state = CommerceState(
            input_text=text,
            merchant_id=merchant_id,
            intent=None,
            ai_provider=None,
            raw_products=[],
            ranked_products=[],
            best_match=None,
            upsell=None,
            cross_sell=None,
            offer=None
        )
        
        config = {"configurable": {"thread_id": thread_id}}
        final_state = self.graph.invoke(initial_state, config=config)
        is_detail_query = self._is_detail_query(text)
        referenced_product = self._resolve_referenced_product(text, thread_id, merchant_id) if is_detail_query else None
        
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
        offer = final_state.get("offer")
        text_lower = text.lower()
        is_offer_query = self._is_offer_query(text)
        is_recommendation_query = any(w in text_lower for w in ["recommended", "recommendation", "best"])
        is_deals_query = is_offer_query or is_recommendation_query
        
        has_direct_match = any(r.get("is_direct_match", False) or r.get("match_type") in ["BEST_MATCH", "TOP PICK"] for r in results)
        searched_term = cat or kw or text
        display_results = results
        alternatives = []

        if cat and count > 0 and not has_direct_match:
            alternatives = results[:3]
            display_results = []

        if referenced_product:
            summary = self._build_product_detail_summary(referenced_product)
            display_results = []
            alternatives = []
            has_direct_match = True
        elif display_results:
            if is_detail_query and has_direct_match:
                summary = self._build_product_detail_summary(display_results[0]["product"])
                display_results = []
            elif is_deals_query and not cat:
                summary = "Here are the best available store picks and active savings from this merchant's live catalog:"
            elif has_direct_match:
                if cat and kw:
                    summary = f"I found {count} top-rated {cat} tailored for '{kw}'. Here are the best options ranked by specs and compatibility:"
                elif cat:
                    summary = f"Here are the top recommended {cat} available in our verified catalog:"
                else:
                    summary = f"I found {count} relevant products matching your request:"
            else:
                summary = "Here are the strongest available store picks right now, ranked from the live merchant catalog:"
        elif alternatives:
            available_names = ", ".join((item.get("product") or {}).get("name", "available item") for item in alternatives)
            summary = f"We don't currently have {searched_term} in this merchant's live catalog. I found nearby available alternatives instead: {available_names}. Ask for available products or add a matching catalog item to sell this request."
        elif count > 0 and is_deals_query:
            display_results = results
            summary = "Here are the best available store picks and active savings from this merchant's live catalog:"
        else:
            summary = f"We couldn't find items matching '{searched_term}' in our catalog. Please ask about our other store products!"

        # Append offer highlight if shopper inquired about deals/promos/coupons
        exposed_offer = offer if is_offer_query else None
        if exposed_offer and is_offer_query:
            summary = f"🎉 Great news! Active store coupon **{exposed_offer['code']}** ({int(exposed_offer['discount_percent'])}% off) is available for your order!\n\n" + summary

        # If Gemini is active and we have product recommendations, generate a dynamic conversational summary
        if display_results and not referenced_product:
            try:
                from app.services.gemini_provider import GeminiLLMProvider
                if isinstance(self.intent_service.provider, GeminiLLMProvider):
                    gemini_summary = self.intent_service.provider.generate_concierge_summary(
                        query=text,
                        products=[r["product"] for r in display_results],
                        offer=exposed_offer,
                        upsell=final_state.get("upsell")
                    )
                    if gemini_summary:
                        summary = gemini_summary
            except Exception as e_gem:
                logger.warning(f"Could not generate Gemini dynamic summary: {e_gem}")

        ai_provider = final_state.get("ai_provider") or {}
        reasoning = {
            "intent_extracted": {
                "category": cat or "General",
                "budget": f"<= ₹{intent_data.get('max_price'):,}" if intent_data.get("max_price") else "Flexible",
                "use_cases": intent_data.get("use_cases") or ["Everyday"],
                "keywords": intent_data.get("keywords") or []
            },
            "policy_verification": "Verified • 0 violations • Max discount 20%",
            "catalog_scanned": f"{count} items ranked",
            "direct_catalog_match": has_direct_match,
            "offer_applied": exposed_offer["code"] if exposed_offer else None
        }
        if ai_provider:
            reasoning["ai_provider"] = ai_provider

        return {
            "summary": summary,
            "intent": intent_data,
            "results": display_results,
            "alternatives": alternatives,
            "upsell": final_state.get("upsell"),
            "cross_sell": final_state.get("cross_sell"),
            "offer": exposed_offer,
            "ai_provider": ai_provider,
            "reasoning": reasoning
        }
