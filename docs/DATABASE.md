# Database Architecture

## Overview
Razorpay AI Commerce OS uses PostgreSQL as its primary database, integrated with `pgvector` for semantic search and LangGraph agent capabilities. The database is designed as the single source of truth for all commerce and merchant growth operations.

## Core Entities
- **User / Customer / Merchant**: Defines identity, preferences, and segmentation.
- **Product**: AI-readable product catalog containing exact numeric prices, extensive JSONB features/use-cases, and `Vector(1536)` embeddings.
- **Cart / CartItem**: Represents active shopping intent.
- **Order / Payment**: The transactional layer integrated with Razorpay.
- **Offer / Campaign / MerchantPolicy**: The business logic and control mechanisms allowing the AI to safely act on behalf of the merchant.
- **CustomerEvent / AgentAction**: Auditing and event streaming for both explainability and merchant insights.

## Product Embedding Strategy
The `Product` table includes a `Vector(1536)` column. Embeddings are generated from a canonical representation of the product:
```text
{Name} - {Category}. {Description}. Features: {Features}. Good for: {Use Cases}.
```
This ensures semantic search effectively matches natural language user queries like "gaming laptop for college" against the embedded representation.

## Exact Numeric Types
All financial fields (price, discount, total, budget, max_discount_amount) are stored as exact `Numeric(10, 2)` instead of `Float`. This guarantees precision and is an absolute requirement for safely interacting with the Razorpay API.

## Starting the Database
Since the project relies on PostgreSQL and pgvector, the recommended approach is Docker:
```bash
docker-compose up -d
```

## Migrations
We use Alembic for all schema migrations.
To run migrations:
```bash
cd backend
alembic upgrade head
```

## Seeding
To seed the initial test data (merchants, catalog, embeddings):
```bash
cd backend
python scripts/seed.py
```
