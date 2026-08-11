# Security Plan

Security-focused is a stated requirement, not an afterthought — this is customer data
(Zeon Fitness's revenue and its members' personal/health info). The schema is kept
tenant-scoped (`gymId` on every table) in anticipation of more gyms joining later, so the
isolation discipline below is built in from v1 even though only one gym exists today —
a single tenant-isolation bug would become a cross-gym breach the moment gym #2 onboards.

## Authentication

- Passwords hashed with **argon2id** (not the current plaintext in `services/auth`).
- Access token: JWT, 15-minute expiry, signed with a secret from environment/secret
  manager (never committed — `.env` is already gitignored, keep it that way).
- Refresh token: random opaque value, stored **hashed** (`RefreshToken.tokenHash`),
  rotated on every refresh, revoked on logout and on password change.
- Login endpoint rate-limited (e.g. 5 attempts per email per 15 minutes) to blunt
  credential stuffing.
- No password reset via unauthenticated email-only flow without a signed, expiring token.

## Authorization / tenant isolation

- Every authenticated request resolves `{ userId, role, gymId }` from the verified JWT —
  never from the request body, query string, or a route param supplied by the client.
- Tenant-scoped Prisma queries go through shared helpers that always inject `gymId` into
  the `WHERE` clause, so a route handler cannot forget it.
- Automated tests specifically try cross-tenant access (gym A's trainer token requesting
  gym B's member) and assert 403/404, not just happy-path tests.
- Platform admin routes are a separate route namespace with their own role check, so a
  bug in tenant-scoped routes can't accidentally grant cross-tenant reads.

## Input handling

- All request bodies validated with a schema library (zod) before touching business logic.
- All database access through Prisma (parameterized) — no raw string-concatenated SQL.
- File/image uploads (if added later for progress photos etc.) restricted by type/size and
  scanned or stored in isolated object storage, never served directly from the API host.

## Transport and headers

- HTTPS only in any non-local environment.
- `helmet` for standard security headers (HSTS, no-sniff, frame-ancestors).
- CORS locked to the actual frontend origin(s), not `*`.
- Cookies (if used for refresh token) set `httpOnly`, `secure`, `sameSite=strict`.

## Auditability

- `AuditLog` entry written for every owner/trainer action that changes member data
  (member added/removed, plan changed, dues marked paid, trainer reassigned).
- Structured request logs (method, path, userId, gymId, status, latency) without logging
  secrets or full request bodies.

## Secrets and configuration

- All secrets from environment variables; `.env.example` lists names only, never values.
- Separate secrets per environment (local/staging/production) — never share a JWT secret
  across environments.
- Fail fast at startup if a required env var is missing, rather than degrading silently.

## Ongoing

- Dependency updates checked periodically (`npm audit` / Dependabot) given this is a
  public-facing app handling payment-adjacent data.
- Before each phase ships, run the `security-review` check against the diff.
