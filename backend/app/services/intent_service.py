from app.schemas import ShoppingIntent, IntentResponse
from app.services.llm_provider import get_llm_provider
import logging

logger = logging.getLogger(__name__)

class IntentService:
    def __init__(self):
        self.provider = get_llm_provider()

    def process_intent(self, text: str) -> IntentResponse:
        if not text or not text.strip():
            raise ValueError("Input text cannot be empty")
            
        try:
            structured_intent = self.provider.extract_intent(text)
            
            # Additional deterministic validation could go here
            if structured_intent.max_price and structured_intent.max_price <= 0:
                structured_intent.max_price = None
                
            return IntentResponse(
                intent=structured_intent,
                original_text=text,
                confidence=1.0,
                provider=getattr(self.provider, "provider_name", self.provider.__class__.__name__),
                model=getattr(self.provider, "model_name", None),
                fallback_reason=getattr(self.provider, "fallback_reason", None),
            )
        except Exception as e:
            logger.error(f"Failed to extract intent: {str(e)}")
            raise e
