# Production Development Plan

## Phase 00 — Production Audit (Completed)
- **Objective**: Identify all mocks, placeholders, and architectural gaps separating the V0.9 MVP from production readiness.
- **Output**: `docs/PRODUCTION_GAP_ANALYSIS.md`

## Phase 01 — Real Authentication
- **Objective**: Implement robust session and identity management for both Merchants and Customers.
- **Tasks**: Remove mock header dependencies. Integrate secure JWT validation / Supabase Auth. Enforce route protection globally.
- **Risks**: Ensuring smooth frontend transitions from guest sessions to authenticated states.

## Phase 02 — Multi-Tenant Authorization
- **Objective**: Prevent cross-tenant data leakage.
- **Tasks**: Implement strict row-level or query-level enforcement of `merchant_id` across all database models (Orders, Analytics, Policies, Products).
- **Risks**: Analytics endpoints must accurately scope heavy aggregate queries without mixing merchant numbers.

## Phase 03 — Real PostgreSQL Setup
- **Objective**: Verify live operational capabilities of the database.
- **Tasks**: Finalize `docker-compose.yml`, establish connection pooling, configure pgvector, and run end-to-end migrations against a live database instance.

## Phase 04 — Real AI / LLM Provider
- **Objective**: Discard `MockLLMProvider` and introduce real, configurable API integrations.
- **Tasks**: Integrate OpenAI / Anthropic APIs with robust error handling, retries, timeout configurations, and token-cost controls.

## Phase 05 — Real Embeddings + pgvector
- **Objective**: Enable functional semantic search rather than keyword fallback.
- **Tasks**: Develop text-to-vector service, batch generate embeddings for existing seeded products, and test real pgvector similarity matching against product indices.

## Phase 06 — Production Payment System
- **Objective**: Replace mocked frontend completions with Razorpay Test Mode and Webhooks.
- **Tasks**: Eliminate `is_mock` in `RazorpayService`. Configure live test keys. Build and secure `/api/orders/webhook` endpoint with replay protection.

## Phase 07 — Refunds / Cancellations / Payment Recovery
- **Objective**: Enable full commerce lifecycle management.
- **Tasks**: Introduce cancellation limits, partial/full refund transitions, and idempotent refund triggers mapped against backend permissions.

## Phase 08 — Production Cart / Inventory / Offers
- **Objective**: Harden commerce logic against concurrent attacks and abuse.
- **Tasks**: Implement `SELECT FOR UPDATE` inventory reservations, cart expiry sweeps, user-scoped offer limitations, and campaign expiry enforcements.

## Phase 09 — AI Safety Hardening
- **Objective**: Fortify the agentic execution layer.
- **Tasks**: Implement prompt injection safeguards, strict JSON validation for tool outputs, LLM execution time bounds, and explicit whitelisting.

## Phase 10 — Merchant Copilot Productionization
- **Objective**: Elevate Copilot to a contextual, persistent assistant.
- **Tasks**: Tie interactions to specific conversational memory IDs, persist transcripts securely, and ensure analytical tools pull strictly from tenant-authorized layers.

## Phase 11 — Observability
- **Objective**: Make the application debuggable in production.
- **Tasks**: Implement structured JSON logging (`structlog` or similar). Establish distinct /health, /liveness, and /readiness endpoints. 

## Phase 12 — Rate Limiting & Abuse Protection
- **Objective**: Protect database and AI budgets from DDoS and scrape attacks.
- **Tasks**: Introduce IP/Token-based rate limiters (e.g., Redis-based) across `/chat`, `/copilot`, `/checkout`, and Authentication endpoints.

## Phase 13 — Production Infrastructure
- **Objective**: Prepare the runtime environment.
- **Tasks**: Purge hardcoded `localhost` references. Support `APP_ENV` (development/staging/production). Finalize containerization for deployment scaling.

## Phase 14 — CI/CD + Security
- **Objective**: Automate pre-deployment assurances.
- **Tasks**: Build GitHub Actions workflows for linting, PyTest suites, Next.js builds, and vulnerability scanning. 

## Phase 15 — Final Production Certification
- **Objective**: Certify completion of all P0 constraints.
- **Tasks**: Execute rigorous Security, E2E, and Load testing protocols mapping directly to `docs/PRODUCTION_CERTIFICATION.md`.
