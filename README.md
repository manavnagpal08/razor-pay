# BuyFlow - Razorpay AI Commerce OS

BuyFlow is an AI Growth and Agentic Commerce platform built for Razorpay Buildathon Track 01.

It helps a merchant become sellable to both human shoppers and AI buyers by combining conversational product discovery, agent-readable commerce APIs, deterministic payment safety, merchant-scoped catalogs, campaign intelligence, and Razorpay Test Mode checkout.

## Problem Statement Alignment

Track: AI Growth & Agentic Commerce

Goal: grow merchant revenue and make merchants transactable by AI buyers end to end.

BuyFlow addresses the track through:

- Conversational in-app checkout for shoppers.
- Agent-readable catalog and transaction manifest.
- AI buyer transaction endpoint with idempotency.
- Merchant-scoped catalog, cart, order, payment, event, and audit records.
- Upsell and cross-sell recommendations.
- Policy-gated discounts and campaign proposals.
- Razorpay Test Mode order creation, payment verification, and webhook reconciliation.
- Explainable agent action ledger for money-impacting decisions.

Current alignment score: 9.45/10.

## Live Demo

- Frontend: https://razorpay-buildthon.vercel.app
- Backend: https://razorpay-commerce-backend.onrender.com
- AI provider status: https://razorpay-commerce-backend.onrender.com/api/ai/provider/status

Note: the Vercel project may have deployment protection enabled depending on account settings.

## Core Features

### Shopper AI Concierge

- Understands natural-language shopping intent using Gemini when configured.
- Falls back safely to deterministic intent extraction in development.
- Searches only the selected merchant catalog.
- Answers product detail/spec questions from catalog data.
- Remembers shown products within the chat thread for follow-up questions like "this laptop."
- Shows alternatives separately when the requested item is not in stock.
- Does not auto-activate coupons on unrelated replies.

### Agentic Commerce APIs

- Machine-readable manifest at `/api/agent/manifest`.
- Autonomous AI buyer transaction endpoint at `/api/agent/transact`.
- Merchant-scoped product availability and policy validation.
- Quantity and discount bounds.
- Idempotency key support to prevent duplicate AI-buyer orders.
- Agent actions logged for auditability.

### Revenue Growth Agents

- Recommendation engine ranks products by category, keywords, budget, and use case.
- Upsell engine uses explicit product relationships or merchant-local fallback upgrades.
- Cross-sell engine recommends complementary merchant catalog items.
- Offer agent validates discounts against merchant policy before exposing them.
- Campaign opportunity engine reacts to carts, slow-moving products, and low inventory.

### Razorpay Payment Safety

- Razorpay Test Mode order creation.
- Server-side cart total recalculation.
- Inventory reservation during checkout.
- Payment signature verification.
- Webhook signature verification and replay protection.
- Duplicate payment protection.
- Cart/order/payment reconciliation after verified payment.

### Merchant Console

- Merchant onboarding and store setup.
- Product creation with inferred product specs and use cases.
- Merchant-scoped analytics.
- Policy configuration.
- Campaign proposal, approval, rejection, and opportunity discovery.
- AI activity and system audit logs.

## Architecture

```text
Frontend (Next.js)
  |
  | REST API
  v
Backend (FastAPI)
  |
  +-- AI Commerce Supervisor (LangGraph)
  |     +-- Intent Service
  |     +-- Search Agent
  |     +-- Recommendation Agent
  |     +-- Offer Agent
  |
  +-- Policy Engine
  +-- Order Service
  +-- Razorpay Service
  +-- Analytics and Campaign Intelligence
  |
  v
PostgreSQL / Supabase + pgvector
```

## Tech Stack

- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS, Lucide icons
- Backend: FastAPI, SQLAlchemy, Pydantic, Alembic
- AI: Gemini through LangChain, LangGraph orchestration
- Database: PostgreSQL/Supabase, pgvector
- Payments: Razorpay Test Mode
- Auth: JWT, Firebase Admin support
- Deployment: Vercel frontend, Render backend
- CI: GitHub Actions for backend tests and frontend build/lint

## Key API Routes

### AI and Chat

- `POST /api/ai/intent`
- `POST /api/ai/chat/search`
- `GET /api/ai/provider/status`

### Products

- `GET /api/products/`
- `GET /api/products/{product_id}`
- `POST /api/products/search`
- `GET /api/products/merchant/{merchant_id}`
- `POST /api/products/`
- `DELETE /api/products/{product_id}`

### Cart and Checkout

- `POST /cart/`
- `GET /cart/{cart_id}`
- `POST /cart/items`
- `POST /cart/{cart_id}/items`
- `PATCH /cart/{cart_id}/items/{item_id}`
- `POST /api/orders/create`
- `POST /api/orders/verify`
- `POST /api/orders/webhook`

### Merchant

- `GET /api/merchant/dashboard`
- `GET /api/merchant/orders`
- `GET /api/merchant/products`
- `GET /api/merchant/ai-activity`
- `GET /api/merchant/logs`
- `GET /api/merchant/campaigns`
- `GET /api/merchant/campaigns/opportunities`
- `POST /api/merchant/campaigns/propose`
- `POST /api/merchant/campaigns/{campaign_id}/approve`
- `POST /api/merchant/campaigns/{campaign_id}/reject`

### Agent-to-Agent Commerce

- `GET /api/agent/manifest?merchant_id={merchant_id}`
- `POST /api/agent/transact`

## Local Setup

### 1. Clone

```bash
git clone https://github.com/manavnagpal08/razor-pay.git
cd razor-pay
```

### 2. Backend Environment

Create `backend/.env` or root `.env` using `.env.example`.

Required production variables:

```env
ENVIRONMENT=production
DATABASE_URL=postgresql://...
JWT_SECRET=replace_with_at_least_32_random_characters
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
GEMINI_API_KEY=...
AGENT_API_KEYS=comma_separated_agent_keys
CORS_ORIGINS=https://razorpay-buildthon.vercel.app
REQUIRE_LIVE_AI=true
```

Development can use safe local defaults.

### 3. Backend Install and Run

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

Backend runs on http://localhost:8000.

### 4. Frontend Install and Run

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on http://localhost:3000.

### 5. Frontend Environment

Create `frontend/.env.local`:

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

## Testing

Backend:

```bash
cd backend
$env:GEMINI_API_KEY=""
pytest -q
python -m compileall -q app
```

Frontend:

```bash
cd frontend
npm run build
npx eslint src/app/chat/page.tsx --quiet
```

Current verification status:

- Backend tests: 42 passing.
- Backend compile: passing.
- Frontend production build: passing.
- Live Render backend: Gemini provider verified.
- Live Vercel frontend: production deployment ready.

## Demo Flow for Judges

1. Open the live frontend.
2. Create or select a merchant store.
3. Add products to the merchant catalog.
4. Ask the AI concierge for recommendations.
5. Ask a follow-up like "what specs are there in this laptop."
6. Ask for active discounts or best deals.
7. Click `Apply Code` only when an offer is relevant.
8. Click `Buy Now`.
9. Complete checkout with Razorpay Test Mode.
10. Open merchant dashboard to inspect revenue, AI activity, policy logs, and campaign opportunities.

## Safety and Production Readiness

BuyFlow treats payment and discount actions as bounded operations:

- The AI never directly controls trusted payment amounts.
- Discounts are validated through the policy engine.
- Checkout totals are recalculated server-side.
- Inventory is reserved during order creation.
- Webhooks are signature-verified and replay-protected.
- Every major agent/payment decision is written to the `agent_actions` ledger.
- Multi-tenant catalog and commerce actions are merchant-scoped.

## Project Structure

```text
backend/
  app/
    api/                 FastAPI routers
    services/            AI, policy, order, analytics, enrichment services
    models.py            SQLAlchemy models
    schemas.py           Pydantic schemas
  alembic/               Database migrations
  tests/                 Backend regression tests

frontend/
  src/app/               Next.js app routes
  src/components/        UI components
  src/context/           Auth context
  src/utils/             API helpers
```

## Repository

GitHub: https://github.com/manavnagpal08/razor-pay
