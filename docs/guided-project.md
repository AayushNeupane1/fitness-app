# Guided Project Plan

This is the execution order for building the gym platform in a way that stays practical, production-ready, and easy to expand.

## Phase 0: Lock the product shape

### What to decide

- Target users: gym owner, admin, member, trainer later
- Core features for v1: members, attendance, subscriptions, plans, offers, expiry emails
- What is out of scope: payments, mobile app, live classes, wearable integrations
- Whether this is single-gym first or multi-tenant from day one

### What to change in the project

- Keep the repo as a monorepo
- Keep the first release focused on one business domain: gym operations
- Keep auth separate from business logic
- Keep the frontend and backend contracts documented before coding

## Phase 1: Build the local MVP

### What to create

- A browser-based frontend for admin and member flows
- A core backend API
- A dedicated auth service
- Role-based access control with admin and member roles
- In-memory data storage for the first working version

### What to change in the project

- Keep the app self-contained and runnable on one machine
- Use a shared token format between auth and API
- Remove dependency on cloud accounts for the first build
- Make login, RBAC, and dashboard data flow end to end

## Phase 2: Add persistence later

### What to create

- PostgreSQL for application data
- Redis for queues and background jobs
- A worker service for background tasks later

### What to change in the project

- Replace in-memory storage with a database layer
- Add persistence for members, attendance, and plans
- Add environment validation once real services are introduced

## Phase 3: Expand identity

### What to create

- Auth microservice
- Login endpoint
- Token refresh endpoint
- Logout or token revocation flow
- Role-based access control

### What to change in the project

- Define roles: admin, member, trainer later
- Store password hashes only, never plain passwords
- Add JWT secrets and token expiry settings
- Make the frontend request tokens from the auth service
- Make the API verify access tokens before any data access

## Phase 4: Build the gym core

### What to create

- Member management
- Attendance tracking
- Subscription records
- Exercise plans
- Diet plans
- Offers

### What to change in the project

- Add database tables for member profiles and gym data
- Add API endpoints for admin operations
- Add member-only endpoints for personal data
- Add audit logging for admin actions
- Make all sensitive actions role-checked

## Phase 5: Build notifications

### What to create

- Subscription expiry reminders
- Email templates
- Scheduled background jobs
- Notification retry handling

### What to change in the project

- Add a worker service
- Add a queue for reminder jobs
- Add email provider credentials
- Add reminder timing rules such as 30 days, 7 days, and 1 day before expiry

## Phase 6: Build the frontend

### What to create

- Admin dashboard
- Member dashboard
- Login and session handling
- Member detail pages
- Attendance and subscription views

### What to change in the project

- Add route guards by role
- Add API client helpers
- Add shared UI components
- Add loading, error, and empty states

## Phase 7: Harden for production

### What to create

- Logging and metrics
- Backups
- Rate limiting
- Security headers
- Deployment pipeline

### What to change in the project

- Add monitoring and alerting
- Add database migrations and backup policy
- Add audit retention rules
- Add staging and production environments
- Add deployment instructions for the cloud platform

## Recommended first implementation order

1. Build the local frontend, auth service, and API together
2. Verify RBAC with admin and member logins
3. Add PostgreSQL persistence later
4. Add Redis, background jobs, and notifications later
5. Add cloud services only after the app works locally

## Practical rule

If a change affects security, access control, or data ownership, decide it before coding. If it affects look and feel only, it can be adjusted later.
