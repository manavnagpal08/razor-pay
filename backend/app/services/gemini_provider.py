from app.services.llm_provider import LLMProvider
from app.schemas import ShoppingIntent
from langchain_google_genai import ChatGoogleGenerativeAI
from app.main import settings

class GeminiLLMProvider(LLMProvider):
    """Real implementation for extracting intent using Gemini via Langchain."""
    
    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-1.5-flash", 
            google_api_key=settings.gemini_api_key,
            temperature=0
        )
        self.structured_llm = self.llm.with_structured_output(ShoppingIntent)
        
    def extract_intent(self, text: str) -> ShoppingIntent:
        system_prompt = (
            "You are an AI assistant that extracts shopping intent from natural language queries.\n"
            "Extract the product category (laptops, accessories, audio), maximum price (if mentioned), and intended use cases (gaming, travel, college, etc).\n"
            "Also extract up to 5 relevant keywords for a keyword search fallback."
        )
        messages = [
            ("system", system_prompt),
            ("human", text)
        ]
        
        try:
            return self.structured_llm.invoke(messages)
        except Exception as e:
            # Fallback to empty intent in case of safety/api errors
            import logging
            logging.error(f"Gemini API error during extract_intent: {e}")
            return ShoppingIntent()
