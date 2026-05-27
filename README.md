# Gym Platform

A production-minded gym management platform with a web app, core API, auth microservice, worker service, PostgreSQL, Redis, and automated email reminders.

## Structure

- `apps/web` - Next.js frontend for admin and members
- `apps/api` - Core gym domain API
- `services/auth` - Authentication and authorization service
- `services/worker` - Background jobs and email notifications
- `packages/shared` - Shared types and validation schemas
- `docs` - Product, architecture, and roadmap notes

## Local dependencies

- PostgreSQL
- Redis
- Mailhog for local email testing

## Phase 1

- Authentication and RBAC
- Admin member management
- Attendance tracking
- Subscription expiry reminders
- Offer visibility
- Exercise and diet plan assignment
