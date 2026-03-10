# AUDIT-REPORT

## Summary

The audit focused on production hardening rather than feature expansion. The codebase now has consistent app-route error handling, stricter webhook behavior, runtime env guards instead of non-null assertions in production paths, ownership checks on dashboard APIs, and updated product documentation.

## What Was Found

- Webhook handlers were inconsistent about returning `200` on errors, especially Stripe.
- Twilio webhook validation could be skipped in production via `SKIP_TWILIO_VALIDATION`.
- Several route handlers assumed Supabase `select()` calls would succeed and did not check error paths.
- Runtime env usage still relied on non-null assertions in Supabase and middleware code.
- Dashboard call detail APIs returned `404` for cross-tenant access attempts instead of explicit `403`.
- ElevenLabs post-call processing had no pre-insert duplicate guard on `elevenlabs_conversation_id`.
- Sensitive or noisy webhook logging remained in ElevenLabs and Twilio handlers.
- `PRD.md` no longer matched the shipped architecture or feature set.
- `next lint` was not configured, so CI-safe lint execution was not possible.

## What Was Fixed

- Added shared env helpers and removed runtime non-null assertions from production paths.
- Added a shared Twilio webhook validation utility and enforced validation in production for voice, status, and dial-fallback webhooks.
- Standardized webhook behavior to return `200` even when internal work fails, with route-prefixed logs.
- Added duplicate conversation short-circuiting for ElevenLabs post-call webhooks.
- Made Stripe `checkout.session.completed` handling idempotent enough to avoid duplicate activation work and duplicate welcome SMS on retries.
- Added explicit ownership verification and `403` responses for call detail and recording routes.
- Added error handling for all audited `supabase.from(...).select(...)` calls in API routes and key server pages.
- Replaced `NEXT_PUBLIC_APP_URL` runtime usage with `VERCEL_URL` and request-based base URL resolution.
- Removed raw webhook payload logging and redacted phone numbers in operational logs.
- Added a minimal Next.js ESLint config so `pnpm --dir apps/web lint` can run non-interactively.
- Rewrote `PRD.md` and added `TECH-DEBT.md`.

## Left Alone

- Design system and visual language were preserved.
- ElevenLabs agent configuration was not changed.
- Supabase schema was not expanded beyond existing columns already represented in migrations.
- Existing product warnings from lint were not treated as blocking because the lint run completed with warnings only:
  - `app/page.tsx` still uses `<img>` in the marketing page.
  - `app/(onboarding)/onboarding/number/number-view.tsx` still has a hook dependency warning.

## Verification

- `pnpm --dir apps/web type-check`: passed
- `pnpm --dir apps/web lint`: passed with warnings, no errors

## Files Changed

- `PRD.md`
- `TECH-DEBT.md`
- `AUDIT-REPORT.md`
- `apps/web/.eslintrc.json`
- `apps/web/app/(dashboard)/layout.tsx`
- `apps/web/app/(dashboard)/dashboard/page.tsx`
- `apps/web/app/(dashboard)/dashboard/billing/page.tsx`
- `apps/web/app/(dashboard)/dashboard/settings/page.tsx`
- `apps/web/app/(dashboard)/dashboard/calls/[id]/page.tsx`
- `apps/web/app/(onboarding)/onboarding/setup/page.tsx`
- `apps/web/app/(onboarding)/onboarding/number/page.tsx`
- `apps/web/app/(onboarding)/onboarding/payment/page.tsx`
- `apps/web/app/(onboarding)/onboarding/complete/page.tsx`
- `apps/web/app/(onboarding)/onboarding/test/page.tsx`
- `apps/web/app/api/billing/checkout/route.ts`
- `apps/web/app/api/billing/portal/route.ts`
- `apps/web/app/api/business/route.ts`
- `apps/web/app/api/business/test-call/route.ts`
- `apps/web/app/api/calls/route.ts`
- `apps/web/app/api/calls/[id]/route.ts`
- `apps/web/app/api/calls/[id]/audio/route.ts`
- `apps/web/app/api/onboarding/provision/route.ts`
- `apps/web/app/api/test/trigger-call/route.ts`
- `apps/web/app/api/webhook/twilio/voice/route.ts`
- `apps/web/app/api/webhook/twilio/status/route.ts`
- `apps/web/app/api/webhook/twilio/dial-fallback/route.ts`
- `apps/web/app/api/webhook/stripe/route.ts`
- `apps/web/app/api/webhook/elevenlabs/route.ts`
- `apps/web/app/api/webhook/elevenlabs/variables/route.ts`
- `apps/web/lib/env.ts`
- `apps/web/lib/twilio/webhook.ts`
- `apps/web/lib/notifications/email.ts`
- `apps/web/lib/notifications/sms.ts`
- `apps/web/lib/supabase/client.ts`
- `apps/web/lib/supabase/server.ts`
- `apps/web/lib/utils.ts`
- `apps/web/middleware.ts`
