import json
import uuid
from typing import List, Dict, Any, Annotated, TypedDict
from langchain_core.messages import HumanMessage, AIMessage, ToolMessage, SystemMessage
from langgraph.graph import StateGraph, END
from app.services.analytics import AnalyticsService
from app.models import AgentAction
from sqlalchemy.orm import Session

# We mock LLM for the hackathon MVP so it doesn't require OpenAI keys locally
class MockMerchantLLM:
    def invoke(self, messages: List[Any], tools: List[Any]) -> Any:
        last_msg = messages[-1].content.lower()
        
        # If it's a ToolMessage, we generate the final response
        if isinstance(messages[-1], ToolMessage):
            data = messages[-1].content
            return AIMessage(content=f"Based on the data: {data}. Let me know if you need recommendations.")
            
        # Intent routing mock
        if "revenue" in last_msg or "sales" in last_msg or "kpi" in last_msg:
            return AIMessage(
                content="",
                tool_calls=[{"name": "get_store_kpis", "args": {}, "id": "call_kpi"}]
            )
        elif "product" in last_msg or "top" in last_msg:
            return AIMessage(
                content="",
                tool_calls=[{"name": "get_top_products", "args": {"limit": 5}, "id": "call_prod"}]
            )
        elif "policy" in last_msg or "discount" in last_msg or "block" in last_msg:
            return AIMessage(
                content="",
                tool_calls=[{"name": "get_merchant_policy", "args": {}, "id": "call_pol"}]
            )
        elif "ai" in last_msg or "recommend" in last_msg or "activity" in last_msg:
            return AIMessage(
                content="",
                tool_calls=[{"name": "get_ai_activity", "args": {"limit": 5}, "id": "call_ai"}]
            )
        else:
            return AIMessage(content="I am your Merchant Copilot. I can help with revenue, top products, AI activity, and policy explanations. What would you like to know?")


from app.main import settings
from pydantic import BaseModel, Field

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
        
        if settings.gemini_api_key and settings.gemini_api_key != "":
            from langchain_google_genai import ChatGoogleGenerativeAI
            self.llm = ChatGoogleGenerativeAI(
                model="gemini-1.5-flash", 
                google_api_key=settings.gemini_api_key,
                temperature=0
            )
        else:
            self.llm = MockMerchantLLM()
            
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
            tools = [{"name": "get_store_kpis", "description": "Get revenue and orders"}, {"name": "explain_policy", "description": "Explain policy blocks"}]
            response = self.llm.invoke(state["messages"], tools=tools)
        else:
            tools = [GetStoreKPIs, GetTopProducts, GetMerchantPolicy, GetAIActivity]
            llm_with_tools = self.llm.bind_tools(tools)
            response = llm_with_tools.invoke(state["messages"])
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
                result_str = json.dumps(kpis)
            elif "get_top_products" in name or "gettopproducts" in name:
                prods = self.analytics.get_top_products(self.merchant_id, args.get("limit", 5))
                result_str = json.dumps(prods)
            elif "get_merchant_policy" in name or "getmerchantpolicy" in name:
                pol = self.analytics.get_merchant_policy(self.merchant_id)
                result_str = json.dumps({"policy": pol, "explanation": "Controls allowed AI discounts."})
            elif "get_ai_activity" in name or "getaiactivity" in name or "explain_policy" in name:
                activity = self.analytics.get_ai_activity(self.merchant_id, limit=args.get("limit", 5))
                result_str = json.dumps(activity)
                
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
        self.db.commit()

    def process_query(self, query: str, merchant_id: str = "default") -> str:
        system_prompt = SystemMessage(content="""
        You are the Razorpay AI Commerce Merchant Copilot.
        Follow these rules strictly:
        1. Distinguish between FACT and RECOMMENDATION.
        2. Never fabricate numbers. If data is missing, say 'I don't have enough data to determine that.'
        3. Do not directly execute SQL. Only use provided tools.
        4. Recommend actions based on data, but do not execute them financially.
        """)
        
        initial_state = {
            "messages": [system_prompt, HumanMessage(content=query)],
            "merchant_id": merchant_id
        }
        
        final_state = self.graph.invoke(initial_state)
        response_content = final_state["messages"][-1].content
        
        self.log_query(query, response_content)
        return response_content
