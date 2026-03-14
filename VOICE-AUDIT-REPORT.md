# NeverMiss Voice Call Audit Report

**Date:** 2026-03-11
**Auditor:** Claude Opus 4.6
**Phone Number:** +16196482491
**ElevenLabs Agent:** agent_0201kk1w0yzsf6vv5aqnkcpmh6wm (NeverMiss / Sarah)

---

## Root Cause (Primary)

**The Twilio Voice URL was changed from the app's webhook to ElevenLabs' native endpoint during debugging, and TWO separate issues prevent calls from working in either configuration.**

### Issue 1: ElevenLabs Native Endpoint — Broken by Agent Config Change

**Current Twilio Voice URL:** `https://api.us.elevenlabs.io/twilio/inbound_call`

This endpoint returns TwiML like:
```xml
<Connect>
  <Stream track="inbound_track" url="wss://api.us.elevenlabs.io/v1/convai/conversation">
    <Parameter name="conversation_id" value="conv_..." />
  </Stream>
</Connect>
```

**This worked on Sunday March 8** (48-second call, `CA5dad722e...`). **It now fails on Thursday March 12** (all calls 0 seconds).

**What changed:** The ElevenLabs agent was updated at Unix timestamp 1772935320 (~March 12, 00:55 UTC) — 2 minutes before the first failing call. The agent now has:

```json
"overrides": {
  "enable_conversation_initiation_client_data_from_webhook": true
}
"workspace_overrides": {
  "conversation_initiation_client_data_webhook": null
}
```

The agent expects dynamic variables from a webhook before initializing each conversation, but **no webhook URL is configured**. This causes conversation initialization to fail silently — the WebSocket opens but ElevenLabs can't start the conversation, so it closes immediately. Evidence:

| Call | Date | Request Duration | Call Duration | Status |
|------|------|-----------------|---------------|--------|
| CA5dad... (Sunday) | Mar 8 01:00 | **2682ms** | **48 sec** | Working |
| CAaf8e... (Thursday) | Mar 12 01:42 | **193ms** | **0 sec** | Failed |

The Sunday call took 2.7s to respond (ElevenLabs properly initialized the conversation). The Thursday call returned in 193ms (conversation created but never initialized).

### Issue 2: App Webhook — Wrong WebSocket Domain (Previously)

When the Voice URL was set to `https://nevermiss-delta.vercel.app/api/webhook/twilio/voice`, calls failed for **two different reasons** at different times:

**Calls at 00:57, 01:17:28, 01:17:37** — Returned `twimlError()`:
```xml
<Say>We're sorry, we're experiencing technical difficulties. Please call back shortly.</Say><Hangup/>
```
Cause: Either Twilio signature validation failure (URL mismatch in `getAppUrl()`) or a deployment still in progress with missing env vars.

**Call at 01:22** — Returned correct TwiML but with **wrong WebSocket domain**:
```xml
<Stream url="wss://api.elevenlabs.io/v1/convai/twilio?agent_id=agent_0201kk1w0yzsf6vv5aqnkcpmh6wm">
```
This used `api.elevenlabs.io` (global) instead of `api.us.elevenlabs.io` (US region). The agent is registered in the US region, so the WebSocket connection failed. **Result: 0 seconds duration.**

The original commit (`922d717`) hardcoded `wss://api.elevenlabs.io` (non-US). The current HEAD commit (`5b4317c`) correctly uses `wss://api.us.elevenlabs.io` in `apps/web/lib/twilio/voice.ts`:
```ts
<Stream url="wss://api.us.elevenlabs.io/v1/convai/twilio?agent_id=${agentId}">
```
**This fix has never been tested** because the Voice URL was switched to ElevenLabs native before this deployment was tried.

---

## Complete Call Timeline

| # | Time (UTC) | SID | Voice URL | Response | Duration | Notes |
|---|-----------|-----|-----------|----------|----------|-------|
| 1 | Mar 8 01:00 | CA5dad... | ElevenLabs native | Stream → conversation WS | **48 sec** | WORKED |
| 2 | Mar 8 01:38 | CAe555... | ElevenLabs native | (unknown) | 3 sec | Short |
| 3 | Mar 9 20:30 | CA64a3... | ElevenLabs native | Stream → conversation WS | 1 sec | Failing starts |
| 4 | Mar 12 00:57 | CAfad7... | **App webhook** | **twimlError()** | 5 sec | Error msg played |
| 5 | Mar 12 01:17 | CA674f... | App webhook | twimlError() | 1 sec | |
| 6 | Mar 12 01:17 | CAf879... | App webhook | twimlError() | 3 sec | Error msg played |
| 7 | Mar 12 01:22 | CAedc4... | App webhook | Stream → **api.elevenlabs.io** (wrong!) | **0 sec** | Wrong WS domain |
| 8 | Mar 12 01:27 | CA6570... | (unknown) | (unknown) | 0 sec | Status: busy |
| 9 | Mar 12 01:37 | CA5115... | ElevenLabs native | Stream → conversation WS | 0 sec | Agent misconfigured |
| 10 | Mar 12 01:42 | CAaf8e... | ElevenLabs native | Stream → conversation WS | 0 sec | Agent misconfigured |

---

## Evidence Summary

### ElevenLabs Agent Config
- Agent is **active** (not archived, not blocked)
- `enable_conversation_initiation_client_data_from_webhook: true` — **expects webhook**
- `conversation_initiation_client_data_webhook: null` — **no webhook configured**
- Dynamic variable placeholders exist: `business_name`, `owner_name`
- Agent uses a workflow (multi-node: greeting → transfer/message/FAQ → wrap_up → end)
- Phone number `phnum_8301kk2295mdfv49d6evzzwdvg73` is linked, provider: twilio

### ElevenLabs Twilio Credentials
- `GET /v1/convai/twilio/accounts` returns **404 Not Found** — no Twilio credentials stored in ElevenLabs
- This doesn't affect the WebSocket stream approach (bidirectional audio over WS), but confirms ElevenLabs cannot make Twilio API calls

### ElevenLabs Webhooks
- Two post-call webhooks active (both point to `https://nevermiss-delta.vercel.app/api/webhook/elevenlabs`)
- Both are healthy (no recent failures)

### Twilio Phone Number Config
- Voice URL: `https://api.us.elevenlabs.io/twilio/inbound_call`
- Status Callback: `https://api.us.elevenlabs.io/twilio/status-callback`
- Voice Fallback URL: (empty)

### App Code (Current HEAD — 5b4317c)
- `apps/web/lib/twilio/voice.ts` — Correct WebSocket URL: `wss://api.us.elevenlabs.io/v1/convai/twilio?agent_id=...`
- `apps/web/app/api/webhook/twilio/voice/route.ts` — Complete routing logic (business hours → dial owner, otherwise → ElevenLabs AI)
- `apps/web/app/api/webhook/elevenlabs/variables/route.ts` — Dynamic variables endpoint ready for use

---

## Exact Fix Required

### Step 1: Fix ElevenLabs Agent Config (API call)

Set the `conversation_initiation_client_data_webhook` to the app's variables endpoint:

```bash
curl -X PATCH "https://api.elevenlabs.io/v1/convai/agents/agent_0201kk1w0yzsf6vv5aqnkcpmh6wm" \
  -H "xi-api-key: $ELEVENLABS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "platform_settings": {
      "workspace_overrides": {
        "conversation_initiation_client_data_webhook": "https://nevermiss-delta.vercel.app/api/webhook/elevenlabs/variables"
      }
    }
  }'
```

This gives ElevenLabs the webhook it needs to fetch dynamic variables (business_name, owner_name, trade) before each call — needed for both native and custom approaches.

### Step 2: Change Twilio Voice URL (API call or Twilio Console)

Point Twilio back to the app's webhook:

```bash
curl -X POST "https://api.twilio.com/2010-04-01/Accounts/ACe018c9071839ac6c12239c1b3df1a807/IncomingPhoneNumbers/PN079b449be23db0f391aeead6320168ee.json" \
  -u "ACe018c9071839ac6c12239c1b3df1a807:$TWILIO_AUTH_TOKEN" \
  -d "VoiceUrl=https://nevermiss-delta.vercel.app/api/webhook/twilio/voice" \
  -d "VoiceMethod=POST" \
  -d "StatusCallback=https://nevermiss-delta.vercel.app/api/webhook/twilio/status" \
  -d "StatusCallbackMethod=POST"
```

### Step 3: Verify Vercel Environment Variables

Ensure these are set in Vercel **production** environment:

```
NEXT_PUBLIC_APP_URL=https://nevermiss-delta.vercel.app
TWILIO_AUTH_TOKEN=REDACTED_ROTATED_TOKEN
TWILIO_ACCOUNT_SID=ACe018c9071839ac6c12239c1b3df1a807
ELEVENLABS_AGENT_ID=agent_0201kk1w0yzsf6vv5aqnkcpmh6wm
```

`NEXT_PUBLIC_APP_URL` is critical — without it, Twilio signature validation will use the wrong URL and reject all webhooks. This was likely the cause of the `twimlError()` responses at 00:57 and 01:17.

### Step 4: Deploy and Test

The current code on `main` (`5b4317c`) has the correct WebSocket URL (`wss://api.us.elevenlabs.io`). Deploy and test with a call.

---

## Which Architecture Is Correct?

**The custom WebSocket approach (app webhook) is correct for this setup.** Here's why:

| | App Webhook (Custom WS) | ElevenLabs Native |
|---|---|---|
| WebSocket URL | `wss://api.us.elevenlabs.io/v1/convai/twilio?agent_id=...` | `wss://api.us.elevenlabs.io/v1/convai/conversation` |
| Business hours routing | Yes — code checks hours, dials owner first | No — always goes to AI |
| Dynamic variables | Passed as `<Parameter>` in TwiML | Requires separate webhook |
| Business lookup | Done in app code via Supabase | Depends on ElevenLabs config |
| Dial-then-fallback | Yes — `<Dial>` with fallback to AI | No |
| Control | Full control over call flow | ElevenLabs controls everything |

The app was designed around the custom approach — the voice route handles business hours, dial-to-owner, and fallback to AI. The ElevenLabs native approach bypasses all of this.

---

## Secondary Issues Found

1. **Duplicate post-call webhooks** — Two webhooks configured in ElevenLabs workspace, both pointing to the same URL. The second one (`84eee006...`, created Mar 6) is assigned to the agent. The first one (`16494a44...`, created Mar 9) is orphaned. Should delete the orphan.

2. **Status callback still points to ElevenLabs** — Even after fixing the Voice URL, the status callback should also point to the app's endpoint (`/api/webhook/twilio/status`) to capture call lifecycle events.

3. **No voice fallback URL configured** — If the primary webhook is down, Twilio has nowhere to fall back to. Consider setting a fallback that returns a simple `<Say>` message.

4. **`.env.local` has NEXT_PUBLIC_APP_URL=http://localhost:3001** — This is correct for local dev, but verify the Vercel production env has the correct production URL.
