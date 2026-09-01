# AI Agents Overview
## Razorpay AI Commerce OS

The application utilizes a single Supervisor/Orchestrator and a small set of specialized core agents built with LangGraph.

### 1. Supervisor (Orchestrator)
- **Role**: Understands the user's high-level goal and routes requests to the appropriate specialized agent.
- **Rules**: Maintains workflow state, routes actions through the Policy Engine, and never directly manipulates payment amounts.

### 2. Search Agent
- **Role**: Interprets product requirements and searches the catalog.
- **Tools**: Hard filters (price, category) and semantic search (pgvector).
- **Output**: Returns a structured list of relevant products based on extracted intent.

### 3. Recommendation & Upsell Agent
- **Role**: Ranks matching products, explains recommendations, and identifies useful upgrades or complementary products.
- **Rules**: Must explain why an upsell is recommended (e.g., "For ₹7k more, you get 32GB RAM"). Allowed to say "No upsell is appropriate."

### 4. Offer Agent
- **Role**: Checks if the customer or cart is eligible for discounts based on merchant campaigns.
- **Rules**: Calculates eligible discount proposals. Must send proposals through the Policy Engine to ensure merchant limits are never exceeded.

### 5. Checkout Agent
- **Role**: Validates the cart and coordinates the checkout process.
- **Rules**: Recalculates amounts server-side, interacts with Razorpay Order API, observes payment states, and handles failures gracefully. Confirms orders only after trusted backend verification.

### Agent Action Ledger
All significant agent decisions are recorded in the `agent_actions` table, including:
- Agent name & Action type
- Input & Decision
- Reason & Policy result
- Execution status & Timestamp
This ensures 100% explainability for the merchant.
