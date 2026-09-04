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
        
        # Determine category (using word boundary regex to prevent collisions like 'phone' in 'headphone')
        if re.search(r'\b(headphone|audio|earbud|earphone|airpod|speaker|soundbar|mic|microphone|headset)s?\b', text_lower):
            intent.category = "audio"
        elif re.search(r'\b(laptop|macbook|notebook|thinkpad|ultrabook|pc|computer|chromebook)s?\b', text_lower):
            intent.category = "laptops"
        elif re.search(r'\b(phone|smartphone|smart\s+phone|mobile|iphone|android|galaxy|pixel|oneplus|cellular|handset)s?\b', text_lower):
            intent.category = "smartphones"
        elif re.search(r'\b(watch|smartwatch|smart\s+watch|band|wearable|tracker|fitbit)s?\b', text_lower):
            intent.category = "wearables"
        elif re.search(r'\b(mouse|keyboard|hub|cable|charger|stand|dock|accessories|accessory)s?\b', text_lower):
            intent.category = "accessories"
        elif re.search(r'\b(display|monitor|screen|tv)s?\b', text_lower):
            intent.category = "displays"
        elif re.search(r'\b(tablet|ipad|tab)s?\b', text_lower):
            intent.category = "tablets"
        elif re.search(r'\b(camera|lens|gopro|dslr)s?\b', text_lower):
            intent.category = "cameras"
        elif re.search(r'\b(dress|shirt|clothing|apparel|shoes|fashion|jeans|jacket)s?\b', text_lower):
            intent.category = "apparel"
            
        # Extract price constraints (under / max)
        price_match = re.search(r'(under|below|max|budget)\s*₹?\s*(\d+,?\d*)', text_lower)
        if price_match:
            try:
                price_str = price_match.group(2).replace(",", "")
                intent.max_price = float(price_str)
            except ValueError:
                pass
                
        # Extract use cases
        if any(w in text_lower for w in ["gaming", "game", "gamer", "fps", "rtx"]):
            intent.use_cases.append("gaming")
        if any(w in text_lower for w in ["travel", "portable", "lightweight", "flight"]):
            intent.use_cases.append("travel")
        if any(w in text_lower for w in ["college", "student", "study", "school"]):
            intent.use_cases.append("college")
        if any(w in text_lower for w in ["work", "office", "professional", "editing", "coding", "business"]):
            intent.use_cases.append("professional")
        if any(w in text_lower for w in ["fitness", "workout", "running", "gym"]):
            intent.use_cases.append("fitness")
            
        # Extract keywords as a fallback
        words = [w for w in text_lower.split() if w not in ["i", "need", "a", "an", "for", "with", "under", "below", "show", "me", "find", "some", "the", "want", "looking"]]
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
