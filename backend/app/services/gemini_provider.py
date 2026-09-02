from app.services.llm_provider import LLMProvider
from app.schemas import ShoppingIntent
from langchain_google_genai import ChatGoogleGenerativeAI
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class GeminiLLMProvider(LLMProvider):
    """Real implementation for extracting intent using Gemini via Langchain."""
    
    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash", 
            google_api_key=settings.gemini_api_key,
            temperature=0
        )
        self.structured_llm = self.llm.with_structured_output(ShoppingIntent)
        
    def extract_intent(self, text: str) -> ShoppingIntent:
        system_prompt = (
            "You are an expert AI shopping assistant for consumer electronics.\n"
            "Analyze the user query and accurately extract:\n"
            "- category: one of 'laptops', 'accessories', 'audio' (or null if generic)\n"
            "- max_price: numeric upper price bound (e.g. 80000)\n"
            "- min_price: numeric lower price bound\n"
            "- use_cases: list of intended purposes (e.g. gaming, editing, college, travel)\n"
            "- keywords: up to 5 specific search terms (e.g. 'macbook', 'anc', 'wireless', 'mechanical')"
        )
        messages = [
            ("system", system_prompt),
            ("human", text)
        ]
        
        try:
            return self.structured_llm.invoke(messages)
        except Exception as e:
            logger.warning(f"Gemini API extract_intent fallback: {e}")
            from app.services.llm_provider import MockLLMProvider
            return MockLLMProvider().extract_intent(text)