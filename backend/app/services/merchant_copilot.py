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
        last_msg = messages[-1].content.lower()
        
        if isinstance(messages[-1], ToolMessage):
            data = messages[-1].content
            return AIMessage(content=f"Based on the store data: {data}. Let me know if you need recommendations.")
            
        if "revenue" in last_msg or "sales" in last_msg or "kpi" in last_msg:
            return AIMessage(
                content="Checking your store KPIs and revenue...",
                tool_calls=[{"name": "get_store_kpis", "args": {}, "id": "call_kpi"}]
            )
        elif "product" in last_msg or "top" in last_msg:
            return AIMessage(
                content="Fetching your top performing products...",
                tool_calls=[{"name": "get_top_products", "args": {"limit": 5}, "id": "call_prod"}]
            )
        elif "policy" in last_msg or "discount" in last_msg or "block" in last_msg:
            return AIMessage(
                content="Analyzing your store discount policies...",
                tool_calls=[{"name": "get_merchant_policy", "args": {}, "id": "call_pol"}]
            )
        elif "ai" in last_msg or "recommend" in last_msg or "activity" in last_msg:
            return AIMessage(
                content="Retrieving recent AI agent actions...",
                tool_calls=[{"name": "get_ai_activity", "args": {"limit": 5}, "id": "call_ai"}]
            )
        else:
            return AIMessage(content="I am your Merchant Copilot. I can help with revenue, top products, AI activity, and policy explanations. What would you like to know?")

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
            "You are the Razorpay AI Commerce Merchant Copilot.\n"
            "Distinguish between FACT and RECOMMENDATION. Never fabricate numbers.\n"
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