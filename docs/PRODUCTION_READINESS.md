# Production Readiness Status

## READY (Production-Grade Architecture)
- **Core architecture**: FastAPI Backend + Next.js Frontend separation.
- **Financial boundaries**: Zero-trust client posture. Server-authoritative calculations.
- **Cart pricing**: Real-time DB lookup and recalculation.
- **Order state machine**: Clean `CREATED` -> `PAYMENT_PENDING` -> `PAID`/`FAILED` transitions.
- **Payment signature verification**: HMAC-SHA256 implemented securely.
- **Policy engine**: Hard deterministic overrides against probabilistic AI outputs.
- **AI traceability**: Granular logging of LLM actions via `AgentAction`.

## NOT READY (Requires Implementation for Live Deployment)
- **Real authentication**: Currently utilizing Mock Headers. Requires JWT integration (e.g. Supabase, Clerk).
- **Multi-merchant authorization**: RBAC scopes needed to fully isolate multi-tenant SaaS environments.
- **Production PostgreSQL validation**: pgvector scaffolding is present but requires a live cloud cluster for execution.
- **Production LLM provider configuration**: OpenAI/Anthropic keys must be mounted and rate-limited.
- **Razorpay webhook reconciliation**: Crucial for dropped frontend connections.
- **Production monitoring**: Sentry / Datadog integration required.
- **Rate limiting**: API Gateway limits to prevent endpoint abuse.
- **Full attribution**: Explicit foreign key mapping between CartItems and AgentActions for 100% conversion attribution certainty.
- **Production deployment**: Requires Dockerization and CI/CD pipelines.
