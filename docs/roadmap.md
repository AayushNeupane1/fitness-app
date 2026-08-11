# Roadmap

Building for **Zeon Fitness** first, one gym, real users. Each phase should be fully
working and demoable before the next starts.

## Phase 1: Core MVP for Zeon Fitness

- Real PostgreSQL via Prisma, no in-memory state; single `Gym` row (Zeon Fitness), but
  every table keeps `gymId` so onboarding gym #2/#3 later doesn't require a rewrite
- Auth: argon2id password hashing, JWT access + rotated refresh tokens, RBAC (gym owner /
  trainer / member — platform-admin role deferred until a second gym is real)
- Owner: member CRUD, trainer CRUD + assignment, attendance recording, membership plan
  catalog (1/3/6/12 month, NPR placeholder pricing), manual dues marking (cash/bank)
- Trainer: 7-day workout + 7-day diet plan assignment, each day detailed enough
  (exercise form notes, optional image/video, meal specifics) that a member can follow it
  without the trainer physically present
- Member: browse and book a membership plan, view assigned plans with full guidance
  detail, view attendance history, view membership status and days remaining
- React (Vite) + Tailwind frontend, Zeon Fitness branding (light green / black, bold UI)
- Delete dead NestJS/Next.js stubs; fold `services/auth`/`services/worker` into the
  single Express app

**Done when**: Zeon Fitness's real owner can add trainers and members, a trainer assigns
week-long guided plans, a member books a plan and sees their own data end to end — with
the schema ready for a second gym without touching the data model.

## Phase 2: Retention automation

- Background job runner (`node-cron` to start) for:
  - missed-check-in nudges
  - milestone celebrations (Nth visit, birthday)
  - renewal/dues reminders (30/7/1 day before expiry) — directly fixes "owner doesn't
    know whose membership expired"
  - targeted offers to at-risk/segment-matched members
- Email delivery via a transactional provider (Resend/SendGrid) to start
- `Notification` log so the same message isn't sent twice

**Done when**: the retention automations run on a schedule with no manual trigger, and
the owner has a clear view of who's overdue without checking a notebook.

## Phase 3: Owner dashboards and payments

- Dashboard: attendance trends, revenue, active/expiring/at-risk members
- Evaluate eSewa/Khalti integration for online dues payment (deferred from v1 —
  manual cash/bank marking ships first, gateway added once it's clearly worth the
  integration cost)

## Phase 4: Multi-gym expansion

- Only once Zeon Fitness is stable and at least one more gym from the founder's
  community is ready to onboard
- Add `PLATFORM_ADMIN` role, gym onboarding flow, per-gym branding config
- No schema rework needed — `gymId` has been on every table since Phase 1

## Phase 5: Hardening

- Automated tests, especially cross-tenant isolation tests (matters more once Phase 4
  lands)
- Observability: structured logs, error tracking (Sentry), basic metrics
- Rate limiting broadened beyond auth routes
- Backups and migration discipline for PostgreSQL
- Deployment pipeline and staging environment

## Explicitly out of scope for now

- Native mobile app
- Live class scheduling / booking
- Wearable integrations
- Online payment gateway (until Phase 3 evaluation)
