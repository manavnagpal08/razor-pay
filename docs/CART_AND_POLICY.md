# Cart & Policy Engine

## Overview
Phase 06 establishes the absolute financial authority in the commerce layer. The LLM acts as an advisor, while the backend dictates price, total, discount applicability, and inventory enforcement.

## Architecture
- **Cart API**: `POST /api/cart`, `POST /api/cart/{id}/items`
- **Pricing Authority**: All subtotals are recalculated instantly from the database. Client-submitted prices are ignored. If an item changes price while in the cart, the cart is re-calculated and the `CartValidationSchema` returns an explanatory issue string.
- **Offer Engine**: Server-side logic to apply standard percentage or fixed discounts, calculating mathematical limits natively (e.g. `maximum_discount`).
- **Policy Engine**: Final gatekeeper against LLM hallucination.

## Financial Boundaries & AI Integration
The AI cannot directly execute a transaction or finalize a cart price.
`AI Proposal -> Policy Engine -> [ALLOW/BLOCK] -> Backend Execution`

Example Guardrail implemented:
- AI predicts giving a `25%` discount will close the sale.
- Backend Policy Engine is hard-limited to `15%`.
- Result: **BLOCKED**. The backend emits a strict JSON constraint failure preventing execution.

## Events & AgentActions
- AI discount requests are logged securely in `AgentAction`.
- The decision to `ALLOW` or `BLOCK` is cataloged with a clear rationale.
