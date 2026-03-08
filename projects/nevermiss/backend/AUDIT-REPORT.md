# NeverMiss Backend Audit Report
**Date:** March 7, 2026  
**Auditor:** Maggie (subagent)  
**Scope:** Full call lifecycle — ElevenLabs → webhook → Supabase → SMS/Email notifications  
**Branch:** `main` | **Commit at audit start:** `90d75b3`

---

## TL;DR

Three root causes explain why calls aren't logging and notifications aren't sending:

| # | Issue | Status |
|---|-------|--------|
| 🔴 **ROOT-1** | `post_call_webhook_id: null` — ElevenLabs never fired the post-call webhook | ✅ **FIXED via API** |
| 🔴 **ROOT-2** | `RESEND_API_KEY="your_resend_key_here"` — placeholder in Vercel production | ❌ **MANUAL ACTION REQUIRED** |
| 🟡 **ROOT-3** | Trailing `\n` in all Vercel env vars — would cause Twilio SMS auth failures | ✅ **MITIGATED in code** |
| 🟡 **ROOT-4** | `preferred_callback` missing from ElevenLabs data_collection config | ✅ **FIXED via API** |

---

## Full Call Lifecycle Trace

```
Caller dials +16196482491
    ↓
Twilio → POST /api/webhook/twilio/voice
    ↓
Route checks business_hours → is_active → routes to ElevenLabs
    ↓
ElevenLabs → GET /api/webhook/elevenlabs/variables   (pre-call)
    ↓  returns business_name, owner_name, trade, business_id
Sarah answers, collects: name, issue, phone
    ↓
Call ends
    ↓
ElevenLabs → POST /api/webhook/elevenlabs            (post-call)
    ↓
Webhook: insert to calls table → send SMS → send email
```

---

## Issue 1: post_call_webhook_id Was Null (ROOT CAUSE #1 — FIXED)

**What broke:** ElevenLabs workspace had a webhook registered (`84eee00618ed415a8843e43495d3988d`, name "NeverMiss Post-Call", URL: `https://nevermiss-delta.vercel.app/api/webhook/elevenlabs`) but it was **never assigned to the agent**. The agent's `workspace_overrides.webhooks.post_call_webhook_id` was `null`.

**Effect:** ElevenLabs completed every call and discarded the conversation data. Nothing ever hit our webhook. Zero rows in `calls` table. Zero notifications.

**Fix applied:**
```bash
PATCH https://api.elevenlabs.io/v1/convai/agents/agent_0201kk1w0yzsf6vv5aqnkcpmh6wm
{
  "platform_settings": {
    "workspace_overrides": {
      "webhooks": {
        "post_call_webhook_id": "84eee00618ed415a8843e43495d3988d",
        "events": ["transcript"],
        "send_audio": false
      }
    }
  }
}
```

**Verified:** After PATCH, agent config shows `post_call_webhook_id: "84eee00618ed415a8843e43495d3988d"`. ✅

---

## Issue 2: RESEND_API_KEY is a Placeholder (ROOT CAUSE #2 — MANUAL ACTION REQUIRED)

**What broke:** Vercel production env var `RESEND_API_KEY` is set to `your_resend_key_here`. This is literally a placeholder string. Every email attempt throws `Error: RESEND_API_KEY env var is not set`... actually no — it won't throw, it'll call `new Resend("your_resend_key_here")` and get an API auth error from Resend.

**Evidence:**
```
RESEND_API_KEY="your_resend_key_here\n"   ← from vercel env pull (production)
```

The `email.ts` module also warns at startup:
```typescript
if (!RESEND_API_KEY) {
  console.warn('[Email] RESEND_API_KEY not set — email notifications will fail at runtime')
}
```
But the check is `!RESEND_API_KEY` — since the placeholder is a truthy string, this won't warn. It'll silently fail at runtime.

**Fix required (manual):**
1. Create a Resend account at https://resend.com if you don't have one
2. Get an API key from Resend dashboard
3. Run: `vercel env rm RESEND_API_KEY production` then `vercel env add RESEND_API_KEY production`
4. Paste the real key (no trailing newline)
5. Redeploy: `vercel --prod`

**Also:** Verify the `FROM_EMAIL` env var is set. Currently defaults to `NeverMiss AI <notifications@nevermiss.ai>`. You need to verify `nevermiss.ai` domain in Resend first, or use `onboarding@resend.dev` for testing.

---

## Issue 3: Trailing Newlines in ALL Vercel Env Vars (ROOT CAUSE #3 — MITIGATED)

**What broke:** Every env var in Vercel production has a trailing `\n`. Confirmed via `vercel env pull`:
```
TWILIO_ACCOUNT_SID="ACe018c9071839ac6c12239c1b3df1a807\n"
TWILIO_AUTH_TOKEN="REDACTED_ROTATED_TOKEN\n"
TWILIO_PHONE_NUMBER="+16196482491\n"
ELEVENLABS_AGENT_ID="agent_0201kk1w0yzsf6vv5aqnkcpmh6wm\n"
NEXT_PUBLIC_SUPABASE_URL="https://fibauzdvzkfevabxyhkt.supabase.co\n"
```

These were likely set via copy-paste with trailing newlines in the Vercel dashboard.

**Effect on SMS:** `twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)` would receive auth token with a trailing newline character, causing HMAC authentication failures. SMS would fail with `401 Unauthorized` or similar Twilio error.

**Effect on Supabase:** `createClient(url\n, key\n)` would fail to construct the URL properly, causing all DB operations to fail.

**Fix applied (code, commit `ea87cc0`):**
- `sms.ts`: Added `.trim()` to all three Twilio env var reads
- `elevenlabs/route.ts`: Added `.trim()` to Supabase URL and key in `getSupabaseAdmin()`

**Fix also required (manual — complete the fix):**
Re-set ALL env vars in Vercel without trailing newlines:
```bash
vercel env rm TWILIO_ACCOUNT_SID production && vercel env add TWILIO_ACCOUNT_SID production
vercel env rm TWILIO_AUTH_TOKEN production && vercel env add TWILIO_AUTH_TOKEN production
vercel env rm TWILIO_PHONE_NUMBER production && vercel env add TWILIO_PHONE_NUMBER production
vercel env rm NEXT_PUBLIC_SUPABASE_URL production && vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env rm SUPABASE_SERVICE_ROLE_KEY production && vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env rm ELEVENLABS_AGENT_ID production && vercel env add ELEVENLABS_AGENT_ID production
vercel env rm ELEVENLABS_API_KEY production && vercel env add ELEVENLABS_API_KEY production
vercel env rm ELEVENLABS_WEBHOOK_SECRET production && vercel env add ELEVENLABS_WEBHOOK_SECRET production
```
The code-level `.trim()` mitigates this, but clean values in Vercel is the right fix.

---

## Issue 4: `preferred_callback` Missing from ElevenLabs Data Collection (ROOT CAUSE #4 — FIXED)

**What broke:** The webhook code reads `data.analysis.data_collection_results.preferred_callback?.value`. But the ElevenLabs data_collection config had `caller_phone` (not `preferred_callback`) for the callback phone field. Result: `preferred_callback` was always `'unknown'` in every call record — Sarah was asking for the callback phone and collecting it, but it was being dropped.

**Old data_collection fields:** `caller_name`, `caller_phone`, `service_needed`, `urgency`  
**New data_collection fields:** `caller_name`, `preferred_callback`, `service_needed`, `urgency`

**Fix applied (via ElevenLabs API):** Replaced `caller_phone` with `preferred_callback` in `platform_settings.data_collection`. The description "The phone number the caller provided for callback" is preserved.

**Additional code fix (commit `ea87cc0`):** Added fallback in webhook:
```typescript
const preferredCallback = dcr.preferred_callback?.value 
  ?? (dcr as Record<string, DataCollectionResult | undefined>).caller_phone?.value 
  ?? 'unknown'
```

---

## Fixes Made

### API Changes (immediate, no deploy required)
1. ✅ **`post_call_webhook_id`** set to `84eee00618ed415a8843e43495d3988d` on agent `agent_0201kk1w0yzsf6vv5aqnkcpmh6wm`
2. ✅ **`preferred_callback`** added to ElevenLabs data_collection (replacing `caller_phone`)

### Code Fixes (commit `ea87cc0`, pushed to main)
3. ✅ `sms.ts`: `.trim()` on `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
4. ✅ `elevenlabs/route.ts`: `.trim()` on Supabase URL and service role key
5. ✅ `elevenlabs/route.ts`: `preferred_callback` fallback to `dcr.caller_phone`

---

## Remaining Blockers (Manual Action Required)

### BLOCKER 1: Set a real RESEND_API_KEY
```bash
# Remove placeholder
vercel env rm RESEND_API_KEY production

# Add real key (get from resend.com dashboard)
vercel env add RESEND_API_KEY production
# Paste your actual key when prompted

# Redeploy
git push  # triggers auto-deploy via Vercel
```

**Also verify:** The `FROM_EMAIL` env var or default `notifications@nevermiss.ai` is a verified sender in Resend. If domain isn't verified, use `onboarding@resend.dev` temporarily for testing.

### BLOCKER 2: Re-set Vercel env vars without trailing newlines
Current values all have trailing `\n`. While code now trims them, this is still a mess. Re-set cleanly (see Issue 3 for the full list of commands). Do this after fixing RESEND_API_KEY.

### BLOCKER 3: Redeploy after code push
The commit `ea87cc0` was pushed to `main`. Vercel should auto-deploy. Verify at https://vercel.com/stevenchranowski3-gmailcoms-projects/nevermiss/deployments that the deploy succeeded and the build used the latest commit.

---

## State of Things

### What's Working ✅
- Twilio number `+16196482491` → routes calls to ElevenLabs
- ElevenLabs variables webhook → looks up business by `called_number` → personalizes Sarah's greeting
- Sarah (voice agent) → collects name, issue, phone, urgency
- Business record exists in Supabase with all required fields populated
- Post-call webhook endpoint code is solid (HMAC validation, 3-fallback business lookup, proper insert logic)

### What's Broken ❌
- Email notifications (RESEND_API_KEY placeholder) — **zero emails sent ever**
- Possible SMS failures (trailing newline auth issue — mitigated in code, needs env var fix)
- Historical call data — calls table is empty because webhook was never firing

### What Will Work After Fixes ✅
After fixing RESEND_API_KEY and redeploying:
1. Make a test call to `+16196482491`
2. Verify Vercel function logs show `[elevenlabs-webhook] Incoming payload:` 
3. Verify Supabase `calls` table shows a new row
4. Verify SMS arrives at `+16099771254`
5. Verify email arrives at `steve@bridgesourceconsulting.com`

---

## Secondary Issues (Non-Blocking for First Test)

These are from the previous audit (`FINAL-AUDIT.md`) and remain unresolved. Don't block on these for the first end-to-end test.

| Issue | Impact | Effort |
|-------|--------|--------|
| Business hours UI not built | All calls go to AI 24/7; in-hours forwarding dead | Medium |
| `invoice.payment_failed` doesn't deactivate business | Revenue leak on failed payments | Trivial |
| Call log filters are client-side (25 call limit) | Hidden older results | Low |
| `timezone` hardcoded to PST despite DB column existing | Wrong hours for non-PST businesses | Trivial |
| `/api/business` GET leaks Stripe IDs | Security | Low |
| Notification phones/emails UI missing from settings | Can't add more recipients | Medium |

---

## Webhook Health Check

To verify the webhook is firing after next test call, check Vercel function logs:
```
vercel logs --project nevermiss --since 1h | grep elevenlabs-webhook
```

Or check ElevenLabs webhook delivery status at:
`https://elevenlabs.io/app/conversational-ai → Settings → Webhooks → NeverMiss Post-Call → Recent deliveries`

---

*Audit complete. Primary blockers are now fixed or documented. Make the test call once RESEND_API_KEY is real.*
