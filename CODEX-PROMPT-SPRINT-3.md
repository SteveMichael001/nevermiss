# Codex Sprint 3 — Three Features

Read PRD.md first. Do not change design system (B&W Apple aesthetic). No style changes.

---

## Task 1: Dashboard Caller Profile — Hierarchy Fix

The call log table should lead with what matters most: who called and why.

**File: `apps/web/app/(dashboard)/dashboard/call-log-view.tsx`**
**File: `apps/web/components/call-log-table.tsx` (if it exists)**

Update call log rows so the visual hierarchy is:
- **Primary:** Caller name (bold, large) + caller phone number below it
- **Secondary:** Service needed (what they called about)
- **Tertiary:** Urgency badge + time ago
- Remove transcript from the table row entirely — it belongs in the detail view

**Call detail view — verify or build:**
When a user clicks a call row, they should see a detail panel or page with:
- Caller name, phone, service needed, urgency, preferred callback time
- Full transcript (readable, formatted — agent/user turns clearly distinguished)
- Audio player (if `recording_url` is set — use `/api/calls/[id]/audio` to get signed URL)
- Lead status selector (new / called back / booked / lost)

If a call detail view doesn't exist, create it at `apps/web/app/(dashboard)/dashboard/calls/[id]/page.tsx`. Make rows in the call log table link to `/dashboard/calls/[id]`.

---

## Task 2: Ring Preference Setting

Contractors should control when AI kicks in. This is a first-class settings feature.

### DB Migration
Create `supabase/migrations/002_ring_preference.sql`:
```sql
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS dial_timeout_seconds INTEGER DEFAULT 20;
COMMENT ON COLUMN businesses.dial_timeout_seconds IS 'Seconds to ring contractor phone before AI answers. 0 = AI always answers immediately.';
```

### Settings UI
**File: `apps/web/app/(dashboard)/dashboard/settings/settings-form.tsx`**

Add a "When should AI answer?" field with these options (radio or select):
- **AI always answers** (0s) — every call goes straight to AI
- **After 1 ring** (6s) — try your phone for one ring first
- **After 2 rings** (12s)
- **After 4 rings** (20s) — standard voicemail timing *(default)*

Wire to PATCH `/api/business` to save `dial_timeout_seconds`.

### Voice Webhook
**File: `apps/web/app/api/webhook/twilio/voice/route.ts`**

Update the business SELECT query to also fetch `dial_timeout_seconds`.

Update `twimlDial` to accept the timeout:
```typescript
function twimlDial(ownerPhone: string, appUrl: string, timeoutSeconds: number): string {
  if (timeoutSeconds === 0) return null // caller: use twimlElevenLabs instead
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial action="${appUrl}/api/webhook/twilio/dial-fallback" timeout="${timeoutSeconds}" method="POST">
    <Number>${ownerPhone}</Number>
  </Dial>
</Response>`
}
```

If `dial_timeout_seconds === 0` (AI always answers), skip the Dial entirely — go straight to ElevenLabs even during business hours.

---

## Task 3: Test Caller — One-Button End-to-End Test

Steve needs to trigger a realistic test call without picking up his phone every time.

### New API route
**File: `apps/web/app/api/test/trigger-call/route.ts`**

POST endpoint. Guard with a simple check: only allow in non-production OR if a `TEST_API_SECRET` header matches `process.env.TEST_API_SECRET`.

Body: `{ businessId?: string }` — if omitted, use the first active business in Supabase.

Logic:
1. Look up business (get `twilio_phone_number`)
2. Use Twilio to make an outbound call FROM `TWILIO_PHONE_NUMBER` TO `business.twilio_phone_number`
3. The call TwiML plays a realistic caller script using `<Say>`:

```
Hi, I found your number on Google. I'm hoping you can help — I've got a pipe leaking
under my kitchen sink and it's getting worse. My name is Alex Johnson and you can
reach me back at this number. I'd love to get someone out today or tomorrow if possible.
Thanks.
```

4. After the TwiML plays, hang up (`<Hangup/>`). The NeverMiss system will have heard a caller and processed it.

Return `{ success: true, callSid }` on success.

### Trigger button in settings
**File: `apps/web/app/(dashboard)/dashboard/settings/settings-form.tsx`**

Add a "Run test call" button at the bottom of the settings page (below all other settings). 
- Label: "Send a test call to my AI number"
- Small descriptive text: "Triggers a simulated inbound call to verify your setup is working."
- On click: POST to `/api/test/trigger-call`
- Show success: "Test call triggered — check your call log in ~60 seconds"
- Show error if it fails

---

## Output
- List every file changed
- Create migration file (don't run it — just create it)
- Save summary to `SPRINT-3-CHANGES.md` at repo root
- No new env vars needed except optional `TEST_API_SECRET` (document it)
