# Judge Q&A Guide

### Why isn't the AI allowed to control the payment?
Because financial authority must remain deterministic. AI can understand intent and propose actions, but the Backend, Policy Engine, and Payment Provider remain authoritative. This prevents an LLM from becoming the source of truth for money and guarantees immunity to prompt-injection discounting.

### Why agents?
Traditional rule-based systems struggle with natural language shopping intent ("I want a fast laptop for editing videos"). Agents can extract intent, dynamically search catalogs, evaluate tradeoffs, and explain their reasoning in ways static filters cannot.

### Why LangGraph?
LangGraph allows us to build stateful, cyclical agent architectures. Unlike a simple LLM chain, LangGraph can route a customer intent through a supervisor, run specific analytical tools, parse the result, validate against a policy guardrail, and only then return a final result.

### Why deterministic policies?
Large Language Models are probabilistic. They hallucinate and are susceptible to adversarial prompts. Deterministic policies (like a hard `15%` max discount cap in a SQL database) ensure business rules are mathematically guaranteed regardless of what the LLM outputs.

### How do you prevent AI hallucinating prices?
The AI never passes a price to the checkout system. The frontend merely sends a `product_id` and `quantity`. The backend `CartService` independently fetches the live price directly from the database to recalculate the total.

### How is payment secured?
The backend natively converts the final validated Decimal amount into an integer (`amount * 100`) and requests a Razorpay Order ID. The frontend processes the transaction using this Order ID. Finally, the backend verifies the Razorpay HMAC-SHA256 signature using the `RAZORPAY_KEY_SECRET` before marking the order as `PAID`.

### How does AI interact with Razorpay?
It doesn't. The AI operates strictly upstream in the recommendation and cart-building phase. Razorpay interactions are abstracted deeply within the deterministic `OrderService`.

### How are discounts controlled?
Through the `OfferEngine` and `PolicyEngine`. AI can generate an `ApplyOfferRequest`, but the backend validates the offer's `minimum_cart_value`, expiration dates, and the Merchant Policy caps before applying it mathematically to the cart.

### How is merchant data protected?
Merchant Analytics are encapsulated in backend API routes protected by a `get_current_merchant` dependency. The Merchant Copilot is bound to specific structured tools (e.g. `get_dashboard_metrics(merchant_id)`).

### How is AI attribution calculated?
In this MVP, AI-assisted conversions are attributed by correlating recent `AgentAction` records involving recommendations (`UPSELL_RECOMMENDATION`, `CROSS_SELL_RECOMMENDATION`) with items that ultimately transition to a `PAID` Order status for the same customer session.

### What is mocked?
- LLM Provider (due to local API key limitations, using a deterministic `MockLLMProvider` / `MockMerchantLLM`).
- Razorpay Live Sandbox (using a MOCK provider fallback when keys are absent).
- Authentication (Headers mock `customer_id` and `merchant_id`).

### What would production require?
- Live OpenAI/Anthropic keys for true dynamic agent conversations.
- Supabase/Auth0 JWT integrations replacing the mock identity headers.
- Ngrok/Webhook integrations replacing the synchronous signature verification closure in the UI.
- PostgreSQL live clusters deployed over AWS/Vercel replacing local SQLite/Mocked SQL constraints.
