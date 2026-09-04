# 🚀 BuyFlow — Razorpay AI Commerce OS

<div align="center">

[![Razorpay Buildathon](https://img.shields.io/badge/Razorpay-Buildathon_Track_01-blue?style=for-the-badge&logo=razorpay)](https://razorpay.com)
[![Status](https://img.shields.io/badge/Status-Production_Ready-emerald?style=for-the-badge)](https://razorpay-buildthon.vercel.app)
[![User Guide](https://img.shields.io/badge/Docs-Complete_User_Guide-violet?style=for-the-badge)](./docs/USER_GUIDE.md)
[![License](https://img.shields.io/badge/License-MIT-amber?style=for-the-badge)](./LICENSE)

**The Autonomous AI Commerce Operating System for Human Shoppers & AI Buyers**

[📖 **Read User Guide**](./docs/USER_GUIDE.md) • [📄 **Download PDF Guide (6 Pages)**](./docs/BuyFlow_AI_Commerce_User_Guide.pdf) • [🌐 **Live Storefront**](https://razorpay-buildthon.vercel.app) • [⚙️ **Merchant OS**](https://razorpay-buildthon.vercel.app/merchant) • [⚡ **Backend API**](https://razorpay-commerce-backend.onrender.com)

</div>

---

BuyFlow is a complete, enterprise-grade AI Growth and Agentic Commerce operating system built for **Razorpay Buildathon — Track 01: AI Growth & Agentic Commerce**.

It empowers merchants to become effortlessly sellable to both human shoppers and autonomous AI buyers by unifying conversational discovery, machine-readable commerce manifests (`/api/agent/manifest`), programmatic transaction APIs (`/api/agent/transact`), deterministic policy guardrails, and in-app Razorpay Test Mode checkout.

---

## 📚 Essential Documentation

- 📘 [**Complete User Guide & Handbook**](./docs/USER_GUIDE.md) — Comprehensive guide covering shopper conversational flow, in-chat OTP login, store management, policy guardrails, live BlueDart tracking, and FAQ.
- 📄 [**Download 6-Page PDF User Guide**](./docs/BuyFlow_AI_Commerce_User_Guide.pdf) — Formatted, publication-ready PDF handbook for shoppers and merchants.
- 🛡️ [**Financial Safety & Policy Boundaries**](./docs/AI_BOUNDARIES.md) — Zero-trust policy execution specifications.
- 🤖 [**AI Multi-Agent System Overview**](./AGENTS.md) — LangGraph Supervisor and sub-agent architecture.

---

## 🎯 Problem Statement Alignment (Track 01)

The core principle is:

> **AI proposes. Policy validates. Backend calculates. Razorpay confirms.**

This ensures that AI can drive discovery, recommendations, growth, and commerce without becoming the authority over money.

---

# 1. Problem

Traditional e-commerce is designed around:

```text
Human
  ↓
Website
  ↓
Search
  ↓
Compare
  ↓
Cart
  ↓
Checkout
```

AI is becoming a new interface through which customers discover and purchase products.

However, merchants need infrastructure that allows AI buyers to interact with their commerce systems safely.

Key problems include:

- Product catalogs are not consistently AI-readable.
- AI agents need structured access to product information.
- AI recommendations can become disconnected from inventory.
- LLMs cannot safely control financial values.
- Discounts require merchant-defined boundaries.
- AI-driven transactions require idempotency.
- Merchants need visibility into AI-driven commerce activity.
- AI systems need controlled access to merchant data.

---

# 2. Solution

BuyFlow creates an AI-native commerce layer between merchants, customers, AI agents, and payment infrastructure.

```text
Customer
   ↓
AI Shopping Concierge
   ↓
Intent Understanding
   ↓
Merchant Catalog
   ↓
Recommendation
   ↓
Upsell / Cross-sell
   ↓
Cart
   ↓
Offer
   ↓
Policy Engine
   ↓
Order
   ↓
Razorpay
   ↓
Payment Verification
   ↓
Order Completion
```

For merchants:

```text
Merchant
   ↓
Merchant Console
   ├── Dashboard
   ├── Products
   ├── Orders
   ├── Policies
   ├── Campaigns
   ├── AI Activity
   └── Merchant Copilot
```

---

# 3. Core Product

BuyFlow has two connected sides.

## Customer Side

An AI-powered shopping experience that allows customers to describe what they want naturally.

Example:

> "I need a gaming laptop under ₹80,000 for competitive gaming."

BuyFlow can:

- Understand the intent.
- Search the merchant catalog.
- Rank relevant products.
- Explain recommendations.
- Show alternatives.
- Suggest upgrades.
- Suggest complementary products.
- Add products to the cart.
- Validate offers.
- Complete checkout.

---

## Merchant Side

A merchant control center that provides:

- Revenue analytics.
- Order analytics.
- Product performance.
- AI commerce activity.
- Policy visibility.
- Campaign opportunities.
- Merchant Copilot.
- AI action auditing.

---

# 4. Key Features

## AI Shopping Concierge

The shopper can communicate naturally.

Examples:

```text
"I need a gaming laptop under ₹80,000."

"Which one is better for gaming?"

"Show me something cheaper."

"What accessories do I need?"

"Tell me about this laptop."
```

The conversation maintains product context so references such as:

> "this laptop"

can resolve to products previously shown in the conversation.

### Capabilities

- Natural-language intent understanding.
- Product search.
- Product specification questions.
- Budget-aware recommendations.
- Alternatives.
- Upsells.
- Cross-sells.
- Cart actions.
- Context-aware follow-up questions.

---

# 5. Agentic Commerce

BuyFlow exposes machine-readable commerce infrastructure for AI buyers.

## Agent Manifest

```http
GET /api/agent/manifest
```

The manifest describes the merchant's available commerce capabilities.

## Agent Transaction

```http
POST /api/agent/transact
```

The transaction endpoint enables an external AI buyer to perform a controlled purchase.

The transaction layer supports:

- Merchant scoping.
- Product availability.
- Quantity validation.
- Discount validation.
- Server-side pricing.
- Idempotency.
- Agent action logging.

The AI buyer cannot directly control the final financial amount.

---

# 6. Revenue Growth Agents

BuyFlow contains multiple growth-oriented AI/business intelligence components.

## Recommendation Engine

Products are ranked using deterministic catalog information such as:

- Category.
- Keywords.
- Budget.
- Features.
- Use cases.
- Inventory.

---

## Upsell Engine

Upsells use explicit merchant-defined product relationships.

Example:

```text
Gaming Laptop
      ↓
Higher-spec Gaming Laptop
```

The system does not blindly recommend a more expensive product.

---

## Cross-sell Engine

Cross-sells use complementary product relationships.

Example:

```text
Gaming Laptop
      ↓
Gaming Mouse
Gaming Headphones
```

---

## Offer Engine

Offers are validated against merchant rules before they are applied.

AI can propose an offer.

The backend determines whether that offer is valid.

---

## Campaign Intelligence

The platform can identify opportunities based on signals including:

- Cart activity.
- Product performance.
- Slow-moving inventory.
- Inventory conditions.
- Customer behavior.

Campaign proposals remain under merchant control.

---

# 7. Merchant Dashboard

The merchant console provides a unified view of store performance.

## KPIs

- Revenue.
- Paid orders.
- Average Order Value.
- Product performance.
- AI recommendations.
- Upsells.
- Cross-sells.
- Policy blocks.
- Recent orders.

---

# 8. Merchant Copilot

The Merchant Copilot allows merchants to ask questions using natural language.

Examples:

```text
"How much revenue did we make?"

"Which products are performing best?"

"Which product should I promote?"

"Why was a discount blocked?"
```

The Copilot does not generate arbitrary SQL.

Instead:

```text
Merchant Question
       ↓
Merchant Copilot
       ↓
Controlled Analytics Tool
       ↓
AnalyticsService
       ↓
Database
       ↓
Structured Result
       ↓
AI Response
```

Every Copilot interaction is traceable through the AI activity ledger.

---

# 9. AI Architecture

BuyFlow uses LangGraph for controlled agent orchestration.

```text
AI Commerce Supervisor
        │
        ├── Intent Service
        │
        ├── Search Agent
        │
        ├── Recommendation Agent
        │
        ├── Offer Agent
        │
        ├── Upsell Engine
        │
        └── Cross-sell Engine
```

The architecture deliberately separates AI reasoning from business authority.

---

# 10. AI Boundaries

## AI CAN

- Understand customer intent.
- Search products.
- Rank recommendations.
- Explain recommendations.
- Suggest upsells.
- Suggest cross-sells.
- Propose discounts.
- Analyze merchant data.
- Suggest merchant actions.

## AI CANNOT

- Set authoritative product prices.
- Set cart totals.
- Set order amounts.
- Set payment amounts.
- Mark payments as paid.
- Execute arbitrary SQL.
- Bypass merchant policies.
- Modify financial records directly.
- Access another merchant's data.
- Access unauthorized customer information.

---

# 11. Financial Safety

Financial authority always remains outside the LLM.

```text
AI
 ↓
PROPOSAL
 ↓
Policy Engine
 ↓
Backend Validation
 ↓
Database
 ↓
Razorpay
```

## Product Price

The server retrieves the canonical product price from PostgreSQL.

## Cart Total

The backend calculates the cart total.

```text
Product Prices
      ↓
Subtotal
      ↓
Validated Discount
      ↓
Final Cart Total
```

## Order Amount

The order amount is derived from the validated cart.

## Payment Amount

The payment amount is derived from the server-created order.

The frontend cannot override these values.

---

# 12. Razorpay Payment Flow

BuyFlow integrates Razorpay Test Mode.

```text
Customer
   ↓
Cart
   ↓
Server Revalidation
   ↓
Order Creation
   ↓
Razorpay Order
   ↓
Checkout
   ↓
Payment
   ↓
Signature Verification
   ↓
Webhook Verification
   ↓
Reconciliation
   ↓
Order State
```

Payment security includes:

- Server-side amount calculation.
- Razorpay order validation.
- Signature verification.
- Webhook signature verification.
- Replay protection.
- Duplicate payment protection.
- Idempotency.
- Payment/order reconciliation.

Razorpay secret credentials remain backend-only.

---

# 13. Multi-Tenant Architecture

BuyFlow is designed around merchant isolation.

Merchant-owned commerce records are scoped using `merchant_id`.

Examples include:

- Cart.
- Order.
- Payment.
- CustomerEvent.
- AgentAction.
- Product.
- Offer.
- Campaign.
- MerchantPolicy.

The expected request flow is:

```text
Authenticated User
        ↓
Role
        ↓
Merchant Context
        ↓
Authorization
        ↓
Tenant-Scoped Service
        ↓
Tenant-Scoped Database Query
        ↓
Response
```

Tenant identity must never be trusted solely from frontend input.

---

# 14. Event and Audit Architecture

BuyFlow maintains an AI and commerce activity trail.

Important actions include:

```text
RECOMMENDATION
UPSELL_RECOMMENDATION
CROSS_SELL_RECOMMENDATION
AI_DISCOUNT_PROPOSAL
MERCHANT_COPILOT_QUERY
ORDER_CREATED
ORDER_PAID
```

These events allow merchants and developers to understand what the AI system did and why.

---

# 15. System Architecture

```text
                         BUYFLOW
                            │
              ┌─────────────┴─────────────┐
              │                           │
          CUSTOMER                     MERCHANT
              │                           │
              ▼                           ▼
        Next.js App                 Merchant Console
              │                           │
              └─────────────┬─────────────┘
                            │
                         REST API
                            │
                            ▼
                     FastAPI Backend
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
          ▼                 ▼                 ▼
       AI Layer       Policy Engine     Order Service
          │                 │                 │
          │                 │                 ▼
          │                 │             Razorpay
          │                 │
          └─────────────────┼─────────────────┐
                            ▼                 │
                     PostgreSQL              │
                       + pgvector             │
                            │                 │
                            ▼                 │
                     Analytics / Events ◄────┘
```

---

# 16. Technology Stack

## Frontend

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Lucide icons
- shadcn/ui components where appropriate

## Backend

- Python
- FastAPI
- SQLAlchemy
- Pydantic
- Alembic

## AI

- LangGraph
- LangChain
- Gemini
- Deterministic development fallback where explicitly enabled

## Database

- PostgreSQL
- pgvector
- SQLAlchemy ORM

## Payments

- Razorpay Test Mode
- Razorpay Checkout
- Razorpay Webhooks

## Authentication

- JWT
- Firebase Admin support

## Deployment

- Vercel
- Render
- PostgreSQL/Supabase-compatible infrastructure

## CI

- GitHub Actions
- Backend tests
- Frontend build
- Lint/type checks

---

# 17. Repository Structure

```text
razor-pay/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── agents/
│   │   ├── core/
│   │   ├── services/
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── database.py
│   │   └── main.py
│   │
│   ├── alembic/
│   │   └── versions/
│   │
│   ├── scripts/
│   │   └── seed.py
│   │
│   ├── tests/
│   │
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── context/
│   │   ├── lib/
│   │   └── utils/
│   │
│   └── package.json
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── DATABASE.md
│   ├── ANALYTICS.md
│   ├── AI_BOUNDARIES.md
│   ├── SECURITY.md
│   ├── DEMO_SCRIPT.md
│   ├── JUDGE_QA.md
│   ├── TEST_MATRIX.md
│   ├── PRODUCTION_READINESS.md
│   ├── PRODUCTION_GAP_ANALYSIS.md
│   └── PRODUCTION_DEVELOPMENT_PLAN.md
│
├── .github/
│   └── workflows/
│
├── docker-compose.yml
├── .env.example
├── AGENTS.md
└── README.md
```

---

# 18. API Reference

## AI

```http
POST /api/ai/intent
POST /api/ai/chat/search
GET  /api/ai/provider/status
```

## Products

```http
GET    /api/products/
GET    /api/products/{product_id}
POST   /api/products/search
GET    /api/products/merchant/{merchant_id}
POST   /api/products/
DELETE /api/products/{product_id}
```

## Cart

```http
POST   /cart/
GET    /cart/{cart_id}
POST   /cart/items
POST   /cart/{cart_id}/items
PATCH  /cart/{cart_id}/items/{item_id}
DELETE /cart/{cart_id}/items/{item_id}
```

## Orders

```http
POST /api/orders/create
POST /api/orders/verify
POST /api/orders/webhook
```

## Merchant

```http
GET /api/merchant/dashboard
GET /api/merchant/orders
GET /api/merchant/products
GET /api/merchant/ai-activity
GET /api/merchant/logs
GET /api/merchant/campaigns
GET /api/merchant/campaigns/opportunities

POST /api/merchant/campaigns/propose
POST /api/merchant/campaigns/{campaign_id}/approve
POST /api/merchant/campaigns/{campaign_id}/reject
```

## Agent-to-Agent Commerce

```http
GET  /api/agent/manifest
POST /api/agent/transact
```

---

# 19. Database

Core entities include:

```text
Users
Customers
Merchants
Products
ProductRelationships
Carts
CartItems
Orders
Payments
Offers
Campaigns
CustomerEvents
AgentActions
MerchantPolicies
```

Financial values use precise numeric/decimal representations.

Example:

```text
Numeric(10,2)
```

rather than floating-point values for monetary calculations.

---

# 20. Database Migrations

Run:

```bash
cd backend
alembic upgrade head
```

Check current migration:

```bash
alembic current
```

View migration history:

```bash
alembic history
```

Database schema changes must be performed through migrations.

---

# 21. Local Setup

## Clone

```bash
git clone https://github.com/manavnagpal08/razor-pay.git
cd razor-pay
```

---

## Backend

```bash
cd backend

python -m venv .venv
```

Windows:

```bash
.\.venv\Scripts\activate
```

macOS/Linux:

```bash
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

---

# 22. Backend Environment

Create:

```text
backend/.env
```

Example:

```env
ENVIRONMENT=development

DATABASE_URL=postgresql://...

JWT_SECRET=replace_with_secure_random_value

RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...

GEMINI_API_KEY=...

AGENT_API_KEYS=...

CORS_ORIGINS=http://localhost:3000

REQUIRE_LIVE_AI=false
```

Never commit real secrets.

---

# 23. Frontend Environment

Create:

```text
frontend/.env.local
```

Example:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000

NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_...

NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

Never expose backend secrets through `NEXT_PUBLIC_*`.

---

# 24. Start PostgreSQL

If using Docker Compose:

```bash
docker compose up -d
```

Then:

```bash
cd backend
alembic upgrade head
```

---

# 25. Seed Demo Data

```bash
cd backend
python scripts/seed.py
```

The demo catalog should include products such as:

```text
Gaming Laptop
Gaming Laptop Upgrade
Gaming Mouse
Gaming Headphones
```

with product relationships such as:

```text
UPSELL
CROSS_SELL
RELATED
```

---

# 26. Start Backend

```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend:

```text
http://localhost:8000
```

API documentation:

```text
http://localhost:8000/docs
```

---

# 27. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend:

```text
http://localhost:3000
```

---

# 28. Testing

## Backend

```bash
cd backend
pytest -q
```

Compile check:

```bash
python -m compileall -q app
```

## Frontend

```bash
cd frontend
npm run build
```

Lint:

```bash
npm run lint
```

---

# 29. Security Testing

The application should be tested against:

### Authentication

- Invalid credentials.
- Missing credentials.
- Expired tokens.
- Invalid tokens.

### Authorization

- Customer isolation.
- Merchant isolation.
- Cross-tenant access.
- IDOR attacks.

### Financial manipulation

- Fake product prices.
- Fake cart totals.
- Fake discounts.
- Fake order amounts.
- Fake payment amounts.

### AI security

- Prompt injection.
- Unauthorized tool calls.
- Arbitrary SQL attempts.
- Cross-merchant data requests.
- Financial manipulation attempts.

### Payment

- Invalid signatures.
- Duplicate payments.
- Replay attacks.
- Invalid order IDs.
- Incorrect amounts.
- Duplicate webhooks.

---

# 30. End-to-End Customer Flow

The primary customer journey is:

```text
Customer Intent
      ↓
Intent Understanding
      ↓
Product Search
      ↓
Recommendation
      ↓
Why This Product?
      ↓
Upsell
      ↓
Cross-sell
      ↓
Add to Cart
      ↓
Server Price Validation
      ↓
Offer
      ↓
Policy Validation
      ↓
Order
      ↓
Razorpay
      ↓
Payment Verification
      ↓
Success
```

Example:

```text
"I need a gaming laptop under ₹80,000."
```

The system should return a relevant best match and explain why it was selected.

---

# 31. Merchant Flow

```text
Merchant
   ↓
Dashboard
   ↓
Revenue
   ↓
Orders
   ↓
Product Performance
   ↓
AI Activity
   ↓
Policy Activity
   ↓
Merchant Copilot
```

Example Copilot questions:

```text
"How much revenue did we make?"

"Which product should I promote?"

"Why was the discount blocked?"
```

---

# 32. Example Policy Demo

A core demonstration scenario is:

```text
Merchant Policy
Maximum Discount = 15%

AI Proposal
Discount = 25%

Policy Engine
       ↓
BLOCKED
```

The AI can propose a discount.

The AI cannot override the merchant policy.

The merchant can see the decision in the AI activity ledger.

---

# 33. Demo Mode

BuyFlow supports explicit demo/development behavior when external infrastructure is unavailable.

Possible demo components include:

```text
AI Provider
DEMO/FALLBACK

Payment Provider
TEST/MOCK

Database
LOCAL/DEVELOPMENT
```

Demo behavior must always be explicit.

The system must never silently treat a mock provider as a production provider.

---

# 34. Production Requirements

A real production deployment requires:

```text
Real Authentication
        +
Real Authorization
        +
Production PostgreSQL
        +
Real LLM Provider
        +
Real Embedding Provider
        +
Real pgvector Search
        +
Razorpay Integration
        +
Webhook Reconciliation
        +
Refund Handling
        +
Rate Limiting
        +
Observability
        +
Secret Management
        +
Backups
        +
CI/CD
        +
Disaster Recovery
```

---

# 35. Current Production Status

The application should distinguish between:

### Implemented

Application logic exists.

### Verified

The functionality has actually been tested.

### Live Verified

The functionality has been tested against the real external infrastructure.

### Demo / Mock

The functionality uses a development/demo provider.

Do not represent mock infrastructure as live production infrastructure.

Refer to:

```text
docs/PRODUCTION_READINESS.md
```

for the detailed production status.

---

# 36. Live Deployment

## Frontend

```text
https://razorpay-buildthon.vercel.app
```

## Backend

```text
https://razorpay-commerce-backend.onrender.com
```

Deployment protection or authentication may be enabled depending on the hosting configuration.

---

# 37. Demo Walkthrough

## Step 1 — Customer

Ask:

```text
I need a gaming laptop under ₹80,000.
```

---

## Step 2 — Recommendation

Show:

- Best match.
- Price.
- Features.
- Explanation.

---

## Step 3 — Upsell

Show the appropriate higher-tier product.

---

## Step 4 — Cross-sell

Show complementary products:

```text
Gaming Mouse
Gaming Headphones
```

---

## Step 5 — Cart

Add the selected product.

Demonstrate server-authoritative pricing.

---

## Step 6 — Policy

Demonstrate:

```text
Maximum Discount: 15%
AI Proposal: 25%
Result: BLOCKED
```

---

## Step 7 — Payment

Proceed through Razorpay Test Mode.

Demonstrate that the payment amount comes from the server-created order.

---

## Step 8 — Merchant Dashboard

Open:

```text
/merchant
```

Show:

- Revenue.
- Orders.
- AOV.
- AI activity.
- Policy blocks.
- Product performance.

---

## Step 9 — Merchant Copilot

Ask:

```text
How much revenue did we make?
```

Then:

```text
Which product should I promote?
```

Then:

```text
Why was the discount blocked?
```

---

# 38. Razorpay Buildathon Track Alignment

## Track

**AI Growth & Agentic Commerce**

## AI Growth

BuyFlow provides:

- Recommendations.
- Upsells.
- Cross-sells.
- Campaign intelligence.
- Merchant Copilot.
- AI commerce analytics.

## Agentic Commerce

BuyFlow provides:

- Machine-readable commerce manifest.
- Agent transaction API.
- Merchant-scoped catalogs.
- Controlled transaction execution.
- Idempotency.
- Agent action auditing.

## Financial Safety

BuyFlow provides:

- Server-authoritative pricing.
- Policy-controlled discounts.
- Razorpay payment verification.
- Webhook reconciliation.
- Payment/order consistency.

## Merchant Enablement

BuyFlow provides:

- Merchant dashboard.
- Product management.
- Analytics.
- Campaign opportunities.
- Merchant Copilot.

---

# 39. Documentation

Detailed technical documentation is available under:

```text
docs/
```

Important documents:

```text
ARCHITECTURE.md
DATABASE.md
ANALYTICS.md
AI_BOUNDARIES.md
SECURITY.md
DEMO_SCRIPT.md
JUDGE_QA.md
TEST_MATRIX.md
PRODUCTION_READINESS.md
PRODUCTION_GAP_ANALYSIS.md
PRODUCTION_DEVELOPMENT_PLAN.md
```

---

# 40. Final Architecture Principle

BuyFlow is built around one fundamental separation:

```text
                    AI
                     │
                     │ proposes
                     ▼
                Policy Engine
                     │
                     │ validates
                     ▼
                Backend
                     │
                     │ calculates
                     ▼
                 Database
                     │
                     │ transaction
                     ▼
                 Razorpay
                     │
                     │ confirms
                     ▼
                  Payment
```

The AI is responsible for **understanding and proposing**.

The backend is responsible for **authority and calculation**.

The merchant is responsible for **business policy**.

Razorpay is responsible for **payment processing**.

This separation is the foundation of BuyFlow's approach to safe agentic commerce.

---

# BuyFlow

**AI-native commerce for the next generation of shoppers, AI buyers, and merchants.**
