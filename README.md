# AI Feedback Analyzer Backend

Backend-only Next.js API for the User Feedback & Issue Management dashboard.

## Setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env` and set `DATABASE_URL`.
3. Generate the Prisma client with `npx prisma generate`.
4. Apply the schema in a development database with `npx prisma migrate dev --name init`.

## API

- `GET /api/feedback` lists feedback. Supports `status`, `priority`, `category`, `search`, `page`, and `pageSize` query parameters.
- `POST /api/feedback` creates feedback with `title`, `description`, `priority`, `category`, `source`, `reporterEmail`, `assignee`, and `tags`.
- `GET /api/feedback/:id` returns one feedback item.
- `PATCH /api/feedback/:id` updates feedback fields, including `status`.
- `DELETE /api/feedback/:id` closes a feedback item.
- `GET /api/dashboard/summary` returns totals for all, open, in-progress, resolved, critical, and category counts.

The API is intentionally UI-free so a separate frontend can consume these routes.
