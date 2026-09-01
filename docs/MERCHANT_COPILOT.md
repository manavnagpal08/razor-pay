# Merchant Copilot

## Overview
Phase 09 elevates the merchant dashboard into a conversational AI Operating System. The Copilot empowers merchants to ask natural-language queries about their store's performance, inventory, and AI-driven activities.

## Architecture
- **Supervisor**: Implemented via `LangGraph` in `MerchantCopilotSupervisor`.
- **Tools**: Deterministic analytics functions exposed as tools (e.g., `get_store_kpis`, `get_top_products`).
- **Grounding**: The LLM is strictly restricted from fabricating metrics. If a metric cannot be queried through a structured tool, the AI falls back gracefully.
- **Traceability**: Every interaction with the Copilot is logged securely as an `AgentAction` with `action_type = "MERCHANT_COPILOT_QUERY"`.

## Security Boundaries
1. **No Raw SQL**: The AI operates exclusively through Pydantic-validated tool abstractions connected to `AnalyticsService`. It cannot arbitrarily query `Orders` or customer PII.
2. **Safe Action Proposals**: The AI can analyze data and suggest a strategy (e.g., "Consider promoting Gaming Laptops"), but it lacks the backend authority to independently execute price modifications or campaign launches. Policy bounds remain absolute.
