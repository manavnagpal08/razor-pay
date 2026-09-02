from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.services.ai_supervisor import AICommerceSupervisor
from app.database import SessionLocal

class AgentOrchestrator:
    """
    Central LangGraph Supervisor Orchestrator for the Razorpay AI Commerce OS.
    Seamlessly routes shopping queries through Intent -> Search -> Recommendation -> Policy Guardrails.
    """
    def __init__(self, db: Optional[Session] = None):
        self.db = db

    def process_request(self, user_input: str, thread_id: str = "default_thread", db: Optional[Session] = None) -> Dict[str, Any]:
        active_db = db or self.db or SessionLocal()
        should_close = db is None and self.db is None
        try:
            supervisor = AICommerceSupervisor(active_db)
            return supervisor.process_chat_message(user_input, thread_id)
        finally:
            if should_close:
                active_db.close()

orchestrator = AgentOrchestrator()