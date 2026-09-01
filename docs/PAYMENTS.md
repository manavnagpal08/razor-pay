# Payments & Order Architecture

## Overview
Phase 07 implements Razorpay Test Mode, maintaining a strict financial boundary where the backend creates and validates orders.

## Razorpay Integration
- `RazorpayService` acts as an abstraction over the Razorpay Python SDK.
- It dynamically switches to a deterministic **Mock Provider** if `RAZORPAY_KEY_ID` defaults to `"test"` or is absent, allowing development environments to test the full loop without network dependencies.
- Real credentials must be injected via `.env` (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`).

## Server-Authoritative Math
1. **Creation**: `POST /api/orders` loads the `cart_id`, executes a revalidation check, calculates the Decimal amount natively, formats it to Indian Paise (`amount * 100`), and pushes it to Razorpay. The client never provides the checkout value.
2. **Verification**: `POST /api/orders/verify` evaluates the HMAC-SHA256 signature returned by Razorpay Checkout. 

## Idempotency
If the backend verifies a payment and the `Order` transitions to `PAID`, subsequent webhook or client calls for the same payload will safely return success without duplicating DB insertions or mutating the transaction ledger.

## State Machines
- **Order**: `CREATED` -> `PAYMENT_PENDING` -> `PAID` or `FAILED`.
- **Payment**: `PENDING` -> `CAPTURED` or `FAILED`.

## Security Boundaries
- The `RAZORPAY_KEY_SECRET` never leaves the `RazorpayService` constructor. It is isolated completely from the frontend `CheckoutPage`.
- AI intent extraction cannot interact with Razorpay APIs. It can only load product suggestions to the Cart.
