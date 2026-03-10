# Product Requirements Document — NeverMiss AI

**Version:** 3.0  
**Date:** March 10, 2026  
**Status:** Code audited, operational launch items remaining

## 1. Product Summary

NeverMiss AI is an AI-backed phone answering system for home service businesses. Missed or after-hours calls route into an AI receptionist, lead details are extracted, and the business owner receives an immediate notification with the transcript and callback context.

Primary audience:
- Plumbing
- HVAC
- Electrical
- Roofing
- General home services

Primary outcome:
- Capture revenue from calls the contractor would otherwise miss

## 2. Current Architecture

```text
Customer phone call
  -> Twilio Voice number
    -> /api/webhook/twilio/voice
      -> In business hours: <Dial> owner phone
        -> /api/webhook/twilio/dial-fallback if no answer
      -> Out of hours or fallback: <Connect><Stream> to ElevenLabs
        -> /api/webhook/elevenlabs/variables for business-specific prompt variables
        -> ElevenLabs conversation
        -> /api/webhook/elevenlabs post-call webhook
          -> Supabase calls insert
          -> Twilio SMS notification
          -> Resend email notification
          -> ElevenLabs recording fetch
          -> Supabase Storage signed playback in dashboard

Web app (Next.js on Vercel)
  -> Marketing site
  -> Supabase Auth login/signup
  -> Onboarding: setup, number provisioning, test call, payment, completion
  -> Dashboard: call log, call detail, recordings, settings, billing

Billing
  -> Stripe Checkout session
  -> Stripe Customer Portal
  -> /api/webhook/stripe updates subscription state in Supabase
```

## 3. Tech Stack

| Layer | Technology | Notes |
| --- | --- | --- |
| App framework | Next.js 14 App Router | Single app for marketing, dashboard, and API routes |
| Hosting | Vercel | App + serverless route handlers |
| Auth | Supabase Auth | Email/password plus OAuth callback flow |
| Database | Supabase Postgres | Businesses, calls, billing state |
| File storage | Supabase Storage | Private call recordings bucket |
| Voice ingress | Twilio Voice | Inbound numbers, dial fallback, status callbacks |
| Voice AI | ElevenLabs Conversational AI | Shared agent with per-business dynamic variables |
| SMS | Twilio Messaging | Lead alerts and welcome SMS |
| Email | Resend | Lead alert email delivery |
| Billing | Stripe | Checkout, subscriptions, billing portal |

## 4. Implemented Features

| Feature | Status | Notes |
| --- | --- | --- |
| Marketing landing page | Complete | Live in the main Next.js app |
| Auth flow | Complete | Protected dashboard and onboarding routes |
| Business onboarding | Complete | Setup, number provisioning, test, payment, completion screens |
| Twilio number provisioning | Complete | Buys and stores a number per business |
| Business-hours routing | Complete | Routes to owner first, AI fallback when configured |
| ElevenLabs personalization | Complete | Business name, owner name, trade, business ID |
| Post-call lead capture | Complete | Transcript, extracted fields, duration, call metadata |
| SMS lead alerts | Complete | Runtime guarded; depends on valid Twilio sender |
| Email lead alerts | Complete | Runtime guarded; requires Resend envs |
| Dashboard call log | Complete | Paginated API-backed list |
| Call detail + transcript | Complete | Includes lead status updates |
| Recording playback | Complete | Recording fetched from ElevenLabs and served via signed URL |
| Billing checkout | Complete | Stripe subscription checkout route |
| Billing portal | Complete | Stripe customer portal route |
| Webhook security hardening | Complete | Twilio prod validation, ElevenLabs HMAC, Stripe constructEvent |
| Webhook idempotency safeguards | Complete | ElevenLabs duplicate conversation check, Stripe duplicate activation guard |

## 5. Current Product Constraints

- One business per authenticated owner account is assumed throughout the dashboard.
- A shared ElevenLabs agent is used across businesses; personalization is prompt-variable based.
- Call forwarding from the contractor's main line is still a manual user setup step.
- Dashboard pagination exists for the main call log, but not every place that reads recent calls.

## 6. Launch Blockers

1. Pricing copy mismatch: landing page advertises `$297/month`, while Stripe checkout is configured for `$250/month`.
2. SMS deliverability is only production-safe if the configured Twilio messaging sender is verified and approved.
3. Monitoring, alerting, and rate limiting are not yet installed.
4. Production env completeness still matters: Twilio, Stripe, Supabase service role, ElevenLabs, and Resend must all be set correctly in Vercel.

## 7. Roadmap

### Sprint 1 — Done
- Marketing site
- Auth flow
- Onboarding setup flow
- Number provisioning
- Stripe checkout
- Dashboard shell and call log

### Sprint 2 — Done
- Business settings management
- Business-hours call routing
- Owner dial fallback to AI
- Call detail page
- Recording retrieval and playback
- Email notification wiring

### Sprint 3 — Done
- Production webhook validation
- Dashboard API ownership checks
- Runtime env guards
- ElevenLabs duplicate processing protection
- Stripe duplicate activation protection
- Force-dynamic coverage on auth/DB server pages

### Next Up
- Monitoring and alerting
- Request rate limiting
- Per-business voice customization
- Analytics and call quality metrics
- Multi-user account model
- Automated forwarding setup assistance by carrier

## 8. Operational Notes

- Primary marketing domain in code: `https://nevermissai.com`
- Application and webhook base URL resolve from `VERCEL_URL` at runtime
- Stripe plan config currently uses a 14-day trial
- Business timezone support exists in schema and routing logic
