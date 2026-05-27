# Architecture

## Chosen stack

- Frontend: Next.js with TypeScript
- Core API: NestJS with TypeScript and Prisma
- Auth service: dedicated NestJS authentication microservice
- Database: PostgreSQL
- Cache and jobs: Redis and BullMQ
- Email: background worker with a provider such as SES, SendGrid, or Resend

## Service boundaries

### Web app

Handles UI, role-aware navigation, dashboards, forms, and authenticated API calls.

### Core API

Owns gym domain data:

- members
- attendance
- subscriptions
- plans
- offers
- audits

### Auth service

Owns identity data and security logic:

- user credentials
- login and refresh tokens
- password reset flows
- role claims and token issuance

### Worker service

Owns asynchronous tasks:

- subscription expiry emails
- reminders
- scheduled digests

## Authorization model

- Admin can access member management, attendance, plans, offers, and reporting
- Member can only access their own profile, attendance, plans, offers, and subscription data
- Trainer can be added later without changing the core identity model
