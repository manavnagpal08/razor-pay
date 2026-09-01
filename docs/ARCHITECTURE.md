# Architecture Document
## Razorpay AI Commerce OS

### 1. High-Level Architecture
```text
                         RAZORPAY AI COMMERCE OS
                                  |
              +-------------------+-------------------+
              |                                       |
          CUSTOMER SIDE                          MERCHANT SIDE
              |                                       |
           AI BUYER                              AI GROWTH ENGINE
              |                                       |
      +-------+--------+                    +---------+---------+
      |       |        |                    |         |         |
   Search  Recommend  Compare             Offer    Upsell   Campaign
      |       |        |                    |         |         |
      +-------+--------+                    +---------+---------+
              |                                       |
              +-------------------+-------------------+
                                  |
                           AI ORCHESTRATOR
                                  |
                           POLICY ENGINE
                                  |
                         APPROVAL / GATING
                                  |
                          CART / ORDER SERVICE
                                  |
                         RAZORPAY TEST MODE
                                  |
                              WEBHOOKS
                                  |
                           EVENT PROCESSOR
                                  |
                    +-------------+-------------+
                    |                           |
               ANALYTICS                   AUDIT LEDGER
                    |                           |
                    +-------------+-------------+
                                  |
                           MERCHANT INSIGHTS
```

### 2. Tech Stack
- **Frontend**: Next.js, React, TypeScript, Tailwind CSS, shadcn/ui, Recharts
- **Backend**: Python, FastAPI, Pydantic
- **Database**: PostgreSQL with pgvector (for semantic search)
- **AI/Agents**: LangGraph, Tool-calling LLM, Structured Outputs, Embeddings
- **Authentication**: Supabase Auth
- **Payments**: Razorpay Test Mode (Orders API, Checkout, Webhooks)

### 3. Payment Architecture Boundaries
- The LLM **never** determines the final payable amount.
- The Backend is the ultimate financial authority.
- **Flow**:
  1. Frontend sends cart to Backend.
  2. Backend validates items, inventory, and eligible offers.
  3. Backend calculates Subtotal, applies discounts, calculates Final Total.
  4. Backend creates Razorpay Order.
  5. Frontend launches Razorpay Checkout.
  6. Backend verifies payment via Webhook or direct verification.

### 4. AI Boundaries and Policy Engine
- **Policy Engine**: A deterministic middleware that intercepts all agent actions that affect pricing, inventory, or campaigns.
- Example: AI requests a 25% discount -> Policy Engine checks merchant rules (max 15%) -> Action Blocked.
- **Audit Ledger**: All agent actions (inputs, decisions, policy results) are logged to the `agent_actions` table for merchant review.
