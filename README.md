# AI Feedback Analyzer Backend

Backend-only Next.js API for the User Feedback & Issue Management dashboard.

## API

The issue-list module is read-only and reads persisted feedback submissions plus their separately stored analysis results.

- `GET /api/issues` lists issues. Supports `category`, `subcategory`, `sentiment`, `severity`, `status`, `from`, `to`, `search`, `sort` (`newest`, `oldest`, `severity`), `page`, and `pageSize` query parameters.
- `GET /api/issues/:id` returns issue details, including original feedback, AI summary, confidence, references, timestamp, and metadata.
- `GET /api/feedback` and `GET /api/feedback/:id` remain deprecated read-only aliases.
- `POST /api/v1/feedback` accepts third-party feedback with an API key and returns `202 Accepted` with `feedback_id`, `status`, and `created_at`.

The ingestion endpoint requires `x-api-key` (or `Authorization: Bearer`) and supports `Idempotency-Key` and `X-Request-ID`. Set `FEEDBACK_API_KEYS` to a comma-separated list of keys. The original message is persisted unchanged; analysis is stored separately and queued without delaying the acknowledgement.

The asynchronous analysis worker sends feedback to Gemini using the Google Gen AI SDK. Configure `GEMINI_API_KEY` with a key from Google AI Studio and set `GEMINI_MODEL` to a model enabled for your account. The prompt, structured JSON response schema, and validation live in `src/services/gemini-analysis.service.ts`. The in-process rate limiter is suitable for a single instance only; use a shared Redis/token-bucket implementation before horizontal scaling.

No frontend UI is implemented in this module. After updating the Prisma schema, apply the local database changes with `npx prisma db push` before using the persisted issue endpoints.
