# Hackathon Demo Script (5-7 Minutes)

## 0:00–0:45 | PROBLEM
- "Traditional e-commerce requires customers to search, compare, and decide manually using complex filters."
- "We built an AI-native commerce experience running on Razorpay AI Commerce OS."

## 0:45–2:00 | CUSTOMER EXPERIENCE
- **Action**: Open the storefront. Navigate to the AI Chat.
- **Customer Input**: "I need a gaming laptop under ₹80,000."
- **AI Output**: Identifies the intent, queries the catalog, and presents the best match.
- **Narrative**: Point out *why* the AI made the recommendation based on the extracted features.

## 2:00–3:00 | AGENTIC COMMERCE
- **Action**: AI displays an Upsell option (Gaming Laptop Pro) and Cross-sell (Gaming Mouse).
- **Narrative**: The AI dynamically retrieves these from predefined `ProductRelationship` tables.
- **Action**: Click "Add to Cart" on the laptop. 
- **Action**: Show an AI discount proposal taking place and being routed through the Policy Engine.

## 3:00–4:00 | PAYMENT
- **Action**: Proceed to Checkout.
- **Narrative**: Explain that the AI has no control over the final amount. The server recalculates it, converts it strictly to Indian Paise, and locks it.
- **Action**: Click "Pay with Razorpay". Complete the mocked Sandbox transaction.
- **Action**: Show Payment Success screen resulting from backend signature verification.

## 4:00–5:15 | MERCHANT DASHBOARD
- **Action**: Open `/merchant`.
- **Narrative**: Show the dashboard updating in real-time. Highlight the Revenue, AOV, and Paid Orders KPIs.
- **Action**: Scroll down to the **AI Commerce Activity** ledger.
- **Narrative**: Explain the Traceability. Show the exact record where the AI proposed a discount and the Policy Engine validated (or blocked) it.

## 5:15–6:15 | MERCHANT COPILOT
- **Action**: Open the Merchant Copilot panel.
- **Input**: "How much did we sell?"
- **AI Output**: Responds precisely grounded in `AnalyticsService` data.
- **Input**: "Which product should I promote?"
- **AI Output**: AI identifies the top products.
- **Input**: "Why was the discount blocked?"
- **AI Output**: AI reads the `AgentAction` log and explains the 15% `MerchantPolicy` ceiling.

## 6:15–7:00 | ARCHITECTURE / SECURITY
- **Conclusion**: "AI proposes. Policy decides. Backend calculates. Razorpay verifies. Merchant controls the business."
