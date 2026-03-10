# NeverMiss AI — Code Audit V2
**Date:** March 5, 2026  
**Auditor:** Senior engineer post-architectural-rebuild review  
**Scope:** ElevenLabs webhook architecture (Deepgram replacement)  
**TypeScript:** `npx tsc --noEmit` exits 0 — **but the types are quietly wrong (see Critical #2)**

---

## 🔴 CRITICAL — Will break in production

### C1 — Wrong event type string: every real call silently skipped
**File:** `apps/web/app/api/webhook/elevenlabs/route.ts`, line 91

```typescript
if (payload.type !== 'conversation_ended') {
  return NextResponse.json({ success: true, skipped: true })
}
```

The actual ElevenLabs event type is **`post_call_transcription`**, not `conversation_ended`. Per the official spec:
```json
{ "type": "post_call_transcription", "event_timestamp": 1739537297, "data": { ... } }
```

This check will silently swallow every single legitimate webhook. ElevenLabs gets a `200` back (so it thinks delivery succeeded), but no call record is ever inserted and no SMS is ever sent. This is a complete, invisible production failure.

**Fix:** Change `'conversation_ended'` → `'post_call_transcription'`

---

### C2 — Wrong payload shape: all data fields in wrong location
**File:** `apps/web/app/api/webhook/elevenlabs/route.ts`, lines 93–113 + `ElevenLabsWebhookPayload` interface lines 10–38

The `ElevenLabsWebhookPayload` TypeScript interface is structurally wrong. The real ElevenLabs payload nests all conversation data under a `data` key:

```json
{
  "type": "post_call_transcription",
  "event_timestamp": 1739537297,
  "data": {
    "agent_id": "...",
    "conversation_id": "...",
    "transcript": [...],
    "metadata": { ... },
    "analysis": { ... },
    "conversation_initiation_client_data": { ... }
  }
}
```

The current code accesses `payload.agent_id`, `payload.transcript`, `payload.metadata`, `payload.analysis`, `payload.conversation_initiation_client_data` — all of which are `undefined` at runtime. The TS interface mirrors this flat structure, so TypeScript doesn't catch it. The code compiled clean (`tsc` exits 0) but would throw `TypeError: Cannot read properties of undefined` the moment the type-check fix (C1) allows a real event through.

**Fix:** Update the interface to wrap fields under `data: { ... }`, and update all field accesses accordingly (e.g., `payload.data.agent_id`, `payload.data.analysis`, etc.).

---

### C3 — Unhandled SMS throw crashes webhook after record is inserted
**File:** `apps/web/app/api/webhook/elevenlabs/route.ts`, line 163  
**File:** `apps/web/lib/notifications/sms.ts`, lines 52–54

```typescript
// sms.ts — throws if env vars missing
if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
  throw new Error('Twilio env vars not configured...')
}

// route.ts — no try/catch, call already inserted at this point
const smsResult = await sendLeadSMS({ ... })
```

If Twilio env vars are missing or misconfigured, `sendLeadSMS` throws. The webhook handler has already inserted the call record at this point. The unhandled throw causes Next.js to return a 500. ElevenLabs retries the webhook. The retry hits the `twilio_call_sid UNIQUE NOT NULL` constraint, returns another 500, and ElevenLabs retries again. Per ElevenLabs' spec, webhooks are auto-disabled after 10 consecutive failures with no successful delivery — so this creates a permanent silent failure mode for every call after a Twilio misconfiguration.

**Fix:** Wrap `sendLeadSMS` in try/catch. Log the error and continue (the call record is saved; SMS failure shouldn't kill the webhook response). Return 200 regardless.

---

### C4 — `data_collection_results` null-unsafe
**File:** `apps/web/app/api/webhook/elevenlabs/route.ts`, lines 108–113

```typescript
const dataCollection = payload.analysis.data_collection_results
const callerName = dataCollection.caller_name?.value ?? null
```

The real ElevenLabs example shows `data_collection_results: {}` (empty object) when no data was collected. That's fine — optional chaining handles it. But if ElevenLabs sends `data_collection_results: null` (possible on `status: "error"` calls), line 109 throws `TypeError: Cannot read properties of null (reading 'caller_name')`. The TypeScript type doesn't mark this as nullable, so TS doesn't flag it. Combined with C2 (the whole `analysis` access is already broken), this is a second crash point once C2 is fixed.

**Fix:** `const dataCollection = payload.data.analysis?.data_collection_results ?? {}`

---

### C5 — Shared agent architecture breaks business lookup
**File:** `apps/web/app/api/webhook/elevenlabs/route.ts`, line 124  
**File:** `apps/web/app/api/webhook/elevenlabs/variables/route.ts`, line 40

```typescript
// route.ts
const { data: business } = await supabase
  .from('businesses')
  .eq('elevenlabs_agent_id', agentId)
  .single()
```

The PRD explicitly states "one agent serves all contractors" via dynamic variables. If this is true, every business shares the same `elevenlabs_agent_id`. The `.single()` call fails with `PGRST116` ("JSON object requested, multiple (or no) rows returned") and returns `bizError` for every call after the first business is created.

The variables endpoint already injects `business_id` as a dynamic variable. The post-call payload echoes it back in `conversation_initiation_client_data.dynamic_variables.business_id`. The handler extracts it (`dynamicVars.business_id`) but **never uses it** — it ignores the `business_id` and goes straight to agent_id lookup.

**Fix:** In the post-call handler, look up by `dynamicVars.business_id` when present (single-agent flow). Fall back to `elevenlabs_agent_id` only for per-business agent setups. Same fix needed in the variables endpoint — but that endpoint doesn't have `business_id` yet (chicken-and-egg). The cleanest fix is to include a query param or custom header in the variables request URL that embeds business identity.

---

### C6 — `ELEVENLABS_WEBHOOK_SECRET` env var not in project config
**File:** PRD Section 12, `.env.example` (not audited but implied to follow PRD)

The webhook handler requires `ELEVENLABS_WEBHOOK_SECRET`:
```typescript
const webhookSecret = process.env.ELEVENLABS_WEBHOOK_SECRET
if (!webhookSecret) {
  throw new Error('ELEVENLABS_WEBHOOK_SECRET env var is not set')
}
```

This env var is **not listed** in the PRD's Section 12 environment variables. If someone provisions from the PRD, every webhook request throws a 500 before doing anything. The error is unhandled (throws in handler body), so Vercel logs will show unformatted stack traces with no context.

**Fix:** Add `ELEVENLABS_WEBHOOK_SECRET` to PRD Section 12 and `.env.example`.

---

## 🟠 MAJOR — Bad behavior under real conditions

### M1 — Webhook retries will permanently fail due to UNIQUE constraint
**File:** `apps/web/app/api/webhook/elevenlabs/route.ts`, line 133  
**File:** `supabase/migrations/001_initial_schema.sql`, line 29

ElevenLabs retries webhooks on non-2xx responses. The `calls` table has `twilio_call_sid TEXT UNIQUE NOT NULL`. If the first webhook delivery fails after the insert (e.g., SMS throws per C3), the retry hits the UNIQUE constraint, gets a 500, and will keep retrying until ElevenLabs auto-disables the webhook.

There's no `ON CONFLICT DO NOTHING` / `DO UPDATE` on the insert. First insert succeeds, all retries fail permanently.

**Fix:** Either use `upsert` with `onConflict: 'twilio_call_sid'` and `ignoreDuplicates: true`, or check for existence before insert and return 200 if already processed (idempotency pattern).

---

### M2 — Variables endpoint has zero authentication
**File:** `apps/web/app/api/webhook/elevenlabs/variables/route.ts`

The post-call webhook validates HMAC signatures. The variables endpoint — called before every conversation — has **no authentication at all**. Anyone who discovers the URL can POST `{ "agent_id": "abc" }` and enumerate business names, owner names, trades, and business IDs for every client in the database. The `business_id` (UUID) returned here is used downstream to look up full records.

This is a recon vector: an attacker can iterate agent IDs or use the real agent ID (which is public in the ElevenLabs dashboard) to harvest all business metadata.

**Fix:** Validate ElevenLabs signature on the variables endpoint too, or at minimum add a shared secret query param / header that ElevenLabs can be configured to send.

---

### M3 — Provision endpoint unhandled exceptions expose stack traces
**File:** `apps/web/app/api/onboarding/provision/route.ts`, lines 51–76

```typescript
const available = await client.availablePhoneNumbers('US').local.list({ ... })
// ...
const purchased = await client.incomingPhoneNumbers.create({ ... })
```

Neither Twilio call is wrapped in try/catch. Network failures, auth errors, or Twilio API errors will throw unhandled, bubbling up as 500s with raw stack traces in Vercel logs — and potentially in the JSON response body depending on Next.js error handling mode. No logging either, so production debugging is blind.

**Fix:** Wrap both Twilio calls in try/catch, log the error with context, return a structured `{ error: 'Failed to provision number', details: ... }` response.

---

### M4 — `elevenlabs_conversation_id` column on `businesses` table is wrong
**File:** `supabase/migrations/001_initial_schema.sql`, line 88

```sql
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS elevenlabs_conversation_id TEXT;
```

A business has many conversations. This column is overwritten on every call and is meaningless. It's probably a copy-paste error from the `calls` table migration. It's not written by any current code (the webhook handler only writes `elevenlabs_conversation_id` to `calls`), so it sits there as dead schema that will confuse future developers.

**Fix:** Drop from the migration. It has no use.

---

### M5 — `notification_latency_ms` never populated
**File:** `supabase/migrations/001_initial_schema.sql`, line 48  
**File:** `apps/web/app/api/webhook/elevenlabs/route.ts`

The schema defines `notification_latency_ms INT` on the `calls` table (a key product metric per the PRD — "SMS delivered within 60 seconds of call end"). Nothing ever writes to it. The call start time is available in `metadata.start_time_unix_secs`, the SMS sentAt is captured — but the latency is never computed or stored.

**Fix:** After SMS send, compute `Date.now() - (payload.data.metadata.start_time_unix_secs * 1000)` and include in the `sms_sent_at` update.

---

### M6 — SMS module-level Twilio client creates new instance per request
**File:** `apps/web/lib/notifications/sms.ts`, line 51

```typescript
export async function sendLeadSMS(params: SendLeadSMSParams): Promise<SendLeadSMSResult> {
  // ...
  const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
```

A new Twilio client is instantiated on every call. This isn't catastrophic but it means no connection reuse, and the env var check happens per-call not at module load. The module-level constants are read once, but the client is re-created. In a high-throughput scenario this is wasteful.

**Fix:** Move client instantiation to module level (after env var validation).

---

## 🟡 MINOR — Tech debt, cleanup needed

### m1 — Signature header split doesn't handle `=` in values robustly
**File:** `apps/web/app/api/webhook/elevenlabs/route.ts`, lines 50–52

```typescript
const parts = Object.fromEntries(
  signatureHeader.split(',').map((part) => part.split('=') as [string, string])
)
```

`part.split('=')` produces more than 2 elements if the value contains `=` (e.g., base64-encoded HMAC). The `as [string, string]` cast silently truncates; `Object.fromEntries` uses only the first two array elements. ElevenLabs uses hex-encoded HMAC-SHA256 (no `=` in output), so this works today. But if ElevenLabs changes encoding or if this pattern is reused elsewhere, it silently truncates values.

**Fix:** Use `const eqIdx = part.indexOf('='); return [part.slice(0, eqIdx), part.slice(eqIdx + 1)]` instead of `split('=')`.

---

### m2 — `sentAt` records attempt time, not delivery time
**File:** `apps/web/lib/notifications/sms.ts`, line 67

```typescript
const sentAt = new Date()  // set BEFORE API calls
```

`sentAt` is captured before the Twilio API calls begin. For a call going to 3 recipients with slow Twilio responses, the recorded time is up to several seconds early. Minor semantic inaccuracy but could mislead latency analysis.

---

### m3 — ElevenLabs official SDK not used; manual HMAC reimplementation is fragile
**File:** `apps/web/app/api/webhook/elevenlabs/route.ts`, lines 42–74  
**File:** `apps/web/package.json`

The `@elevenlabs/elevenlabs-js` SDK provides `webhooks.constructEvent()` which handles signature verification, timestamp validation, and payload parsing. Per the official docs:

> "The ElevenLabs SDK provides a constructEvent method that handles signature verification, timestamp validation, and payload parsing."

The codebase reimplements all of this manually using `crypto.subtle`. The manual implementation is the proximate cause of bugs C1 and C2 — if the SDK were used, the correct type definitions and event structure would be pulled in automatically.

`@elevenlabs/elevenlabs-js` is not in `package.json` at all.

**Fix:** `npm install @elevenlabs/elevenlabs-js`, replace the manual HMAC block with `elevenlabs.webhooks.constructEvent(rawBody, signatureHeader, secret)`.

---

### m4 — `transcript_summary` from ElevenLabs analysis not stored
**File:** `apps/web/app/api/webhook/elevenlabs/route.ts`

The real ElevenLabs payload includes `data.analysis.transcript_summary` — a ready-made AI summary of the call. This is free data that the code ignores entirely. The PRD calls for a Claude Haiku post-call extraction that would need to do this same work.

**Fix:** Add `transcript_summary TEXT` to the `calls` schema and store it from the webhook payload. Eliminates the need for a separate LLM extraction call for the summary use case.

---

### m5 — No RLS policy for call `INSERT` (service role only)
**File:** `supabase/migrations/001_initial_schema.sql`, lines 111–117

```sql
CREATE POLICY "Users can view own calls" ON calls FOR SELECT ...
CREATE POLICY "Users can update own calls" ON calls FOR UPDATE ...
-- No INSERT policy for authenticated users
```

Authenticated users have no INSERT policy on calls (only service role does). This is intentional for the webhook flow but means a future client-side test-call feature couldn't insert a test record without going through the service role. Not a current bug, but worth noting for future work.

---

### m6 — `FROM_EMAIL` and `DASHBOARD_URL` not in env var list
**File:** `apps/web/lib/notifications/email.ts`, lines 4–5

```typescript
const FROM_EMAIL = process.env.FROM_EMAIL ?? 'NeverMiss AI <notifications@nevermiss.ai>'
const DASHBOARD_URL = process.env.DASHBOARD_URL ?? 'https://app.nevermiss.ai'
```

These have hardcoded defaults. Fine for now, but `notifications@nevermiss.ai` is a hardcoded domain that needs to be verified in Resend before emails will deliver. If the domain isn't set up, all emails silently fail. Neither var is in the PRD env list.

---

### m7 — `any` types — none found
TypeScript strict mode is on, `tsc --noEmit` exits 0, and no explicit `any` types were found in the audited files. The type issues are incorrect interface definitions (C2), not `any` usage.

---

## Verdict

**Not production-ready. Two of the critical bugs (C1 + C2) mean the system is architecturally broken at the seam — zero calls will ever be processed.**

**Minimum to unblock production:**

| # | Fix | Effort |
|---|-----|--------|
| C1 | Change `'conversation_ended'` → `'post_call_transcription'` | 1 min |
| C2 | Rewrite `ElevenLabsWebhookPayload` interface, add `data` wrapper, update all field accesses | 30 min |
| C3 | Wrap `sendLeadSMS` call in try/catch, return 200 regardless | 10 min |
| C4 | Null-guard `data_collection_results` | 2 min |
| C5 | Use `business_id` from dynamic vars for lookup, not `agent_id` (for shared-agent arch) | 20 min |
| C6 | Add `ELEVENLABS_WEBHOOK_SECRET` to `.env.example` and PRD | 2 min |

After those fixes, address M1 (idempotent inserts), M2 (variables endpoint auth), and M3 (provision error handling) before taking live traffic.

**Strongly recommended:** Add `@elevenlabs/elevenlabs-js` and use the SDK's `constructEvent()` instead of the manual HMAC implementation. Would have prevented C1 and C2 entirely.
