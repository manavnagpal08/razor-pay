# Razorpay AI Commerce OS

An autonomous, agentic commerce platform built for Razorpay Buildathon — Track 01.

This repository demonstrates a complete End-to-End ecosystem blending a generative AI Customer Buyer with a deterministic Financial Policy Engine and an analytical Merchant Copilot.

## Features
- **AI Buyer**: Understands natural language shopping intent, returning precise semantic matches and cross-sells.
- **Financial Policy Engine**: Guarantees deterministic pricing authority. Blocks hallucinated discount bounds.
- **Razorpay Integration**: Converts exact decimal subtotals into Razorpay Sandbox test payments.
- **Merchant Copilot**: A LangGraph-orchestrated dashboard answering natural language queries grounded entirely in verified operational analytics (No raw SQL).

## Documentation
- [Architecture](docs/ARCHITECTURE.md)
- [Agents Overview](AGENTS.md)
- [Payments & Orders](docs/PAYMENTS.md)
- [Merchant Dashboard](docs/MERCHANT_DASHBOARD.md)
- [Demo Script](docs/DEMO_SCRIPT.md)
- [Judge QA](docs/JUDGE_QA.md)

*Note: For the Hackathon MVP, OpenAI and Razorpay interactions utilize a robust MOCK MODE to ensure local runtime stability without required credentials.*

A policy-controlled multi-agent commerce system that converts natural-language purchase intent into product discovery, personalized recommendations, bounded offers, agentic checkout, Razorpay Test Mode payment, and closed-loop merchant revenue optimization.

## Architecture & Tech Stack
- **Frontend**: Next.js, React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Python, FastAPI, Pydantic
- **Database**: PostgreSQL
- **Payments**: Razorpay Test Mode

## Local Setup

### 1. Environment Variables
Copy `.env.example` to `.env` and fill in the required values (especially the database connection URL and Razorpay test credentials).
```bash
cp .env.example .env
```

### 2. Database Setup (Docker Required)
The project requires PostgreSQL with `pgvector` for semantic search.
```bash
docker-compose up -d
```

Run migrations:
```bash
cd backend
alembic upgrade head
```

Seed the database:
```bash
python scripts/seed.py
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```
The frontend runs at http://localhost:3000.

### 3. Backend
```bash
cd backend
python -m venv .venv
# Activate venv (Windows):
.\.venv\Scripts\activate
# Activate venv (Mac/Linux):
# source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```
The backend API runs at http://localhost:8000.

### 4. Running Tests
**Backend**:
```bash
cd backend
pytest
```
**Frontend**:
```bash
cd frontend
npm run lint
```
