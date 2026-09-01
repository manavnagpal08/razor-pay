# AI Buyer Architecture

## Overview
Phase 04 introduces the AI Buyer foundation. The goal is to provide a seamless natural-language interface for the customer while maintaining strict security boundaries around catalog retrieval and commerce data.

## Intent Extraction Flow
```
Natural language input -> LLM Provider -> Structured Pydantic Intent -> Catalog Search -> Validated Results
```

1. **Natural Language**: The user types queries like "gaming laptop under 80000".
2. **Intent Parsing**: The `IntentService` delegates parsing to an `LLMProvider` which extracts parameters matching the `ShoppingIntent` schema.
3. **Structured Intent**: Output is strictly parsed into exact data structures (e.g., `category="laptop"`, `max_price=80000.0`, `use_cases=["gaming"]`).
4. **Validation**: The backend verifies constraints (e.g., negative prices are stripped out).
5. **Search Integration**: The search endpoint maps the structured intent directly into SQLAlchemy filters against the Phase 03 product catalog.

## Provider Abstraction
The system utilizes an `LLMProvider` abstract base class to separate intent extraction logic from the underlying model. 

### Development / Mock Provider
When an API key is not available, a `MockLLMProvider` handles requests deterministically. This allows developers to test the full UI, state handling, and backend routing without hitting external services or incurring costs.
- **REAL AI**: Provider-dependent (Phase 05 onwards).
- **DEVELOPMENT**: Mock provider available and active.

## Security Boundaries
**The AI acts as an intelligence layer only.**
- It does **not** generate SQL.
- It does **not** talk directly to the database.
- It cannot manipulate prices, totals, or merchant policies.
- It cannot create orders or payments.

All search and transactional queries execute deterministically in the backend based on the extracted `ShoppingIntent` structure.
