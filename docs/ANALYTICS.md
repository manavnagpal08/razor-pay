# Commerce Analytics Definitions

## Defensible Calculation Rules

To ensure exact accuracy, all KPIs are calculated via `AnalyticsService` executing direct aggregation queries on the relational models.

### Revenue
`SUM(amount) from orders WHERE status = 'PAID'`
*Definition*: The cumulative collected income from completed transactions. Excludes carts, payment intents, and failed payments.

### Paid Orders
`COUNT(id) from orders WHERE status = 'PAID'`
*Definition*: The total volume of completed transactions.

### Average Order Value (AOV)
`Revenue / Paid Orders`
*Definition*: The average cart size converted.

### AI Recommendations
`COUNT(id) from agent_actions WHERE action_type IN ('RECOMMENDATION', 'UPSELL_RECOMMENDATION', 'CROSS_SELL_RECOMMENDATION')`
*Definition*: The raw volume of autonomous commerce suggestions made by the agent.

### Policy Blocks
`COUNT(id) from agent_actions WHERE action_type = 'AI_DISCOUNT_PROPOSAL' AND policy_result->>'allowed' = 'false'`
*Definition*: The number of times the AI was prevented from executing an action that violated a configured Merchant Policy (e.g., maximum discount ceiling). Demonstrates safe AI bounding.
