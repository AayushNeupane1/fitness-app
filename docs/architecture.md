# Architecture

## Scope for v1

Built for one real gym, **Zeon Fitness** (Nepal, light green/black brand), not an
abstract multi-tenant product. The schema stays tenant-ready (`gymId` on every table)
because two more gyms in the founder's community are likely candidates once Zeon Fitness
is proven out — but there's no multi-gym onboarding UI, gym-switcher, or platform-admin
console until that's real. See `roadmap.md` Phase 4.

## Why this changed from the original doc

The previous version of this file specified Next.js, NestJS, and Redis/BullMQ — none of
which were actually built (the running code was a plain Node `http` server with in-memory
arrays, and the "frontend" was static HTML/JS, not Next.js). That mismatch between docs
and reality is a big part of what made the project feel like a mess. This version matches
what actually gets built: React, Express, Node, PostgreSQL, kept as a single deployable
service until real traffic proves a split is needed.

## Chosen stack

- **Frontend**: React (Vite), Tailwind for a bold, fast UI. Role-aware routing (owner /
  trainer / member each get a different app shell after login).
- **Backend**: One Express + Node API. Internally modular (`auth`, `gyms`, `members`,
  `attendance`, `plans`, `dues`, `offers`, `notifications`), not split into separate
  network services yet.
- **Database**: PostgreSQL, accessed through Prisma (already partially modeled in
  `packages/db/prisma/schema.prisma` — needs a `Gym` tenant root added).
- **Background jobs**: `node-cron` for scheduled checks (missed attendance, expiring
  memberships, birthdays) in Phase 1–2. Move to a real queue (BullMQ + Redis) only if job
  volume or reliability needs outgrow a cron loop — not before.
- **Email**: a transactional provider (Resend or SendGrid) called from the background job
  layer. SMS/WhatsApp can be added the same way later.

## Why one service instead of separate auth/api/worker services

The current repo has `apps/api`, `services/auth`, and `services/worker` as three separate
Node processes talking over HTTP, plus dead NestJS/Next.js stubs that were never wired up.
For 50 gyms, that split adds deployment and debugging overhead (three processes, three
sets of env vars, network calls for things that could be function calls) without a
corresponding benefit. A modular monolith gets you the same internal separation of
concerns with one process to deploy, log, and reason about. Auth logic still lives in its
own module with a clean interface, so it can be extracted into a real separate service
later (or replaced by an existing auth system, e.g. if a "Kalakriti" auth + gateway setup
turns out to be worth reusing) without touching business logic.

## Multi-tenancy

- `Gym` is the tenant root. Every `User`, `Member`, `Attendance`, `Plan`, `Offer`, and
  `Payment` row carries a `gymId`.
- A user's `gymId` and `role` are embedded in their JWT at login and re-verified against
  the database on each request — never taken from a request body or query param.
- Every Prisma query in a tenant-scoped route is wrapped so `gymId` is always part of the
  `WHERE` clause. This is enforced through shared query helpers, not left to each route
  handler to remember.
- Platform admin routes are deferred to Phase 4 (multi-gym expansion) — not built in v1,
  but the route prefix (`/api/platform/*`) is reserved so adding them later doesn't
  collide with existing routes.

## Authentication

- Password auth with argon2id hashing.
- Short-lived JWT access token (15 min) for API calls.
- Refresh token: random opaque value, hashed before storage (schema already has
  `RefreshToken.tokenHash`), rotated on every use, revocable (logout invalidates it).
- Auth logic (issuing, verifying, rotating tokens) lives in one module (`src/auth`) behind
  a small interface — swappable later without touching the rest of the API.

## Authorization model

- `platform_admin`: cross-tenant, gym lifecycle management only — **deferred to Phase 4**,
  not implemented in v1 since there's only one gym.
- `gym_owner`: full access within their own gym (member/trainer management, attendance,
  dues, offers, dashboards).
- `trainer`: read access to their assigned members, write access to those members' plans.
- `member`: read-only access to their own plans, attendance, and membership status.
- Every route declares its allowed roles; a shared middleware checks role AND tenant
  membership before the handler runs.

## API shape (indicative, finalized during build)

- `POST /api/auth/login`, `/refresh`, `/logout`
- `POST /api/gyms` (platform admin — create tenant)
- `GET/POST/PATCH /api/members`, `/api/trainers`
- `POST /api/attendance`, `GET /api/attendance/:memberId`
- `GET/POST/PATCH /api/plans/workout`, `/api/plans/diet`
- `GET/POST /api/dues`, `/api/offers`
- `GET /api/dashboard` (owner-only aggregates)

## What happens to the existing repo structure

- Delete the empty NestJS stub (`apps/api/src/app.module.ts`, `main.ts`) and unused
  Next.js stub (`apps/web/app/*.tsx`) — dead code that doesn't match what runs.
- Fold `services/auth` and `services/worker` into modules inside the single Express app
  (`apps/api`).
- Keep `packages/db` (Prisma) and `packages/shared` (token helpers) — extend rather than
  replace.
- Replace the in-memory `state` object in `apps/api/server.js` with real Prisma queries.
