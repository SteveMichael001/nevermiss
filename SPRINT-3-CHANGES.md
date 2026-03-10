# Sprint 3 Changes

## Files changed

- `apps/web/app/(dashboard)/dashboard/call-log-view.tsx`
- `apps/web/components/call-log-table.tsx`
- `apps/web/components/lead-status-select.tsx`
- `apps/web/components/transcript-view.tsx`
- `apps/web/app/(dashboard)/dashboard/calls/[id]/page.tsx`
- `apps/web/app/(dashboard)/dashboard/settings/settings-form.tsx`
- `apps/web/app/api/business/route.ts`
- `apps/web/app/api/webhook/twilio/voice/route.ts`
- `apps/web/app/api/test/trigger-call/route.ts`
- `apps/web/lib/utils.ts`
- `supabase/migrations/002_ring_preference.sql`
- `SPRINT-3-CHANGES.md`

## Summary

### Task 1: Dashboard caller profile hierarchy

- Reworked the call log table so each row leads with caller name and phone, then service needed, then urgency plus relative time.
- Removed transcript expansion from the table.
- Added row navigation to `/dashboard/calls/[id]`.
- Added a dedicated call detail page with:
  - caller name
  - phone
  - service needed
  - urgency
  - preferred callback time
  - full formatted transcript with caller/AI turns separated
  - audio player when `recording_url` exists
  - lead status selector

### Task 2: Ring preference setting

- Added `dial_timeout_seconds` support to settings and `PATCH /api/business`.
- Added the migration file `supabase/migrations/002_ring_preference.sql` and did not run it.
- Updated the Twilio voice webhook to fetch `dial_timeout_seconds`.
- If `dial_timeout_seconds` is `0`, the in-hours flow skips `<Dial>` and sends the call straight to ElevenLabs.

### Task 3: One-button test caller

- Added `POST /api/test/trigger-call`.
- Guard behavior:
  - allowed automatically outside production
  - in production, requires the `TEST_API_SECRET` header to match `process.env.TEST_API_SECRET`
- The route looks up the requested business or the first active business, then uses Twilio to place an outbound call to the AI number with a realistic spoken caller script and hangup.
- Added a settings button that triggers the route and reports success or error inline.

## Optional env var

- `TEST_API_SECRET`
  - Optional.
  - Only needed if you want to allow `/api/test/trigger-call` in production.

## Verification

- Ran `pnpm --filter @nevermiss/web type-check`
