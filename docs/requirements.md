# Requirements

## Product goal

Build the platform for one real gym first — **Zeon Fitness** (Nepal) — instead of an
abstract multi-tenant product. The functionality is the same set already scoped (owner,
trainer, member), plus member-facing plan booking. The data model stays multi-tenant
ready (see `data-model.md`) so the other 2 gyms already in the founder's community can be
onboarded later without a rebuild, but the product, UI, and branding target Zeon Fitness
only for v1.

## Why single-gym-first

Validated against real problems observed across 3 gyms, not guessed:

1. **Retention / communication** — members drift away with no one noticing until they've
   already quit. Solved by automated check-in nudges, milestone messages, and renewal
   reminders (Phase 2).
2. **Trainer absence** — trainers aren't always physically present, and members are left
   without guidance when that happens. Solved by making the app itself the guidance
   source: every assigned workout/diet day carries enough detail (instructions, form
   notes, demo media) that a member can follow it correctly without a trainer standing
   next to them.
3. **Billing chaos** — owners don't reliably know whose membership has expired. Solved by
   plan booking that creates a subscription record with a real end date, plus a dues
   dashboard, instead of tracking expiries by memory or notebook.

## Brand / identity (Zeon Fitness)

- Theme: light green and black, bold UI (not a generic admin-panel look)
- Region: Nepal — currency NPR, dates/times in local format
- One gym for v1; schema stays tenant-ready for when gym #2 and #3 want in

## User roles and capabilities

### Gym owner (Zeon Fitness)

- Add, edit, deactivate members and trainers
- Record and review attendance (manual check-in and history)
- Track membership dues: active, expiring, overdue, and payment history
- Mark dues as paid manually (cash/bank transfer reconciliation — no payment gateway in v1)
- Assign trainers to members
- Create and manage promotional offers
- View operational dashboards: attendance trends, revenue, at-risk/expiring members

### Trainer

- View the members assigned to them
- Create and assign a 7-day workout plan per member — each day includes exercises with
  sets/reps, rest, and enough instruction (description, form notes, optional
  image/video link) that a member can follow it correctly on their own
- Create and assign a 7-day diet plan per member — each day includes meals with
  macros/notes, detailed enough to follow without a trainer explaining it live
- Update or revise a member's plan
- View a member's attendance history to inform plan changes

### Member

- Browse and book a membership plan: **1 month, 3 month, 6 month, 1 year** (NPR pricing —
  placeholder amounts until real pricing is provided, see `setup-required.md`)
- View their assigned 7-day workout and diet plan, with full guidance detail — usable even
  when their trainer isn't present
- View their own attendance history
- View membership status: plan tier, start/end date, days remaining, dues owed
- View active offers
- Receive automated notifications: missed-session nudges, milestone celebrations,
  renewal reminders, targeted offers

## Functional requirements

- Secure signup/login with short-lived access token + rotated refresh token
- Role-based access control on every route: gym owner, trainer, member (platform-admin
  role deferred until a second gym actually onboards)
- Member CRUD with trainer assignment
- Attendance creation, update, and history retrieval
- Membership plan catalog (1/3/6/12 month) with booking flow that creates a subscription
  with correct start/end dates
- Dues tracking with manual paid/unpaid marking by the owner (no payment gateway
  integration in v1 — eSewa/Khalti considered later, see `setup-required.md`)
- 7-day workout and diet plan assignment and editing, scoped to trainer -> member, with
  structured per-day guidance content (not just a title/description)
- Offer publishing visible to members
- Automated retention messaging: missed-check-in nudges, milestone (Nth visit, birthday)
  celebrations, targeted offers to at-risk members, dues/renewal reminders
- Audit log for owner and trainer actions that change member data

## Non-functional requirements

- Data model stays tenant-ready (`gymId` on every relevant table) even though only one
  gym exists in v1 — cheap now, expensive to retrofit later
- Passwords hashed with argon2id; access tokens short-lived (15 min); refresh tokens
  rotated and revocable
- Every write path validated and every query parameterized (Prisma)
- Bold, fast, mobile-friendly UI matching Zeon Fitness's light green/black identity —
  most members will check plans and attendance on a phone
- Background job processing for reminders and notifications, decoupled from request flow
- Structured logs and basic metrics from day one
