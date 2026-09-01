# Product Requirements
## Razorpay AI Commerce OS

### 1. Product Vision
Turn every merchant into an AI-native storefront by providing a platform where AI buyers can seamlessly discover products and transact, while merchants receive autonomous AI insights to grow their revenue.

### 2. User Personas
- **Customer**: Wants to find and purchase products easily using natural language without manually filtering through catalogs.
- **Merchant**: Wants to increase revenue, AOV, and conversion rates, while keeping control over AI actions via policies.
- **AI Buyer**: Acts on behalf of the customer's intent to navigate the catalog, negotiate/find offers, and facilitate checkout.

### 3. Core Workflows
- **Customer Shopping Flow**: Natural language query -> Intent extracted -> Semantic Search -> Recommendation with context -> Bounded Upsell/Cross-sell -> Offer applied -> Cart -> Razorpay Order -> Checkout -> Payment verification -> Success.
- **Merchant Growth Flow**: View dashboard -> See AI-assisted revenue -> Ask AI for insights -> AI proposes campaign/upsell -> Merchant approves -> AI executes -> Action audited.

### 4. MVP Definition
**Must Haves:**
- Light-theme customer UI and merchant dashboard.
- AI chat interface with structured intent extraction.
- Semantic product search (pgvector).
- Contextual recommendations, upsells, cross-sells.
- Cart with server-side total calculation.
- Razorpay Test Mode integration (Order, Checkout, Webhook, Retry on failure).
- Merchant dashboard with core analytics.
- Policy Engine to block invalid AI discounts.
- Agent Audit Log for explainability.

**Out of Scope for MVP:**
- Voice shopping.
- Multi-merchant discovery.
- Advanced ML ranking models (heuristics are fine for MVP).
- Dark mode UI.

### 5. Security & Payment Boundaries
- Razorpay API secrets must remain server-side.
- Financial totals must be computed deterministically on the backend.
- Agent actions modifying prices/offers must be validated by the Policy Engine.
- AI prompt injection attempts to bypass merchant rules must be rejected by backend constraints.
- Inventory must be validated before creating a Razorpay order.
