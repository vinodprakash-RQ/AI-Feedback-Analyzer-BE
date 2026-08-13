# AI Feedback Analyzer Backend

Backend-only Next.js API for the User Feedback & Issue Management dashboard.

## API

The issue-list module is read-only and uses typed mock data so the frontend can integrate before a REST data source is connected.

- `GET /api/issues` lists issues. Supports `category`, `subcategory`, `sentiment`, `severity`, `status`, `from`, `to`, `search`, `sort` (`newest`, `oldest`, `severity`), `page`, and `pageSize` query parameters.
- `GET /api/issues/:id` returns issue details, including original feedback, AI summary, confidence, references, timestamp, and metadata.
- `GET /api/feedback` and `GET /api/feedback/:id` remain deprecated read-only aliases.

No feedback ingestion, authentication, or frontend UI is implemented in this module. Replace `src/services/issue.mock.ts` and `src/services/issue.service.ts` with a REST client or persistence adapter when the API is available.
