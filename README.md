# Gym Platform

A local-first gym management platform with a real frontend, backend, auth service, and RBAC. Cloud services are deferred until the core app is working.

## Structure

- `apps/web` - Browser UI for admin and members
- `apps/api` - Core gym domain API
- `services/auth` - Authentication and authorization service
- `services/worker` - Optional background jobs later
- `packages/shared` - Shared helpers and token utilities
- `docs` - Product, architecture, and roadmap notes

## Local dependencies

- No external services required for the first local build
- Optional later: PostgreSQL, Redis, email provider, object storage, Sentry

## Phase 1

- Authentication and RBAC
- Admin member management
- Attendance tracking
- Exercise and diet plan assignment
- Member view of attendance, plans, and offers
