# Architectural & Design Decisions

### 1. Monolith over Microservices
Given this is a hackathon project, we are opting for a modular monolith using FastAPI rather than a complex microservices architecture. This reduces deployment overhead while maintaining clean boundaries between domains (Cart, Payment, AI, Merchant).

### 2. Server-Side Financial Authority
To guarantee safety, the AI/LLM is strictly stripped of any financial authority. All discounts proposed by the LLM are validated by a deterministic Policy Engine. All cart totals are calculated on the backend before calling the Razorpay API. 

### 3. PostgreSQL + pgvector for Semantic Search
To fulfill the "AI-readable catalog" requirement, we will use pgvector within PostgreSQL. This provides both traditional relational capabilities (hard filters on price/inventory) and semantic similarity search (matching user use-cases to product embeddings) in a single database.

### 4. LangGraph for Agent Orchestration
We will use LangGraph to implement a Supervisor-worker pattern for our AI agents. This provides better control, predictability, and state management compared to a single monolithic LLM prompt attempting to do everything.

### 5. Razorpay Test Mode Exclusive
The MVP will exclusively use Razorpay Test Mode. We will mock webhooks and use the official Razorpay test credentials to demonstrate payment flows, including graceful failure scenarios.

### 6. Light Theme Only
As per the strict UI guidelines, the application will use a premium, fintech-inspired light theme. Dark mode is explicitly excluded from the MVP scope.
