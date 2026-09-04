from abc import ABC, abstractmethod
from app.schemas import ShoppingIntent
import re

class LLMProvider(ABC):
    """Abstract base class for LLM intent extraction."""
    @abstractmethod
    def extract_intent(self, text: str) -> ShoppingIntent:
        pass

class MockLLMProvider(LLMProvider):
    """Development/mock provider for extracting intent deterministically."""
    
    def extract_intent(self, text: str) -> ShoppingIntent:
        text_lower = text.lower()
        intent = ShoppingIntent()
        
        # Determine category
        if "laptop" in text_lower or "macbook" in text_lower:
            intent.category = "laptops"
        elif "mouse" in text_lower or "keyboard" in text_lower or "hub" in text_lower:
            intent.category = "accessories"
        elif "headphone" in text_lower or "audio" in text_lower or "earbud" in text_lower:
            intent.category = "audio"
            
        # Extract price constraints (under / max)
        price_match = re.search(r'(under|below|max)\s*₹?(\d+,?\d*)', text_lower)
        if price_match:
            try:
                price_str = price_match.group(2).replace(",", "")
                intent.max_price = float(price_str)
            except ValueError:
                pass
                
        # Extract use cases
        if "gaming" in text_lower:
            intent.use_cases.append("gaming")
        if "travel" in text_lower:
            intent.use_cases.append("travel")
        if "college" in text_lower or "student" in text_lower:
            intent.use_cases.append("college")
            
        # Extract keywords as a fallback
        words = [w for w in text_lower.split() if w not in ["i", "need", "a", "for", "with", "under", "show", "me", "find", "some", "the"]]
        intent.keywords = words[:5] # limit keywords
        
        return intent

# Factory method
def get_llm_provider() -> LLMProvider:
    from app.core.config import settings
    if settings.gemini_api_key and settings.gemini_api_key != "":
        try:
            from app.services.gemini_provider import GeminiLLMProvider
            return GeminiLLMProvider()
        except (ImportError, ModuleNotFoundError):
            if settings.environment.lower() in {"production", "prod"} and settings.require_live_ai:
                raise RuntimeError("Live AI provider is required but Gemini dependencies are unavailable.")
            pass
    elif settings.environment.lower() in {"production", "prod"} and settings.require_live_ai:
        raise RuntimeError("Live AI provider is required but GEMINI_API_KEY is not configured.")
    return MockLLMProvider()
