# Required Setup

This file lists the external accounts and project-side changes that are required before implementation can proceed cleanly.

## Accounts to create

- GitHub
- PostgreSQL provider such as Neon, Supabase, or managed cloud Postgres
- Redis provider such as Upstash or managed cloud Redis
- Email provider such as Resend, SendGrid, or Postmark
- Object storage provider such as S3, Cloudflare R2, or Azure Blob Storage
- Domain registrar and DNS provider such as Cloudflare
- Error tracking provider such as Sentry
- Secret manager such as 1Password Secrets, Doppler, or a cloud secret manager later

## Information to collect from each account

- Login email
- API keys or access keys
- Connection URLs
- Region or data center
- Bucket or project name
- Verified sender email for mail delivery
- DNS nameservers and verification records

## Project changes required

- Update `.env.example` with placeholders for every external service
- Create local `.env` only after real credentials are available
- Keep auth secrets separate from API secrets
- Keep storage credentials separate from database credentials
- Keep staging and production values separate from local values
- Add validation so missing env vars fail fast at startup

## First implementation order

1. Create the external accounts above.
2. Capture the connection values and API keys.
3. Put only placeholders into `.env.example`.
4. Build local infrastructure with Docker Compose.
5. Implement auth, members, attendance, plans, and notifications.

## Rule

Do not hardcode real credentials into the repository. Keep all secrets outside Git and load them from environment variables or a secret manager.