from app.services.llm_provider import LLMProvider
from app.schemas import ShoppingIntent
from langchain_google_genai import ChatGoogleGenerativeAI
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class GeminiLLMProvider(LLMProvider):
    """Real implementation for extracting intent using Gemini via Langchain with multi-model fallback."""
    
    def __init__(self):
        self.models_to_try = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]
        self.provider_name = "gemini"
        self.model_name = None
        self.fallback_reason = None
        
    def extract_intent(self, text: str) -> ShoppingIntent:
        system_prompt = (
            "You are an expert AI shopping concierge for modern commerce.\n"
            "Analyze the shopper query and accurately extract structured shopping intent:\n"
            "- category: e.g. 'smartphones', 'laptops', 'audio', 'accessories', 'wearables', 'displays', 'tablets', 'electronics', 'apparel', or null if generic\n"
            "- max_price: numeric upper price bound (e.g. 80000)\n"
            "- min_price: numeric lower price bound\n"
            "- use_cases: list of intended purposes (e.g. gaming, editing, daily, travel, fitness, office)\n"
            "- keywords: up to 5 specific search terms (e.g. 'iphone', 'macbook', 'anc', 'wireless', 'oled')"
        )
        messages = [
            ("system", system_prompt),
            ("human", text)
        ]
        
        for m in self.models_to_try:
            try:
                llm = ChatGoogleGenerativeAI(
                    model=m,
                    google_api_key=settings.gemini_api_key,
                    temperature=0
                )
                structured_llm = llm.with_structured_output(ShoppingIntent)
                res = structured_llm.invoke(messages)
                if res and isinstance(res, ShoppingIntent):
                    self.model_name = m
                    self.fallback_reason = None
                    return res
            except Exception as e:
                self.fallback_reason = f"{m}: {e.__class__.__name__}"
                logger.warning(f"Gemini API extract_intent with model {m} failed: {e}")
                
        from app.services.llm_provider import MockLLMProvider
        self.provider_name = "mock"
        self.model_name = "deterministic-fallback"
        self.fallback_reason = self.fallback_reason or "Gemini returned no structured intent"
        return MockLLMProvider().extract_intent(text)

    def generate_concierge_summary(self, query: str, products: list[dict], offer: dict | None = None, upsell: dict | None = None) -> str | None:
        """
        Uses Gemini to generate a personalized, conversational shopping concierge explanation.
        """
        if not products:
            return None

        prod_descriptions = []
        for p in products[:3]:
            name = p.get("name") or "Product"
            price = p.get("price") or 0
            cat = p.get("category") or ""
            desc = p.get("description") or ""
            prod_descriptions.append(f"- {name} (₹{price:,.0f}, {cat}): {desc}")

        prompt = (
            "You are BuyFlow's conversational AI shopping concierge assisting a customer.\n"
            f"Customer query: \"{query}\"\n"
            f"Matching products in catalog:\n" + "\n".join(prod_descriptions) + "\n"
        )
        if offer:
            prompt += f"\nActive coupon: {offer.get('code')} ({offer.get('discount_percent')}% off)\n"
        if upsell:
            reasons = upsell.get("reasons") or ["Upgrade available"]
            prompt += f"\nEligible upgrade available: {reasons[0]}\n"

        prompt += (
            "\nWrite a concise, friendly 1-3 sentence response introducing these recommendations to the shopper. "
            "Highlight why they fit the user's needs. If a coupon is available, remind them to apply it. "
            "Do not list all items in raw text since product cards will be rendered underneath. Keep it inviting and natural."
        )

        for m in self.models_to_try:
            try:
                llm = ChatGoogleGenerativeAI(
                    model=m,
                    google_api_key=settings.gemini_api_key,
                    temperature=0.3
                )
                res = llm.invoke([("human", prompt)])
                if res and res.content:
                    return str(res.content).strip()
            except Exception as e:
                logger.warning(f"Gemini summary generation with {m} failed: {e}")
        return None
