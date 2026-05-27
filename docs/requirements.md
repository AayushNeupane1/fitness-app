# Requirements

## Product goal

Build a flexible gym management SaaS that supports member tracking, attendance, exercise plans, diet plans, offers, and automated subscription communication.

## User roles

### Admin

- Add and update members
- Update attendance
- Track active, expired, and expiring members
- Assign exercise plans
- Assign diet plans
- Create and manage offers
- View operational metrics

### Member

- View attendance history
- View assigned exercise and diet plans
- View offers
- Receive email when subscription is nearing end
- View subscription status and renewal dates

## Functional requirements

- Authentication with secure login and refresh flow
- Role-based access control for admin and member
- Member profile management
- Attendance creation, update, and retrieval
- Subscription tracking with expiry reminders
- Offer publishing and member visibility
- Exercise and diet plan assignment
- Audit-friendly history for critical admin actions

## Non-functional requirements

- Multi-tenant ready design for future gym chains
- Secure password storage and token handling
- Scalable service boundaries for independent deployment
- Clear API contracts between frontend and services
- Background processing for emails and scheduled jobs
- Monitoring-ready logs and metrics
