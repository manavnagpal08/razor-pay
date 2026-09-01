# AI Boundaries

## What AI CAN Do
- **Understand Intent**: Process natural language to extract required specifications and use cases.
- **Search Products**: Map intent to specific products in the database using semantic / keyword matches.
- **Rank Recommendations**: Evaluate catalog options and present the `BEST_MATCH` and alternatives.
- **Explain Recommendations**: Generate human-readable reasons explaining *why* a product matches the intent.
- **Suggest Upsells**: Identify premium alternatives utilizing the `ProductRelationship` table.
- **Suggest Cross-sells**: Identify complementary products utilizing the `ProductRelationship` table.
- **Propose Discounts**: Generate a proposed discount percentage dynamically based on predicted customer conversion.
- **Analyze Merchant Data**: Access backend analytics interfaces to read store performance metrics.
- **Recommend Merchant Actions**: Highlight strategic opportunities (e.g., "Consider promoting Gaming Laptops").

## What AI CANNOT Do
- **Set Authoritative Prices**: The AI output for price is completely ignored by the transactional layer. Cart models pull live pricing strictly from `Product.price`.
- **Calculate Final Payment Amount**: Cart totals, subtractive discounts, and taxes are determined via deterministic math on the backend Server `CartService`.
- **Mark Orders Paid**: AI cannot transition `Order` status or authorize Razorpay completions.
- **Execute Arbitrary SQL**: The AI is walled off from generic SQL execution. It uses `get_dashboard_metrics()` and similar defined tool boundaries.
- **Bypass Policy**: AI discount proposals are intercepted by the `PolicyEngine`. If an AI suggests a 25% discount but the `MerchantPolicy` dictates 15%, the system enforces a `BLOCK`.
- **Modify Financial Records Directly**: AI lacks the endpoints and authorization scopes to rewrite ledger records.
- **Access Unauthorized Merchant Data**: Copilot tools strictly enforce `merchant_id` scopes to prevent cross-merchant leakage (Authentication layers are mocked for the MVP but conceptually integrated).
