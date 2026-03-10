# NeverMiss AI — Final Audit Report
**Date:** March 5, 2026  
**Auditor:** Maggie (subagent)  
**Scope:** `apps/web/app/`, `apps/web/lib/`, `apps/web/components/`, `supabase/migrations/001_initial_schema.sql`, `packages/shared/`  
**TypeScript:** `pnpm exec tsc --noEmit` → **0 errors, 0 warnings**

---

## Summary

The codebase is clean — no AI slop, no hollow skeletons, no panic-driven hacks. Webhook security is solid (HMAC, Twilio sig validation, replay protection). The overall architecture is coherent and the UI is contractor-appropriate.

**But there are 5 blockers that will break real testing.** Three of them are silent failures (calls answered wrong, payment failures not stopping service, wrong Twilio webhook URL). Fix those before touching an API key.

---

## 1. Critical — Will break in production

### C1. Business hours UI is missing — a PRD Must Have
**Where:** `app/(dashboard)/dashboard/settings/settings-form.tsx`

The settings form has no business hours controls. The `PATCH /api/business` endpoint supports `business_hours` updates and the DB has the JSONB column, but there's no UI to configure it. Per-day open/close times are unset for every business out of the box.

**Impact:** `business_hours` is `null` → `isWithinBusinessHours()` returns `false` → ALL calls go to ElevenLabs AI, 24/7. The in-hours forwarding to owner's cell never fires. The core routing logic is dead on arrival.

This is marked as a **Must Have launch blocker** in the PRD (Section 13).

---

### C2. Variables endpoint can't identify the correct business — AI greets every caller with "the business"
**Where:** `app/api/webhook/elevenlabs/variables/route.ts:126–138`

With V1's one shared ElevenLabs agent, the variables endpoint does:
```typescript
.eq('elevenlabs_agent_id', agentId).single()
```
Since all businesses share the same `ELEVENLABS_AGENT_ID` env var, either:
- No business has it populated → `.single()` returns null → falls back to `defaultVariables`
- Multiple businesses have it → `.single()` throws → falls back to `defaultVariables`

Either way: **every call gets** `business_name: "the business"`, `owner_name: "the owner"`, `trade: "general"`. The AI greets callers with _"Hi, thanks for calling the business."_

The fix: the request body includes `body.call.twilio_call_sid`. Use it to call `twilio.calls(callSid).fetch()` → get the `to` number → look up business by `twilio_phone_number`. This makes the lookup work per-call regardless of shared agent.

**Note:** The post-call webhook correctly gets `business_id` from `conversation_initiation_client_data.dynamic_variables.business_id` (passed as a Twilio Stream Parameter), so call records insert correctly. Only the greeting personalization breaks.

---

### C3. `invoice.payment_failed` doesn't stop service
**Where:** `app/api/webhook/stripe/route.ts:74–88`

```typescript
case 'invoice.payment_failed': {
  // ...
  await supabase.from('businesses').update({ subscription_status: 'past_due' }).eq('id', businessId)
}
```

Missing: `is_active: false`. Per the PRD (Section 10): "On subscription cancel/fail: Set `businesses.is_active = false`." Without this, the Twilio voice webhook sees `is_active = true` and keeps answering calls for non-paying customers. Revenue leaks immediately on any failed payment.

`customer.subscription.deleted` correctly sets `is_active: false`. Only `invoice.payment_failed` is missing it.

---

### C4. `NEXT_PUBLIC_APP_URL` is not in `.env.example` but two critical routes depend on it
**Where:** `.env.example` (missing), `app/api/onboarding/provision/route.ts:81`, `app/api/webhook/twilio/voice/route.ts:155–156`

The provision endpoint sets the Twilio voice webhook URL:
```typescript
const appUrl = process.env.NEXT_PUBLIC_APP_URL
const purchased = await client.incomingPhoneNumbers.create({
  voiceUrl: `${appUrl}/api/webhook/twilio/voice`,
```

If `NEXT_PUBLIC_APP_URL` is unset: `voiceUrl = "undefined/api/webhook/twilio/voice"`. Twilio will get 404s on every call. No calls will ever be answered.

The voice webhook also uses it for signature validation in production. Missing from env example means it'll be missed on fresh deploys.

**Fix:** Add `NEXT_PUBLIC_APP_URL=https://app.nevermiss.ai` to `.env.example`.

---

### C5. `/api/webhook/twilio/status` route doesn't exist
**Where:** `app/api/onboarding/provision/route.ts:87`

```typescript
statusCallback: `${appUrl}/api/webhook/twilio/status`,
statusCallbackMethod: 'POST',
```

Twilio will POST call status events (completed, no-answer, failed) to this URL on every call. There's no handler at `app/api/webhook/twilio/status/route.ts`. Twilio gets a 404 → logs errors → potential retry loops. Also means calls forwarded to owner's cell are never logged.

---

## 2. Major — Significant tech debt or buyer experience damage

### M1. `/api/business` GET leaks sensitive fields to the frontend
**Where:** `app/api/business/route.ts:14`, `app/(dashboard)/dashboard/settings/page.tsx:17`

Both do `select('*')`. The full business object (including `stripe_customer_id`, `stripe_subscription_id`, `twilio_phone_sid`, `elevenlabs_agent_id`, `owner_id`) reaches the browser via the settings page. A user inspecting network requests sees their Stripe customer ID.

Settings form only needs: `id, name, trade, owner_name, owner_phone, owner_email, twilio_phone_number, greeting_text, notification_phones, notification_emails, business_hours`. Select exactly those.

---

### M2. `/api/business/test-call` is a hollow stub
**Where:** `app/api/business/test-call/route.ts`

```typescript
// In a full implementation, this would trigger the voice server
// to make a test call to the AI number
return NextResponse.json({ success: true, message: `Test call initiated to ${business.twilio_phone_number}` })
```

It does nothing. Returns `success: true` while initiating no call. The test view at `/onboarding/test` doesn't call this endpoint anyway (it just tells the user to call manually), so this is harmless right now — but it's dead/lying code.

---

### M3. Call log filters are client-side — only work on first 25 calls
**Where:** `app/(dashboard)/dashboard/call-log-view.tsx:41–47`, `app/(dashboard)/dashboard/page.tsx:27–31`

Dashboard fetches first 25 calls (`range(0, 24)`). `CallLogView` filters `initialCalls` in memory. A business with 100 calls filtering for "Emergency" only searches the 25 most recent, silently hiding older emergencies. The `GET /api/calls` endpoint supports server-side `urgency` and `status` params but they're never called from the dashboard.

---

### M4. Settings form has no notification_phones / notification_emails UI
**Where:** `app/(dashboard)/dashboard/settings/settings-form.tsx`

PRD Section 8: "Additional notification recipients (phone + email)" should be in settings. The PATCH endpoint supports these fields (`allowedFields` includes them), the DB has the columns, but there's no UI to manage them. Silent capability gap.

---

### M5. `elevenlabs_conversation_id` column added to wrong table
**Where:** `supabase/migrations/001_initial_schema.sql:81–82`

```sql
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS elevenlabs_conversation_id TEXT;
```

A conversation ID belongs to a call, not a business. The `calls` table correctly has `elevenlabs_conversation_id` (line 87). The businesses column is semantically wrong and will confuse anyone reading the schema. Delete it.

---

### M6. `notification_latency_ms` and `email_sent_at` are both wrong
**Where:** `app/api/webhook/elevenlabs/route.ts:337, 383–385`

```typescript
const callStartMs = Date.now() // set AFTER Supabase insert (step 7)
// ... SMS send ...
const notificationLatencyMs = Date.now() - callStartMs // measures time since insert, not since call end
```

Measures time from "after DB insert" to "after notification timestamps update" — not "call end to SMS delivery" as PRD specifies. Should be measured from `payload.event_timestamp`.

`email_sent_at` is set on the Supabase update regardless of whether the fire-and-forget email actually succeeded. It will read as sent even if Resend throws.

---

### M7. `STRIPE_PRICE_ID` silently defaults to empty string
**Where:** `lib/stripe.ts:18`

```typescript
export const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID ?? ''
```

If unset, Stripe checkout fails with `"No such price: ''"` — a cryptic API error, not a clear startup/configuration error. Should throw on startup like the ElevenLabs webhook secret does.

---

### M8. Dead types from eliminated voice server
**Where:** `packages/shared/types.ts:9–18, 73–96`

`ConversationState` and `CallSession` are never imported anywhere in the codebase. They're from the DIY WebSocket voice server that was eliminated in v1.1. They'll confuse anyone onboarding to the codebase and create false expectations about how conversations are managed.

---

### M9. `DEFAULT_GREETINGS` missing `landscaping` trade
**Where:** `app/(onboarding)/onboarding/setup/page.tsx:27–36`

The setup page has `DEFAULT_GREETINGS` for `plumbing, hvac, electrical, roofing, pest_control, general` — but not `landscaping`. Falls back to `DEFAULT_GREETINGS.general` via `?? DEFAULT_GREETINGS.general`. Works but inconsistent with the trade list. A landscaping business gets the generic greeting preview during onboarding.

---

## 3. Minor — Cleanup, polish

### m1. `useEffect` missing dependencies in `number-view.tsx`
**Where:** `app/(onboarding)/onboarding/number/number-view.tsx:24`

```typescript
useEffect(() => {
  if (!existingNumber) { provisionNumber() }
}, []) // ← existingNumber and provisionNumber should be in deps
```

React rules-of-hooks violation. Works because `existingNumber` only changes from the server on mount, but will warn in strict mode and is a lint error.

---

### m2. Login page doesn't handle `?error=auth_error`
**Where:** `app/(auth)/login/page.tsx`, `app/auth/callback/route.ts:14`

Auth callback redirects to `/login?error=auth_error` on failure. Login page doesn't read URL params and shows nothing. Users who fail auth verification see a blank login form with no explanation.

---

### m3. Audio player race condition on fast double-click
**Where:** `components/audio-player.tsx:37–47`

`togglePlay()` is async. Rapid clicks load audio and toggle play state concurrently. State can desync. Minor UX bug but visible on slow connections.

---

### m4. `'unknown'` urgency is in types but never stored
**Where:** `packages/shared/types.ts:3`, `app/api/webhook/elevenlabs/route.ts:244–247`

`Urgency` type includes `'unknown'` and the DB schema allows it, but the ElevenLabs webhook normalizes any unknown value to `'routine'`. The call log table has a filter option... that will never match anything. Dead filter value.

---

### m5. `createAdminClient()` wires cookie store unnecessarily
**Where:** `lib/supabase/server.ts:31–55`, `app/api/calls/[id]/audio/route.ts:29`

`createAdminClient` is used for service-role Supabase operations but still wires up cookie handling. Not harmful, but wasteful in API route contexts and could cause confusion about why an admin client reads cookies.

---

### m6. Provision endpoint returns ElevenLabs technical jargon in API response
**Where:** `app/api/onboarding/provision/route.ts:60–68, 72–83`

The response includes:
```json
{
  "elevenlabsSetupRequired": true,
  "manualStep": "Import this number in ElevenLabs dashboard...",
  "nextStep": ["1. Go to ElevenLabs Dashboard → Telephony..."]
}
```

`number-view.tsx` correctly ignores these fields. But they're in the response body — a future dev could accidentally display them to customers. Exposes internal architecture. Remove or gate behind an internal flag.

---

### m7. Twilio voice webhook: `timezone` hardcoded despite DB having the column
**Where:** `app/api/webhook/twilio/voice/route.ts:173`

```typescript
// TODO: use business.timezone once `timezone TEXT DEFAULT 'America/Los_Angeles'` column is added
const timezone = 'America/Los_Angeles'
```

The migration already added the column. The TODO is stale. This is a one-line fix now, not a future task.

---

## 4. Extensibility Notes

### E1. Trades defined in 4 places — adding a trade touches all of them
`packages/shared/constants.ts` (TRADES array) → `packages/shared/types.ts` (Trade union type) → `apps/web/lib/utils.ts` (TRADE_LABELS) → `apps/web/app/(onboarding)/onboarding/setup/page.tsx` (DEFAULT_GREETINGS).

When "landscaping" or "general_contractor" gets added, someone will update 3 of these and miss one. Consolidate into shared constants; derive types and labels from the single source.

---

### E2. `select('*')` in 7 places = latent data leak risk
Every time a column is added to `businesses` or `calls`, it immediately gets returned to the frontend. Stripe IDs, internal flags, future sensitive fields — all leak automatically. The settings page and call log should select explicit column lists.

---

### E3. Business hours JSONB schema has no validation
The JSONB column accepts anything. If a client sends malformed hours, `isWithinBusinessHours()` will either silently fail (returning `false`, routing everything to AI) or throw. Consider a DB check constraint or Zod validation in the PATCH endpoint.

---

### E4. Timezone hardcoded to PST — national expansion is a code change
Related to m7. When a plumber in Miami signs up, their business hours will be evaluated in LA time. The DB column exists; the code just doesn't use it. Fix m7 and this is resolved.

---

### E5. One shared ElevenLabs agent — scaling to per-business agents requires architecture change
The variables endpoint lookup strategy (by `elevenlabs_agent_id`) only works when businesses have distinct agent IDs. Moving to per-business agents (mentioned as a future premium feature in the PRD) means changing how variables are fetched and how post-call webhooks identify businesses. The business lookup fallback logic in the ElevenLabs webhook (try `business_id` → fall back to `agent_id`) will need updating.

---

### E6. Call log has no pagination beyond the initial 25
`/api/calls` route supports `page` param. Dashboard page hardcodes page 0. No "Load more" or pagination UI exists. Fine for testing but will be a problem for any business with real call volume.

---

## 5. Verdict

**Not ready for live API key testing. Five blockers.**

| # | Blocker | Fix complexity |
|---|---------|---------------|
| C1 | Business hours UI not built | Medium — need a day/time picker component wired to PATCH |
| C2 | Variables endpoint can't ID business → generic greeting | Low — add twilio_call_sid → Twilio API → business lookup, or read stream params from ElevenLabs body |
| C3 | Payment failure doesn't stop service | Trivial — add `is_active: false` to one update call |
| C4 | `NEXT_PUBLIC_APP_URL` missing from env example | Trivial — one line |
| C5 | Missing `/api/webhook/twilio/status` route | Low — create a stub that returns 200 for now |

C3, C4, C5 are under 30 minutes combined. C1 is a day of work. C2 needs clarity on what ElevenLabs actually sends in the variables webhook body — check their docs first, then implement the twilio_call_sid fallback if needed.

After those 5 are fixed: run a real call, verify the greeting uses the correct business name, verify the SMS arrives, verify the dashboard populates. Everything else on this list is clean-up that can happen post-first-test without breaking the service.

The bones are good. Ship the fixes.
