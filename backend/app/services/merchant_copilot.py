import json
import uuid
import logging
from typing import List, Dict, Any, Annotated, TypedDict
from langchain_core.messages import HumanMessage, AIMessage, ToolMessage, SystemMessage
from langgraph.graph import StateGraph, END
from app.services.analytics import AnalyticsService
from app.models import AgentAction
from sqlalchemy.orm import Session
from app.core.config import settings
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

class MockMerchantLLM:
    def invoke(self, messages: List[Any], tools: List[Any] = None) -> Any:
        last_msg = messages[-1].content.lower() if hasattr(messages[-1], "content") else ""
        
        if isinstance(messages[-1], ToolMessage):
            try:
                data = json.loads(messages[-1].content)
            except Exception:
                data = messages[-1].content
                
            if isinstance(data, list):
                if len(data) == 0:
                    return AIMessage(content="No data recorded yet for this period. As new orders come in, they will show up here.")
                
                # Format product list
                if isinstance(data[0], dict) and "name" in data[0]:
                    lines = ["Here are your top performing products:"]
                    for idx, p in enumerate(data, 1):
                        p_name = p.get("name", "Product")
                        p_price = float(p.get("price", 0) or 0)
                        p_orders = int(p.get("orders", 0) or 0)
                        p_rev = float(p.get("revenue", 0) or 0)
                        lines.append(f"{idx}. **{p_name}** — ₹{p_price:,.2f} | {p_orders} orders placed (₹{p_rev:,.2f} total revenue)")
                    return AIMessage(content="\n\n".join([lines[0], "\n".join(lines[1:])]))
                
                # Format activity list
                if isinstance(data[0], dict) and ("action" in data[0] or "agent" in data[0]):
                    lines = ["Recent store activities:"]
                    for a in data:
                        action_name = a.get("action") or a.get("action_type") or "Event"
                        reason = a.get("reason", "")
                        lines.append(f"• **{action_name}**: {reason}")
                    return AIMessage(content="\n".join(lines))
                    
            elif isinstance(data, dict):
                if "revenue" in data:
                    rev = float(data.get("revenue", 0) or 0)
                    orders = int(data.get("orders", 0) or 0)
                    aov = float(data.get("average_order_value", 0) or 0)
                    blocks = int(data.get("policy_blocks", 0) or 0)
                    return AIMessage(content=f"Here is your store summary:\n• **Total Revenue**: ₹{rev:,.2f}\n• **Total Paid Orders**: {orders}\n• **Average Order Value**: ₹{aov:,.2f}\n• **Security Rules Enforced**: {blocks}")
                elif "policy" in data:
                    pol = data.get("policy", {})
                    max_d = pol.get("max_discount_percent", 15)
                    free_s = pol.get("free_shipping_threshold", 999)
                    return AIMessage(content=f"Your current discount rules:\n• **Max Allowed Discount**: {max_d}%\n• **Free Shipping Threshold**: ₹{free_s:,.2f}\nAll discounts are automatically verified before checkout.")
                    
            return AIMessage(content="Your store data is up to date. Let me know if you need anything else!")
            
        user_text = ""
        for m in reversed(messages):
            if isinstance(m, HumanMessage):
                c_str = str(m.content)
                if "Question:" in c_str:
                    user_text = c_str.split("Question:")[-1].strip().lower()
                else:
                    user_text = c_str.lower()
                break
            elif hasattr(m, "content"):
                user_text = str(m.content).lower()

        if "product" in user_text or "top" in user_text or "selling" in user_text or "item" in user_text:
            return AIMessage(
                content="Fetching your top performing products...",
                tool_calls=[{"name": "get_top_products", "args": {"limit": 5}, "id": "call_prod"}]
            )
        elif "policy" in user_text or "discount" in user_text or "rule" in user_text:
            return AIMessage(
                content="Analyzing your store discount policies...",
                tool_calls=[{"name": "get_merchant_policy", "args": {}, "id": "call_pol"}]
            )
        elif "ai" in user_text or "recommend" in user_text or "activity" in user_text or "event" in user_text:
            return AIMessage(
                content="Retrieving recent AI agent actions...",
                tool_calls=[{"name": "get_ai_activity", "args": {"limit": 5}, "id": "call_ai"}]
            )
        elif "revenue" in user_text or "sales" in user_text or "order" in user_text or "kpi" in user_text or "make" in user_text:
            return AIMessage(
                content="Checking your store KPIs and revenue...",
                tool_calls=[{"name": "get_store_kpis", "args": {}, "id": "call_kpi"}]
            )
        else:
            return AIMessage(content="I am your Store AI Assistant. I can help check your revenue, top selling products, customer activity, and store rules. What would you like to know?")

class GetStoreKPIs(BaseModel):
    """Get revenue and orders."""
    pass

class GetTopProducts(BaseModel):
    """Get top performing products."""
    limit: int = Field(default=5, description="Number of products to return")

class GetMerchantPolicy(BaseModel):
    """Get the current merchant policy configurations."""
    pass

class GetAIActivity(BaseModel):
    """Get recent AI activity and policy blocks."""
    limit: int = Field(default=5, description="Number of activities to return")

class CopilotState(TypedDict):
    messages: List[Any]
    merchant_id: str

class MerchantCopilotSupervisor:
    def __init__(self, db: Session, merchant_id: str):
        self.db = db
        self.merchant_id = merchant_id
        self.analytics = AnalyticsService(db)
        self.mock_llm = MockMerchantLLM()
        
        if settings.gemini_api_key and settings.gemini_api_key != "":
            try:
                from langchain_google_genai import ChatGoogleGenerativeAI
                self.llm = ChatGoogleGenerativeAI(
                    model="gemini-2.5-flash", 
                    google_api_key=settings.gemini_api_key,
                    temperature=0
                )
            except Exception as e:
                logger.warning(f"Could not initialize ChatGoogleGenerativeAI: {e}")
                self.llm = self.mock_llm
        else:
            self.llm = self.mock_llm
            
        self.graph = self._build_graph()

    def _build_graph(self):
        workflow = StateGraph(CopilotState)
        
        workflow.add_node("agent", self._agent_node)
        workflow.add_node("action", self._action_node)
        
        workflow.set_entry_point("agent")
        workflow.add_conditional_edges("agent", self._should_continue)
        workflow.add_edge("action", "agent")
        
        return workflow.compile()

    def _agent_node(self, state: CopilotState):
        if isinstance(self.llm, MockMerchantLLM):
            tools = [{"name": "get_store_kpis", "description": "Get revenue and orders"}]
            response = self.llm.invoke(state["messages"], tools=tools)
        else:
            try:
                tools = [GetStoreKPIs, GetTopProducts, GetMerchantPolicy, GetAIActivity]
                llm_with_tools = self.llm.bind_tools(tools)
                response = llm_with_tools.invoke(state["messages"])
            except Exception as e:
                logger.warning(f"Live LLM call error, using mock fallback: {e}")
                response = self.mock_llm.invoke(state["messages"])
        return {"messages": [response]}

    def _should_continue(self, state: CopilotState):
        last_msg = state["messages"][-1]
        if hasattr(last_msg, "tool_calls") and last_msg.tool_calls:
            return "action"
        return END

    def _action_node(self, state: CopilotState):
        last_msg = state["messages"][-1]
        results = []
        for call in last_msg.tool_calls:
            name = call["name"].lower()
            args = call.get("args", {})
            result_str = "{}"
            
            if "get_store_kpis" in name or "getstorekpis" in name:
                kpis = self.analytics.get_dashboard_metrics(self.merchant_id)
                result_str = json.dumps(kpis, default=str)
            elif "get_top_products" in name or "gettopproducts" in name:
                prods = self.analytics.get_top_products(self.merchant_id, args.get("limit", 5))
                result_str = json.dumps(prods, default=str)
            elif "get_merchant_policy" in name or "getmerchantpolicy" in name:
                pol = self.analytics.get_merchant_policy(self.merchant_id)
                result_str = json.dumps({"policy": pol, "explanation": "Controls allowed AI discounts."}, default=str)
            elif "get_ai_activity" in name or "getaiactivity" in name or "explain_policy" in name:
                activity = self.analytics.get_ai_activity(self.merchant_id, limit=args.get("limit", 5))
                result_str = json.dumps(activity, default=str)
                
            results.append(ToolMessage(content=result_str, tool_call_id=call["id"]))
        return {"messages": results}
        
    def log_query(self, query: str, response: str):
        action = AgentAction(
            id=str(uuid.uuid4()),
            merchant_id=self.merchant_id,
            agent_name="MerchantCopilot",
            action_type="MERCHANT_COPILOT_QUERY",
            input={"query": query},
            decision={"response": response},
            reason="Copilot interaction",
            execution_status="COMPLETED"
        )
        self.db.add(action)
        try:
            self.db.commit()
        except Exception:
            self.db.rollback()

    def process_query(self, query: str, merchant_id: str = "default") -> str:
        prompt_content = (
            "You are the friendly Store AI Assistant for this shop.\n"
            "Answer the merchant's question in clean, simple, natural human language.\n"
            "Always format amounts with the Indian Rupee symbol (e.g. ₹200.00).\n"
            "NEVER return raw JSON, python dictionaries, code strings, or array brackets.\n"
            "Present product and sales lists using friendly bullet points or numbered lists.\n"
            f"Question: {query}"
        )
        
        initial_state = {
            "messages": [HumanMessage(content=prompt_content)],
            "merchant_id": merchant_id or self.merchant_id
        }
        
        final_state = self.graph.invoke(initial_state)
        response_content = final_state["messages"][-1].content
        
        self.log_query(query, response_content)
        return response_content