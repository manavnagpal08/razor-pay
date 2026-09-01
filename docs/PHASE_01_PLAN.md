# Phase 01 Implementation Plan: Real Authentication

## 1. Identity Model Overview
- `users` table: Base entity with `email`, `password_hash`, `role`.
- `customers` table: Derived entity tied to `users.id`. Owns `carts`, `orders`.
- `merchants` table: Base entity owning `products`, `offers`, `campaigns`, `merchant_policies`. (Note: In future updates, we might need a `merchant_users` join table, but for MVP, we can add `password_hash` to `merchants` or let `users.role = "merchant"` map to `merchants` table). Let's use `users.role = "merchant"`.

## 2. Current Boundaries
- `backend/app/api/dependencies.py` extracts identity from `x-customer-id` and `x-merchant-id` HTTP headers directly.
- **Vulnerability**: Any client can forge these headers and act as any tenant.

## 3. Implementation Steps
1. **Model Updates**: Add `password_hash` to `User`.
2. **Core Auth Logic (`app/core/security.py`)**: Implement `create_access_token`, `verify_password`, `get_password_hash` using `PyJWT` and `passlib`.
3. **Auth Router (`app/api/auth.py`)**: Create `/login` and `/register` endpoints.
4. **Dependencies (`app/api/dependencies.py`)**: 
   - Replace mock headers with `OAuth2PasswordBearer`.
   - Validate JWT signature, expiry, and extract `sub` (User ID).
   - `get_current_customer`: Require role="customer", return customer record.
   - `get_current_merchant`: Require role="merchant", return merchant record.
5. **Protect Endpoints**: 
   - Ensure all `api/cart`, `api/orders` use `Depends(get_current_customer)`.
   - Ensure all `api/merchant` use `Depends(get_current_merchant)`.
6. **Cross-Tenant Authorization in Services**: 
   - Ensure `CartService.get_or_create_cart(customer_id)` creates scopes strictly to `customer_id`.
   - Ensure `AnalyticsService` strictly filters by `merchant_id`.
7. **Testing**: 
   - Create `backend/tests/test_auth.py` verifying JWT generation, role isolation, and failure on missing tokens.
8. **Regression**: Rerun full suite.
