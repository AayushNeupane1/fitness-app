# Key Decisions

This file is a running log of the decisions that shape the project, so the "why" behind
the architecture and roadmap doesn't get lost. Phase-by-phase execution detail lives in
`roadmap.md`; system design lives in `architecture.md`. This file just records what was
decided and why, in order.

## Decision: multi-tenant-ready data model (superseded on product scope, see below)

Original framing: sell to 50+ independent gym owners from day one, each isolated
(own trainers, members, attendance, dues). This drove the tenant model in
`data-model.md` (`gymId` on every table) and the isolation requirements in `security.md`
— both of which still stand. **What changed**: the product itself now targets one real
gym first (see "build for one real gym" decision below); the tenant-ready schema was kept
because it costs nothing now and avoids a rewrite later.

## Decision: three gym-facing roles; platform role deferred

Gym owner, trainer, and member, as originally scoped. A platform admin role was
considered for cross-tenant management, but since v1 targets a single gym, it's deferred
to Phase 4 (multi-gym expansion) rather than built now with nothing to administer.

## Decision: simplify the stack to React + Express + Node + PostgreSQL

The previous architecture doc specified Next.js, NestJS, and Redis/BullMQ, but none of
that was actually built — the running code was a plain Node `http` server with in-memory
data. Rather than build out the aspirational stack, the stack was brought down to match
what's actually needed at this stage and what was explicitly requested: React, Express,
Node, PostgreSQL. Redis/BullMQ can be added later if `node-cron` background jobs stop
being sufficient.

## Decision: one modular monolith, not separate auth/api/worker services

Three separate Node processes (`apps/api`, `services/auth`, `services/worker`) added
deployment and operational overhead without a benefit at 50-gym scale. Auth stays a
distinct, swappable module inside one Express app rather than a separate network service.
Can be split out later if traffic or team size justifies it.

## Decision: "Kalakriti" auth/gateway — not used for now

No existing "Kalakriti" auth or API gateway project was found anywhere in this repo or
its history, and there was no strong preference to track it down. Auth is being built
fresh (argon2id + JWT + rotated refresh tokens, see `security.md`), but kept behind a
clean internal interface so it can be swapped for an existing system later if one turns
up and is worth reusing.

## Decision: build for one real gym (Zeon Fitness) before multi-gym

Reversed the "50+ gyms from day one" framing. Validated against 3 real gyms in the
founder's community, the actual problems are: weak retention/communication, trainers not
always present to guide members, and owners losing track of who's overdue on dues. All
three map to features already planned (automation, guided plans, dues tracking) — so v1
targets Zeon Fitness specifically (Nepal, light green/black brand), with plan booking
(1/3/6/12 month) added. The schema stays `gymId`-scoped throughout so the 2 other
community gyms can be onboarded later without a rewrite; only the multi-gym *UI/ops*
tooling (onboarding flow, platform-admin console) is deferred to Phase 4. Confirmed
2026-08-12.

## Decision: manual dues tracking for v1, no payment gateway yet

Members pay cash/bank transfer in person; the owner marks dues paid in the app. eSewa/
Khalti (the standard Nepal payment gateways) are real candidates but deferred to Phase 3
so v1 isn't blocked on payment gateway integration and merchant account setup.

## Decision: plans are guidance-rich, not just a title

The "trainer isn't always present" problem means a member needs to be able to follow
their workout/diet day correctly without someone standing next to them. Each exercise/
meal entry carries form notes, sets/reps/rest, and optional image/video — not just a name.

## Open questions (not yet decided)

- Real NPR pricing for the 1/3/6/12 month plans (placeholders in the docs for now)
- Email only for automated notifications in Phase 2, or plan for SMS from the start?
  (WhatsApp/SMS may matter more than email for a Nepal-based gym's members — worth
  revisiting before Phase 2 starts)
