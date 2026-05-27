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

## Phase 1: Create accounts

Create these accounts before building anything serious.

### Required accounts

- GitHub for source control and collaboration
- Cloud provider account such as AWS, Azure, or GCP
- Managed PostgreSQL account or service
- Redis service account or managed cache
- Email provider account such as SendGrid, Resend, or Postmark
- Object storage account such as S3, Azure Blob, or Cloud Storage
- Domain registrar account
- DNS account if separate from registrar
- Error tracking account such as Sentry
- CI/CD platform account if not using cloud-native pipelines
- Secret manager access such as AWS Secrets Manager, Azure Key Vault, or GCP Secret Manager

### What to change in the project

- Add `.env` values for each service
- Add cloud resource names and URLs to documentation
- Prepare secret placeholders in `.env.example`
- Prepare separate configuration for local, staging, and production

## Phase 2: Setup local infrastructure

### What to create

- PostgreSQL for application data
- Redis for queues and background jobs
- Mailhog or a sandbox email inbox for testing
- Docker Compose for local development

### What to change in the project

- Connect the database layer to PostgreSQL
- Connect the job queue to Redis
- Add email worker configuration
- Add environment validation so missing values fail fast

## Phase 3: Build identity first

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

1. Create cloud accounts and secrets access
2. Stand up PostgreSQL, Redis, and email testing locally
3. Implement auth service
4. Implement core API member and attendance features
5. Implement expiry email worker
6. Build the admin dashboard
7. Build the member dashboard
8. Add production hardening and deployment

## Practical rule

If a change affects security, access control, or data ownership, decide it before coding. If it affects look and feel only, it can be adjusted later.
