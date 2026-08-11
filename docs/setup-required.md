# Required Setup

External accounts and project changes needed before each phase, in the order they
actually become necessary — not all of these are needed to start.

## Needed for Phase 1 (core MVP)

- GitHub (already in use)
- PostgreSQL provider — Neon, Supabase, or Railway all work for a single gym at this
  scale; Neon/Supabase have generous free tiers
- A place to deploy one Node process — Railway, Render, or Fly.io are the simplest for a
  single Express app; no Kubernetes/Docker-orchestration needed at this scale

## Needed for Phase 2 (retention automation)

- Email provider for transactional mail — Resend or SendGrid, need a verified sender
  domain
- Optional: SMS/WhatsApp provider (e.g. Twilio, or a WhatsApp Business API provider) if
  notifications go beyond email — decide before building the notification module, since
  it affects the `Notification.channel` design

## Needed for Phase 3 (dashboards/payments)

- v1 uses manual cash/bank dues tracking — no account needed yet
- If/when online payment is added: eSewa or Khalti (the standard gateways in Nepal),
  not Stripe/Razorpay, since Zeon Fitness's members are Nepal-based

## Needed for Phase 5 (hardening)

- Error tracking — Sentry
- Domain + DNS — a registrar plus Cloudflare or similar
- Secret manager — can stay as plain environment variables on the hosting provider until
  there's a real ops team; upgrade to Doppler/1Password Secrets only when that stops
  being enough

## Rules

- `.env.example` lists variable names only, never real values
- Real `.env` values only ever live outside Git
- Separate secrets per environment — local, staging, production never share a JWT secret
  or database
- Missing required env vars should fail the app at startup, not fail silently at runtime
