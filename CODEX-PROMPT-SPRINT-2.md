# Codex Task: NeverMiss Sprint 2 — Four Focused Fixes

## Context
- Monorepo: `~/Projects/nevermiss/`, web app at `apps/web/`
- Stack: Next.js 14, Supabase, Twilio, ElevenLabs, Stripe, Vercel
- PRD: `PRD.md` — read first
- Design system: Apple-style B&W. Do NOT change any styles.

---

## Task 1: Post-Payment → Welcome SMS + Calendar Link

**Why:** After a contractor pays, they need to book a setup call with Steve. This is how they learn to forward their existing business number to their NeverMiss number. Without this step, they're stuck.

**Calendly link:** `https://calendly.com/stevenchranowski3/nevermissonboarding`

### What to build:

**File: `apps/web/app/api/webhook/stripe/route.ts`**

In the `checkout.session.completed` handler, after updating the business record to `is_active: true`, look up the full business record (name, owner_phone, owner_name, twilio_phone_number) and send a welcome SMS using the existing `sendLeadSMS`-style pattern (use `lib/notifications/sms.ts` as reference for Twilio client setup).

Welcome SMS content:
```
Welcome to NeverMiss, [owner_name]! 🎉

Your AI number is ready: [twilio_phone_number formatted]

Book your free 10-min setup call with Steve and you'll be live same day:
https://calendly.com/stevenchranowski3/nevermissonboarding

- The NeverMiss Team
```

**File: `apps/web/app/(onboarding)/onboarding/complete/page.tsx`**

Add a prominent "Book your setup call" section below the existing success content. Show:
- Heading: "One last step — book your setup call"
- Body: "Steve will walk you through the 2-minute forwarding setup. You'll be live same day."
- Button linking to `https://calendly.com/stevenchranowski3/nevermissonboarding` (opens in new tab)
- Keep the existing B&W design system. The button should match the existing black CTA button style.

---

## Task 2: Dial-Fallback — AI Catches Missed Calls During Business Hours

**Why:** Right now if a contractor misses a call during business hours (they're on a job, can't pick up), the call dies. AI should catch it.

### What to build:

**File: `apps/web/app/api/webhook/twilio/voice/route.ts`**

In the `twimlDial` function, add an `action` attribute pointing to `/api/webhook/twilio/dial-fallback` and a `timeout` of 20 seconds (4-5 rings):

```typescript
function twimlDial(ownerPhone: string, appUrl: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial action="${appUrl}/api/webhook/twilio/dial-fallback" timeout="20" method="POST">
    <Number>${ownerPhone}</Number>
  </Dial>
</Response>`
}
```

Update the call to `twimlDial` to pass `appUrl` (already available in the route handler).

**New file: `apps/web/app/api/webhook/twilio/dial-fallback/route.ts`**

Handles the case where the contractor didn't answer during business hours. Twilio POSTs here with `DialCallStatus` after the `<Dial>` attempt.

Logic:
- If `DialCallStatus === 'completed'` → contractor answered, do nothing, return empty TwiML `<Response/>`
- If `DialCallStatus` is anything else (`no-answer`, `busy`, `failed`, `canceled`) → connect to ElevenLabs AI

Reuse the same `twimlElevenLabs` function from voice/route.ts (extract it to a shared util or copy it). Needs access to `ELEVENLABS_AGENT_ID` env var.

Parse the POST body for: `DialCallStatus`, `To`, `From`, `CallSid`.

Always return 200 — same pattern as other Twilio webhooks.

---

## Task 3: Recording Pipeline

**Why:** ElevenLabs captures audio for every call. We have `recording_url` and a Supabase `recordings` bucket already in the schema. We just need to fetch and store it.

### What to build:

**File: `apps/web/app/api/webhook/elevenlabs/route.ts`**

After successfully inserting the call record (step 7), add a fire-and-forget recording fetch:

```typescript
// Fire and forget — don't block SMS/email on recording fetch
fetchAndStoreRecording(conversation_id, callId, supabase).catch(err =>
  console.error('[elevenlabs-webhook] Recording fetch failed (non-fatal):', err)
)
```

**New file: `apps/web/lib/recordings.ts`**

```typescript
export async function fetchAndStoreRecording(
  conversationId: string,
  callId: string,
  supabase: ReturnType<typeof createClient>
): Promise<void>
```

Implementation:
1. Fetch audio from ElevenLabs: `GET https://api.elevenlabs.io/v1/convai/conversations/${conversationId}/audio` with `xi-api-key` header using `ELEVENLABS_API_KEY` env var
2. If response is not ok, log and return (non-fatal)
3. Get the audio buffer
4. Upload to Supabase storage bucket `recordings` at path `${callId}.mp3`
5. Get the public URL (or signed URL if bucket is private — it is private, so use `createSignedUrl` with 1 year expiry... actually just store the path and generate signed URLs on demand. Store the storage path, not a URL.)
6. Update the calls table: `recording_url = storage_path` where `id = callId`

Note: The `recordings` bucket is private. Store the storage object path (e.g., `recordings/${callId}.mp3`) in `recording_url`. The existing `/api/calls/[id]/audio` route should handle generating a signed URL when the dashboard requests it — check that route and wire it up if it isn't already.

**File: `apps/web/app/api/calls/[id]/audio/route.ts`**

Verify this route exists and generates a signed URL from the stored path. If it's a stub or broken, fix it. It should:
1. Auth check — user must own the business that owns the call
2. Get `recording_url` (storage path) from calls table
3. Generate a 1-hour signed URL from Supabase storage
4. Return `{ url: signedUrl }`

---

## Task 4: Update PRD

**File: `PRD.md`**

Update section 6 (User Flows) to reflect the actual 5-step onboarding:
1. Business Setup
2. Phone Number
3. Test Call
4. Payment
5. Complete → Book Setup Call

Update section 10 (Current Blockers) — remove "Number provisioning — Manual setup per customer" since it's now self-serve. Add "Setup call booking — manual (Steve does setup calls personally for now)".

---

## Output Requirements

1. List every file changed with a one-line description
2. Note anything that needs a new env var (there shouldn't be any — all needed vars exist)
3. Do NOT change any UI styles, colors, or design
4. Do NOT modify the ElevenLabs agent configuration
5. Do NOT modify the Supabase schema (recording columns already exist)
6. Save a brief summary to `SPRINT-2-CHANGES.md` at repo root
