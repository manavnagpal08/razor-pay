# Security & Financial Hardening

## Price Tampering Prevention
- Client submits only `product_id` and `quantity`. 
- `CartService` fetches authoritative prices from the database `Product` table.
- Negative or excessive quantities are blocked via Pydantic and schema validations.
- Total values sent from the frontend are entirely ignored.

## Total Tampering Prevention
- Cart Subtotals and Totals are resolved purely server-side.
- Negative totals are mathematically bounded to `0.0`.

## Discount Tampering Prevention
- Offers are strictly validated against `minimum_cart_value`, `start_time`, `end_time`, and `status`.
- The `PolicyEngine` restricts AI-proposed discounts to a hard cap (`max_discount_percent`), blocking prompt-injection attempts to zero out cart totals.

## Payment Tampering Prevention
- The checkout flow is bound to a backend-generated Razorpay Order ID.
- Final completion requires an HMAC-SHA256 signature verification matching the backend's hidden `RAZORPAY_KEY_SECRET`.
- The system prevents failed payments from advancing state.

## Data Isolation
- Merchant Analytics APIs route through `get_current_merchant()` dependency.
- AI Copilot instances operate under tight scope limitations, prevented from initiating unauthenticated SQL commands.
