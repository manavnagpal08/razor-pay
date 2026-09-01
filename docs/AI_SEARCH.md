# AI Search & Recommendation Architecture

## Overview
Phase 05 expands the AI Buyer to include ranking, recommendations, upsell, and cross-sell capabilities. The system operates autonomously using a localized `AICommerceSupervisor` orchestrated with LangGraph.

## LangGraph Flow
The orchestration handles the AI lifecycle sequentially:
1. `parse_intent`: Natural language translates to structured `ShoppingIntent`.
2. `search`: Retrieves exact matching candidates from the catalog utilizing semantic logic and hard constraints (prices).
3. `recommend`: Evaluates candidates, assigns a score, selects a `BEST_MATCH`, and produces explanatory reasons (e.g., "Fits budget under 80000").
4. `upsell_cross_sell`: Queries the `ProductRelationship` table for the best match to retrieve high-priority UPSELL and CROSS_SELL alternatives.

## Recommendations
The system provides a `score` and `reasons` for every ranked product. Match types are designated as:
- `BEST_MATCH` (Highest score fulfilling constraints)
- `ALTERNATIVE` (Satisfies partial constraints)

## Upsell Engine
Upsell requires explicit relationships mapped in the `ProductRelationship` table or fallback category logic. The engine guarantees the upsell price difference is quantified (e.g. "+₹7000") and a reason is generated.
If no valid upsell exists, it safely returns `null` (No forced upsells).

## Cross-sell Engine
Retrieves companion items (e.g., Gaming Laptop -> Gaming Mouse) based on `CROSS_SELL` or `FREQUENTLY_BOUGHT_TOGETHER` priorities.

## Agent Actions Ledger
All Upsell and Cross-sell decisions invoked by the `RecommendationAgent` are recorded securely to the `AgentAction` table in the database to allow the merchant visibility into AI-driven conversion efforts.

## Guardrails
- **Hard Constraints**: The Search module filters the SQL dataset using standard variables (like `max_price`) before ranking applies semantic weighting.
- **No Hallucinations**: Every Upsell points to a valid `target_product_id` ensuring the AI only recommends existing, in-stock catalog items.
