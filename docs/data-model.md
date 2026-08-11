# Data Model

Extends the existing `packages/db/prisma/schema.prisma`. Every model below except `Gym`
carries a `gymId` foreign key. Only one `Gym` row (Zeon Fitness) exists in v1, but every
query stays scoped by `gymId` from day one so onboarding gym #2 later is a data change,
not a schema migration or query rewrite.

## Gym

The tenant root. One row for v1: Zeon Fitness.

- `id`, `name`, `slug`, `themePrimary` (e.g. light green hex), `themeSecondary` (black hex)
- `status` (active, suspended, trial)
- `createdAt`

## User

Login identity. One row per person, regardless of role.

- `id`, `email` (unique), `passwordHash`, `role` (`GYM_OWNER`, `TRAINER`, `MEMBER`) —
  `PLATFORM_ADMIN` deferred until a second gym actually onboards
- `gymId`
- Relations: `RefreshToken[]`, optional `Member` profile, optional `Trainer` profile

## Trainer

- `id`, `userId` (unique), `gymId`
- `fullName`, `phone`, `specialty`
- Relation: `members` (members currently assigned to this trainer)

## Member

- `id`, `userId` (nullable, unique), `gymId`, `trainerId` (nullable)
- `fullName`, `phone`, `dateOfBirth`, `address`, `joinedAt`
- Relations: `attendance[]`, `subscriptions[]`, `workoutPlans[]`, `dietPlans[]`, `payments[]`

## MembershipPlan

Catalog of bookable plans. Owner-editable, so pricing isn't hardcoded in the app.

- `id`, `gymId`, `label` (e.g. "1 Month", "3 Month", "6 Month", "1 Year")
- `durationMonths` (1, 3, 6, 12)
- `priceNpr` — **placeholder values until real Zeon Fitness pricing is provided**
- `isActive`

## Subscription

Created when a member books a `MembershipPlan`. Drives the "membership left" view.

- `id`, `memberId`, `gymId`, `membershipPlanId`, `startsAt`, `endsAt`
- `status` (`ACTIVE`, `EXPIRING`, `EXPIRED`) — computed on read from dates
- Relation: `payments[]`

## Payment

Dues tracking. **v1 is manual**: owner marks a payment as received after collecting
cash/bank transfer in person. No payment gateway integration yet (eSewa/Khalti considered
for a later phase — see `setup-required.md`).

- `id`, `subscriptionId`, `gymId`, `amountNpr`, `dueDate`, `paidAt` (nullable)
- `method` (`CASH`, `BANK_TRANSFER`, `OTHER`) — free text or small enum, no gateway fields
- `status` (`PAID`, `DUE`, `OVERDUE`)
- `recordedByUserId` — which owner/staff account marked it paid, for accountability

## WorkoutPlan / WorkoutPlanDay / Exercise

A plan has exactly 7 day entries. Each day's exercises carry enough detail that a member
can follow the session correctly even if their trainer is absent that day — this is the
direct fix for "trainer isn't always there to guide people."

- `WorkoutPlan`: `id`, `memberId`, `trainerId`, `gymId`, `title`, `notes`, `assignedAt`
- `WorkoutPlanDay`: `id`, `workoutPlanId`, `dayOfWeek` (0–6), `restDay` (bool)
- `Exercise`: `id`, `workoutPlanDayId`, `name`, `sets`, `reps`, `restSeconds`,
  `formNotes` (plain-language cueing, e.g. "keep back flat, control the descent"),
  `imageUrl` (nullable), `videoUrl` (nullable), `order`

## DietPlan / DietPlanDay / Meal

Same "usable without a trainer present" principle applies to diet guidance.

- `DietPlan`: `id`, `memberId`, `trainerId`, `gymId`, `title`, `notes`, `assignedAt`
- `DietPlanDay`: `id`, `dietPlanId`, `dayOfWeek` (0–6)
- `Meal`: `id`, `dietPlanDayId`, `name`, `time`, `items` (text or structured list),
  `macroNotes` (nullable), `order`

## Offer

- `id`, `gymId`, `title`, `description`, `activeFrom`, `activeTo`
- `targetSegment` (nullable — e.g. "at-risk", "all", used by targeted-offer automation)

## Notification

Log of automated messages sent — avoids duplicate sends and gives the owner visibility
into what went out.

- `id`, `gymId`, `memberId`, `type` (`missed_checkin`, `milestone`, `renewal_reminder`,
  `offer`), `channel` (`email`, `sms`), `sentAt`, `payload`

## RefreshToken

- `id`, `userId`, `tokenHash`, `expiresAt`, `revokedAt`

## AuditLog

- `id`, `gymId`, `actorUserId`, `action`, `targetType`, `targetId`, `metadata`, `createdAt`
- Written on every owner/trainer action that changes member-facing data, including manual
  payment marking (accountability for who marked what as paid)
