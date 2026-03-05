# NeverMiss AI — Code Audit Report

**Audited:** `apps/voice/src/` + `apps/web/`  
**Date:** 2026-03-05  
**Auditor:** Senior code review (subagent)

---

## Summary

7 Critical issues, 7 Major issues, 8 Minor issues. Two of the Critical issues mean the product **cannot function in production as-is** — phone number provisioning is completely broken, and the server crashes on Deepgram connection errors. The rest range from data corruption (call records never updated on normal hangups) to a UX disaster (TTS takes 2× real-time to deliver). This is not production-ready. It needs real work before it touches a paying customer's calls.

---

## 1. CRITICAL — Will break in production

---

### C1. `/provision` endpoint doesn't exist on the voice server

**File:** `apps/web/app/api/onboarding/provision/route.ts` + `apps/voice/src/index.ts`

The web app calls `${voiceServerUrl}/provision` to provision a Twilio number:

```typescript
const res = await fetch(`${voiceServerUrl}/provision`, {
  method: 'POST',
  ...
})
```

The voice server registers exactly these routes: `GET /health`, `POST /webhook/twilio/voice`, `POST /webhook/twilio/status`, `POST /webhook/twilio/recording`, `WS /media-stream`. There is no `/provision` route. Every production provisioning attempt returns 404, the web app returns 500 to the user, and no Twilio number is ever assigned.

The dev fallback (mocked numbers when `VOICE_SERVER_URL` is unset) hides this in local dev, which is why it wasn't caught.

**Result:** No user can complete onboarding in production. The entire product is DOA until this is fixed.

---

### C2. Twilio signature validation skips silently when `TWILIO_AUTH_TOKEN` is missing

**File:** `apps/voice/src/twilio/webhook.ts` — `validateTwilioRequest`

```typescript
if (!TWILIO_AUTH_TOKEN) {
  console.warn('[Webhook] TWILIO_AUTH_TOKEN not set — skipping signature validation');
  return next();
}
```

If the env var is missing (or misconfigured in Railway), the server logs a warning and processes the webhook anyway. Anyone can POST forged Twilio webhook requests to trigger calls, abuse the AI pipeline, and run up API costs. This isn't a theoretical concern — Railway env vars get misconfigured during deploys all the time.

This should throw at startup, not silently bypass at request time.

---

### C3. Early-hangup calls never update the DB record

**File:** `apps/voice/src/twilio/media-stream.ts` — `handleStop()`

```typescript
private handleStop(): void {
  if (this.engine && !this.callEnded) {
    const session = this.engine.getSession();
    void this.handleCallEnd(session, null);  // <-- callDbId hardcoded null
  }
  this.cleanup();
}
```

`handleCallEnd` uses `callDbId` to gate every DB update:

```typescript
if (callDbId) {
  await updateCallRecord(callSid, { callerName, serviceNeeded, ... });
}
```

When `callDbId` is `null` (which it is on every `handleStop()` path), ALL `updateCallRecord` calls are skipped — including the one that writes the transcript, extracted data, urgency, caller name, and duration. The call record stays in the DB with only `lead_status: 'new'` and `urgency: 'unknown'`.

**But `updateCallRecord` looks up by `callSid`, not `callDbId`.** The guard is meaningless — the update would work fine if `callDbId` were not checked. This is a logic error that causes data loss on every call where the caller hangs up before the engine fires its 'end' event (which is most normal calls — callers hang up after saying goodbye, which triggers `handleStop` before or at the same time as the engine's 4-second timeout).

SMS notifications still fire (they don't check `callDbId`), but the dashboard shows empty records for all of them.

---

### C4. Deepgram connection error during `connect()` crashes the entire server

**File:** `apps/voice/src/ai/deepgram-stt.ts`

In the Error handler inside `connect()`:

```typescript
this.connection.on(LiveTranscriptionEvents.Error, (err) => {
  this.emit('error', ...);  // fired first
  reject(err);              // fired second
});
```

The `'error'` listener on `DeepgramSTT` is attached in `initializePipeline()` AFTER `await this.stt.connect()` returns. If the error fires during connection (before `resolve()` is called), `emit('error')` fires with no registered listener. Node.js EventEmitter behavior: unhandled `'error'` events throw `Error [ERR_UNHANDLED_ERROR]`. This becomes an uncaughtException, which `index.ts` catches with `process.exit(1)`.

One bad Deepgram connection attempt during a real call kills the entire server and drops every other active call. Railway will restart it, but it's a hard crash.

**Fix:** Attach the error listener before calling `connect()`, or check `this.listenerCount('error') > 0` before emitting, or switch the order (reject before emit).

---

### C5. Claude extraction model identifier is wrong

**File:** `apps/voice/src/ai/extraction.ts`

```typescript
const EXTRACTION_MODEL = 'claude-haiku-4-5';
```

The comment says "Claude 3.5 Haiku — latest, cheapest, fast." Claude 3.5 Haiku's actual API identifier is `claude-3-5-haiku-20241022`. The identifier `claude-haiku-4-5` is not a valid Anthropic model. The Anthropic SDK will return an API error.

The try/catch in `extractLeadFromTranscript` swallows the error and returns the fallback object. So extraction silently fails on every single call. The error is logged but there's no alerting. Operators see real call data in the DB, but `extraction_json` is always the fallback, `summary` is always "Unable to extract lead data from transcript," and the enriched fields (caller name, urgency correction) never apply.

This is pure AI slop — a hallucinated model identifier that looks plausible.

---

### C6. TTS audio delivery takes 2× real-time — callers sit in silence

**File:** `apps/voice/src/twilio/media-stream.ts` — `sendAudioChunks()`

```typescript
for (const payload of chunks) {
  this.ws.send(JSON.stringify(mediaEvent));
  await sleep(20);  // 20ms delay after each 20ms chunk
}
```

At 8kHz mulaw, a 20ms audio chunk is 160 bytes. The code generates the chunk, sends it, then waits 20ms before the next. For a 3-second TTS response, that's ~150 chunks × 20ms = 3 seconds of sleeping — meaning delivery takes **6 seconds total** (3s TTS generation + 3s paced delivery) before the caller hears anything.

Twilio buffers media stream audio and plays it at the correct rate automatically. You don't need to pace delivery at 1:1 real-time. Send all chunks as fast as the WebSocket allows; Twilio handles playback. The sleep should be removed or reduced to a small throttle (e.g., 1-2ms) to avoid flooding.

A 6-second pause between question and AI response is a terrible caller experience that will cause customers to hang up and complain.

---

### C7. Barge-in is completely broken — `clearAudio()` is dead code

**File:** `apps/voice/src/twilio/media-stream.ts`

```typescript
/**
 * Clear Twilio's audio playback buffer.
 * Call this when the caller starts speaking to interrupt any ongoing AI speech.
 */
private clearAudio(): void { ... }
```

`clearAudio()` is defined and documented but never called anywhere. There is no code that invokes it when a caller transcript arrives. As a result:

- Callers cannot interrupt the AI mid-sentence
- If the AI is speaking its full greeting and the caller tries to respond, the greeting plays to completion regardless
- The audio queue keeps playing even as the state machine advances (thanks to final transcripts getting through the `isSpeaking && !isFinal` partial guard)

The STT handler only suppresses **interim** transcripts while speaking. Final transcripts still drive state transitions, so the AI queues a new response before the current one finishes playing. Callers experience doubled audio responses playing back-to-back.

---

## 2. MAJOR — Bad behavior under real conditions

---

### M1. Reconnect logic defined but never implemented — Deepgram drop = silent call death

**File:** `apps/voice/src/ai/deepgram-stt.ts`

```typescript
private reconnectAttempts = 0;
private readonly MAX_RECONNECT_ATTEMPTS = 3;
```

These fields are initialized but there is no reconnect logic anywhere in the class. The `Close` event just logs and emits `'close'`. Nothing in `MediaStreamHandler` handles the STT `'close'` event.

If Deepgram drops the connection mid-call (which happens in production), `isConnected` goes false, `sendAudio` silently drops all audio, no transcript events fire, and the conversation freezes. The caller hears silence. The 3:00 hard-stop timer eventually fires and ends the call. No reconnect is attempted.

---

### M2. Emergency keywords include common conversational phrases — constant false positives

**File:** `apps/voice/src/ai/emergency-detector.ts`

Universal emergency keywords include: `'right now'`, `'immediately'`, `'asap'`, `'urgent'`.

These are extremely common in home service calls:
- "Can someone come out right now?" → **emergency**
- "I need this fixed asap" → **emergency**  
- "This is urgent" → **emergency**

For any plumbing, HVAC, or electrical business, this will flag the majority of time-sensitive (but non-dangerous) calls as emergencies. The behavioral change: the AI says "That sounds urgent — I'll make sure [owner] gets this message **right away**" and potentially alters the urgency classification stored in the DB. Emergency SMS formatting gets used. The business owner gets a 🚨 EMERGENCY text for "my faucet is dripping, can you come asap?"

`'right now'` should not be an emergency keyword. `'asap'` should not be an emergency keyword. These belong in the `urgentPhrases` list in `containsUrgentLanguage`, which already has them.

---

### M3. `ASSESS_URGENCY` is a ghost state that pollutes the state machine

**File:** `apps/voice/src/ai/conversation-engine.ts`

`handleCaptureIssue` does this:

```typescript
this.session.state = 'ASSESS_URGENCY';
// [computes urgency inline]
this.session.state = 'CAPTURE_CALLBACK';  // immediately overrides
```

`ASSESS_URGENCY` is set and immediately overridden. It's never actually occupied for any message cycle. Yet `handleState` has a case for it:

```typescript
case 'ASSESS_URGENCY':
  // ASSESS_URGENCY is auto-resolved during CAPTURE_ISSUE based on keywords
  // If we somehow land here, move to CAPTURE_CALLBACK
  this.handleCaptureCallback(text);
  break;
```

The "if we somehow land here" comment is a confession that this is dead code from an earlier design that was partially refactored. `ASSESS_URGENCY` is also in the `ConversationState` type definition but serves no real purpose. If the state machine ever does land here (race condition with concurrent transcripts), the caller's text is incorrectly treated as a callback time preference.

---

### M4. `handleCaptureName` third-retry logic fires the wrong message

**File:** `apps/voice/src/ai/conversation-engine.ts`

On a second failed name extraction:

```typescript
const response = `I'm sorry, I didn't catch your name. Could you repeat it for me?`;
this.addAITranscript(response);
this.emit('speak', response);
// Note: we stay in CAPTURE_NAME — next transcript will try again
// If name still not found on second try, we'll accept whatever they said
if (this.session.transcript.filter((t) => t.speaker === 'ai').length >= 3) {
  // Third AI message — accept the raw text as the name and move on
  this.session.callerName = text.trim().slice(0, 50);
  this.session.state = 'CAPTURE_ISSUE';
}
```

The AI says "I didn't catch your name" AND simultaneously advances to `CAPTURE_ISSUE`. The AI is about to ask "What can we help you with today?" while also queuing "I didn't catch your name" — the caller hears both. The intent was clearly to move forward on the *next* transcript, not the current one.

Also: the count check `>= 3` counts ALL AI messages, not just those in CAPTURE_NAME. After any conversation restart (CONFIRM → CAPTURE_ISSUE re-entry), the count is already high, so this path triggers on the first name attempt.

---

### M5. Client-side filtering breaks on any call log with >25 entries

**File:** `apps/web/app/(dashboard)/dashboard/call-log-view.tsx`

The dashboard page loads the most recent 25 calls from Supabase. The `CallLogView` component filters these client-side:

```typescript
const filteredCalls = calls.filter((call) => {
  if (urgencyFilter !== 'all' && call.urgency !== urgencyFilter) return false
  ...
})
```

A business with 100 calls and "filter by emergency" sees only emergencies within the first 25 calls. If all emergencies happened yesterday (calls 26-100), the filtered view shows zero results and the user thinks there are no emergencies. This is silently wrong — the filter gives no indication it's operating on a partial dataset.

The API endpoint (`/api/calls`) supports server-side filtering via query params (`?urgency=emergency`), but the dashboard doesn't use it. Filtering should be server-side.

---

### M6. `STRIPE_PRICE_ID` silently defaults to empty string

**File:** `apps/web/lib/stripe.ts`

```typescript
export const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID ?? ''
```

Empty string is passed to Stripe as a price ID. Stripe returns `"No such price: ''"`. The checkout route catches this as a 500 and returns `"Failed to create checkout session"` to the user. No startup validation, no clear error message. Every new subscription attempt fails silently until someone notices the logs.

---

### M7. `detectHumanRequest` matches "call back" — triggers premature hang-up

**File:** `apps/voice/src/ai/emergency-detector.ts`

```typescript
const HUMAN_REQUEST_KEYWORDS = [
  ...
  'call back',
];
```

Callers routinely say things like "I just want someone to call me back" or "Can you have them call back?" or "I'll call back later." All of these match `'call back'` and trigger:

```typescript
if (!this.session.humanRequested && detectHumanRequest(text)) {
  this.session.humanRequested = true;
  this.handleHumanRequest();  // sets state = GOODBYE, ends call
  return;
}
```

The AI says "I completely understand" and hangs up — even when the caller just meant "please have the owner call me back," which is the entire point of the service.

---

## 3. MINOR — Tech debt, cleanup needed

---

### N1. `wrapUpScheduled` field is initialized but never written

**File:** `apps/voice/src/types.ts` + `conversation-engine.ts`

`CallSession.wrapUpScheduled` is initialized to `false` and never set to `true` anywhere. Not used in any conditional logic. Dead field. The `scheduleTimers` method doesn't set it, `wrapUp()` doesn't set it. Either remove it or actually use it to prevent double-wrapup calls.

---

### N2. Test call endpoint is a stub — always returns success

**File:** `apps/web/app/api/business/test-call/route.ts`

```typescript
// In a full implementation, this would trigger the voice server
// to make a test call to the AI number
return NextResponse.json({
  success: true,
  message: `Test call initiated to ${business.twilio_phone_number}`,
})
```

Returns `success: true` without doing anything. If the onboarding UI shows a "Test your AI" button, clicking it does nothing and lies about it. Ship this when it works.

---

### N3. `void businessName` dead code in `handleCaptureName`

**File:** `apps/voice/src/ai/conversation-engine.ts`

```typescript
void businessName; // used for context
```

Classic AI slop. `businessName` is extracted from `businessInfo()` but never used in the function body. The `void` is suppressing a TS unused variable warning rather than fixing the code. Either use it in the "I didn't catch your name" response (e.g., "I'm the receptionist for {businessName}...") or remove the destructuring.

---

### N4. `callStartMs` is a misleading variable name

**File:** `apps/voice/src/twilio/media-stream.ts` — `handleCallEnd()`

```typescript
const callStartMs = Date.now();
// ... extraction runs ...
notificationLatencyMs: Date.now() - callStartMs,
```

`callStartMs` sounds like the call start time. It's actually the start of post-call processing. The real call start is `session.startTime`. The value stored in `notification_latency_ms` is the extraction + SMS latency, which is correct — the name is just wrong and confusing for anyone reading the DB.

---

### N5. Transcript deduplication is partial — interim results add duplicate entries

**File:** `apps/voice/src/ai/conversation-engine.ts` — `addCallerTranscript()`

`processTranscript` is called for both interim and final transcripts, adding both to `session.transcript`. The dedup check only catches adjacent identical entries. If an AI response (`addAITranscript`) fires between interim and final, the same caller text appears twice. This bloats the transcript sent to Claude for extraction and can confuse urgency/spam analysis.

---

### N6. `smssentAt` typo in `updateCallRecord` parameter

**File:** `apps/voice/src/db/supabase.ts`

The update parameter is `smssentAt` (lowercase second 's') while the analogous field is `emailSentAt` (camelCase). TypeScript is internally consistent so it works, but it's jarring inconsistency. Rename to `smsSentAt` everywhere.

---

### N7. `createAdminClient` uses SSR cookie client for admin operations

**File:** `apps/web/lib/supabase/server.ts`

`createAdminClient` is the service-role client used in the Stripe webhook handler for privileged DB writes. It uses `@supabase/ssr`'s cookie-based client. This works in Route Handlers but requires Next.js request context. For a true server-to-server admin client, use `createClient` from `@supabase/supabase-js` directly with the service role key — no cookies needed, simpler, and works in any context.

---

### N8. No phone number format validation before SMS sends

**File:** `apps/web/app/(dashboard)/dashboard/settings/settings-form.tsx` + `apps/voice/src/notifications/sms.ts`

`owner_phone` and `notification_phones` are stored and used for SMS sends without E.164 format validation. Twilio requires E.164 (`+16195551234`). If a user enters `619-555-1234` or `(619) 555-1234`, SMS sends will fail with Twilio errors. These errors are logged but not surfaced back to the user — they just stop receiving notifications. Validate and normalize to E.164 at save time.

---

## 4. Verdict

**Not production-ready. Needs serious work.**

The core loop — inbound call → AI conversation → lead notification — is architecturally sound and the code is generally readable. But there are two showstoppers before a single real call can succeed end-to-end:

1. **Phone number provisioning is completely broken** (C1) — onboarding dead-ends for every user
2. **Server crashes on Deepgram connection errors** (C4) — takes down all active calls

Beyond those, the TTS delivery latency (C6) makes the caller experience embarrassing, the DB is corrupted for most real calls (C3), and extraction never actually works (C5).

The AI slop patterns are notable: the `ASSESS_URGENCY` ghost state, the `wrapUpScheduled` dead field, the hallucinated model identifier, the `void businessName` comment, and the test-call stub all suggest this was vibe-coded past the point of careful thought. None of these individually are catastrophic, but together they signal the codebase hasn't been tested end-to-end with real traffic.

**Priority fix order:**
1. C1 — Add `/provision` route to voice server
2. C4 — Fix STT error listener ordering
3. C3 — Remove `if (callDbId)` guards (update by callSid directly)
4. C6 — Remove the 20ms sleep in `sendAudioChunks`
5. C7 — Call `clearAudio()` in the STT transcript handler on final transcripts
6. C5 — Fix model identifier
7. C2 — Make missing `TWILIO_AUTH_TOKEN` throw at startup, not skip at runtime

---

## Fix Verification

**Verified:** 2026-03-05  
**Verifier:** Senior code review (subagent — second pass)

Verification of claimed fixes for C1, C3, C4, C5, C6, C7. TypeScript compilation: `npx tsc --noEmit` in `apps/voice/` — **zero errors** (confirmed).

---

### C1 — `/provision` route: **FAIL**

The route now exists in `index.ts`. The column `twilio_phone_number` exists in the `businesses` table (confirmed via `getBusinessByPhone` in `supabase.ts` querying it). Those two things are fine.

**Everything else is broken.**

**Parameter mismatch:** The web route (`apps/web/app/api/onboarding/provision/route.ts`) sends:
```json
{ "businessId": "...", "areaCode": "619" }
```
The voice server expects:
```typescript
const { businessId, phoneNumber } = req.body
if (!businessId || !phoneNumber) {
  res.status(400).json({ error: 'Missing required fields: businessId, phoneNumber' });
```
`phoneNumber` is never sent by the web. Voice server returns **400 on every production call**. Onboarding is still completely broken.

**No Twilio API call:** The voice server `/provision` endpoint is a DB update stub — it just writes whatever `phoneNumber` is passed into the DB. There's no Twilio API call to search available numbers, purchase one, or configure a webhook. You'd have to send it a pre-purchased number. The web caller sends an `areaCode` expecting the server to handle provisioning — it doesn't.

**Missing `phoneSid` in response:** The voice server returns `{ success: true, phoneNumber }`. The web route expects `data.phoneSid` and writes it to `twilio_phone_sid`. That field will always be `undefined` (stored as null). Minor compared to the rest, but sloppy.

**The `/provision` route is also missing from the startup banner** — `console.log` in `index.ts` still only lists the original four routes. Not a bug, but someone monitoring Railway logs will think the route doesn't exist.

Bottom line: the fix addresses "route doesn't exist" but introduces a new mismatch and doesn't implement the actual provisioning logic. **Still DOA.**

---

### C3 — Early hangup / DB records: **PARTIAL**

`updateCallRecord` is now called without the `if (callDbId)` guard, directly using `callSid`. The function signature accepts `callSid: string` and does `.eq('twilio_call_sid', callSid)` — this is correct. DB updates will now actually execute on normal hangups.

**Race condition introduced:** `handleStop()` checks `if (!this.callDbId)` and — if null — launches a second `createCallRecord()` call. But `createCallRecord()` may already be in-flight inside `initializePipeline()` (awaiting the DB insert). If both fire concurrently, two call records get inserted with the same `twilio_call_sid`. The subsequent `updateCallRecord` updates both rows (since it doesn't filter by `id`, only by `callSid`). Dashboard will show two identical records for the same call.

The scenario that triggers this: caller hangs up within the first 1–3 seconds of the call, before `initializePipeline()` has finished creating the call record. On fast-hangup calls this is likely. The fix trades "missing data" for "duplicate rows" — better, but not correct.

**`cleanup()` fires immediately after the async branch:** `handleStop()` starts the `createCallRecord` promise and immediately calls `this.cleanup()`, which destroys the engine and STT. `handleCallEnd` uses the pre-captured `session` object and `callSid` string, not `this.engine`, so this is safe. But worth noting the order.

---

### C4 — Deepgram crash: **PASS**

The fix is correct. In `initializePipeline()`:
```typescript
this.stt = new DeepgramSTT(callSid);
this.stt.on('error', (err) => { ... });  // listener registered FIRST
await this.stt.connect();                // connect called SECOND
```
The `'error'` listener is registered before `connect()` is called. If the connection fails during setup, `this.listenerCount('error') > 0` evaluates to `1` (true) and `emit('error', ...)` runs safely. No uncaught EventEmitter error.

The `listenerCount` guard inside the Error handler is belt-and-suspenders — the listener is always registered by the time connect fires. It's redundant but harmless, not wrong.

`reject(errorObj)` fires before `emit('error', ...)` in the handler. `reject()` is synchronous (transitions promise state), but its `.catch()` handler runs as a microtask later. `emit` still runs synchronously in the same handler. No ordering problem.

One minor note: if a Deepgram error fires AFTER `connect()` resolves (mid-call drop), `reject` is a no-op (promise already settled), but `emit('error', ...)` still fires and the registered listener catches it. Good.

---

### C5 — Claude model identifier: **PASS**

`EXTRACTION_MODEL = 'claude-3-5-haiku-20241022'` is the correct Anthropic API identifier for Claude 3.5 Haiku. Extraction will now actually execute instead of silently failing with every API call.

---

### C6 — TTS delay: **PASS (with caveat)**

The `await sleep(20)` is gone. `sendAudioChunks()` now sends all chunks in a tight synchronous loop. For a 3-second TTS response (~150 chunks), delivery now takes milliseconds instead of 3 seconds. Twilio buffers and plays at the correct rate. Fix is correct.

**Caveat:** No backpressure handling. `ws.send()` is fire-and-forget. 150 JSON-wrapped audio chunks are roughly 50–80KB — well within Node's WebSocket buffer defaults. Not a practical problem at current scale, but a production voice server under load (dozens of concurrent calls) could saturate buffers. `ws.bufferedAmount` is not checked, `drain` event is not used. Fine for now; flag if call volume grows.

---

### C7 — Barge-in: **PASS**

`clearAudio()` is no longer dead code. The STT handler now calls it:
```typescript
this.stt.on('transcript', (text, isFinal) => {
  if (this.isSpeaking) {
    this.clearAudio();   // ← now wired
  }
  if (this.isSpeaking && !isFinal) return;
  this.engine?.processTranscript(text, isFinal);
});
```

The concern raised in the audit — repeated `clear` events on every interim transcript — is real but not harmful. Sending `clear` to Twilio when its buffer is already empty is a no-op. `this.audioQueue.length = 0` is idempotent. No stutter results: `processTranscript` is not called on interim+speaking, so the AI doesn't restart or queue new speech during barge-in. It only processes the final transcript, at which point `isSpeaking` may already be false.

Barge-in now works: caller interrupts → audio clears → final transcript drives next AI turn. Functionally correct.

---

## New Issues Found During Verification

**NI-1 (Critical — C1 follow-on):** Even if the parameter mismatch is fixed, the `/provision` voice server endpoint still doesn't call the Twilio API. It accepts a `phoneNumber` you already have and saves it to the DB. There is no code anywhere in the voice server that searches Twilio's available number inventory, purchases a number, or configures a webhook URL on it. Someone needs to write this. The voice server comment says "Provision a Twilio phone number to a business" but it only stores a number, it doesn't provision one.

**NI-2 (Major — C3 follow-on):** The `handleStop()` race condition can create duplicate call records. See C3 notes above. Fix: add a `callRecordCreating: boolean` flag set to `true` at the start of `initializePipeline()`'s `createCallRecord` call, so `handleStop()` knows to wait rather than spawn its own `createCallRecord`.

**NI-3 (Minor):** The `/provision` route is missing from the startup banner in `index.ts`. Low priority but confusing for ops.

**NI-4 (Minor — web):** The web `/provision` route calls `supabase.from('businesses').update({ twilio_phone_sid: data.phoneSid })` but the voice server never returns `phoneSid`. This silently writes `undefined` → `null` to `twilio_phone_sid` on every non-mock provisioning attempt. If that field is ever used for Twilio API calls, it will fail silently.

---

## Revised Fix Status

| Fix | Status | Summary |
|-----|--------|---------|
| C1 | ❌ FAIL | Route added but broken: param mismatch (areaCode vs phoneNumber), no Twilio API call, missing phoneSid in response |
| C3 | ⚠️ PARTIAL | `callDbId` guard correctly removed, but race condition in `handleStop` can create duplicate records |
| C4 | ✅ PASS | Listener registered before connect(). Crash is prevented. |
| C5 | ✅ PASS | Correct model ID. Extraction will now work. |
| C6 | ✅ PASS | Sleep removed. Delivery is fast. No practical backpressure concern at current scale. |
| C7 | ✅ PASS | `clearAudio()` is wired. Barge-in works. Repeated clears on interim are harmless. |

**C1 remains a production showstopper.** The other fixes (C4, C5, C6, C7) are real improvements. C3 is better than before but still has a correctness bug. TypeScript compiles clean.

---

## C1/C3 Re-verification

**Verified:** 2026-03-05 (second re-verification pass)
**Verifier:** Subagent — nevermiss-c1-c3-audit
**TypeScript:** `npx tsc --noEmit` in `apps/voice/` — **zero errors** ✅

---

### C1 — `/provision` endpoint: **PARTIAL PASS — one new bug introduced**

Previous failure reasons were: param mismatch (`phoneNumber` vs `areaCode`), no Twilio API call, missing `phoneSid` in response. All three were addressed in this pass. Checking each audit item:

**1. Accepts `areaCode` instead of `phoneNumber`:** ✅ PASS
```typescript
const { businessId, areaCode } = req.body
if (!businessId || !areaCode) {
  res.status(400).json({ error: 'Missing required fields: businessId, areaCode' });
```
Web route sends `{ businessId, areaCode }`. Voice server expects `{ businessId, areaCode }`. Parameter contract is now aligned.

**2. Calls Twilio to search available numbers:** ✅ PASS
```typescript
available = await twilioClient.availablePhoneNumbers('US').local.list({ areaCode: parseInt(areaCode, 10), limit: 1 });
```
Correct API call. Parses `areaCode` to int as required by the Twilio SDK.

**3. Purchases a number:** ✅ PASS
```typescript
const purchased = await twilioClient.incomingPhoneNumbers.create({
  phoneNumber: available[0].phoneNumber,
  voiceUrl: `${VOICE_SERVER_URL}/twilio/voice`,
  voiceMethod: 'POST',
});
```
Purchase call is correct. **However — see bug below.**

**4. Configures webhook with voiceUrl and voiceMethod:** ❌ FAIL — WRONG PATH

`voiceUrl` is set to `${VOICE_SERVER_URL}/twilio/voice`. The actual voice webhook route in `index.ts` is mounted at:
```typescript
app.use('/webhook/twilio', webhookRouter);
// router.post('/voice', ...) → full path: /webhook/twilio/voice
```
The correct `voiceUrl` must be `${VOICE_SERVER_URL}/webhook/twilio/voice`. As written, Twilio will POST incoming calls to `/twilio/voice` — which hits the 404 handler. Every call to the purchased number will get a Twilio error and the caller will hear "We're sorry, your call cannot be completed." This is a new critical bug introduced by this fix.

**5. Saves to Supabase correctly:** ✅ PASS
```typescript
await supabase.from('businesses').update({ twilio_phone_number: purchasedNumber }).eq('id', businessId);
```
Correct column, correct filter.

**6. Returns proper errors (404 if no numbers, 500 if purchase fails):** ✅ PASS
- `available.length === 0` → `res.status(404).json({ error: \`No phone numbers available in area code ${areaCode}\` })`
- Purchase throws → `res.status(500).json({ error: \`Twilio number purchase failed: ${msg}\` })`
- Search throws → `res.status(500).json({ error: \`Twilio number search failed: ${msg}\` })`
- DB save fails → `res.status(500).json({ error: 'Number purchased from Twilio but failed to save to database' })`

Error handling is thorough.

**Remaining minor issue (NI-4 from previous pass — not fixed):** Voice server returns `{ success: true, phoneNumber }` with no `phoneSid`. Web route attempts `supabase.update({ twilio_phone_sid: data.phoneSid })` — `data.phoneSid` is `undefined`, writing `null` to `twilio_phone_sid`. Non-blocking for now but the field will always be null.

**Also not fixed (NI-3):** The `/provision` route is still absent from the startup banner `console.log` in `index.ts`. Ops confusion risk, not a functional bug.

**C1 Summary:** The core logic is now correct (real Twilio search + purchase). One new showstopper: the `voiceUrl` path is wrong — numbers purchased via this endpoint will fail to connect calls. One-line fix: `${VOICE_SERVER_URL}/webhook/twilio/voice`.

---

### C3 — Race condition / duplicate records: **PASS**

Previous partial-pass issue: `handleStop()` would spawn a second `createCallRecord()` call if `callDbId` was null, potentially racing with an in-flight `createCallRecord()` inside `initializePipeline()`.

**1. `isCreatingRecord` flag set before `createCallRecord()` call:** ✅ PASS
```typescript
this.isCreatingRecord = true;
this.callDbId = await createCallRecord({ businessId, callSid, callerPhone });
this.isCreatingRecord = false;
```
Flag is set to `true` before the async DB insert and cleared after. Correct.

**2. `handleStop()` polls for in-flight creation:** ✅ PASS
```typescript
if (!this.callDbId) {
  if (this.isCreatingRecord) {
    const waitForRecord = (): Promise<void> => {
      return new Promise((resolve) => {
        const poll = setInterval(() => {
          if (!this.isCreatingRecord) {
            clearInterval(poll);
            resolve();
          }
        }, 50);
      });
    };
    waitForRecord()
      .then(() => { void this.handleCallEnd(session, this.callDbId); })
      .catch(...);
  } else if (this.businessId && this.callSid) {
    // No record in-flight and none created — safe to create one now
    createCallRecord(...)...
  }
}
```
Three distinct branches: (a) record already created → use it; (b) creation in-flight → poll and wait; (c) no record and not creating → create one. All paths handled.

**3. Prevents duplicate records:** ✅ PASS
The `isCreatingRecord` flag bridges the window between "insert started" and "insert returned." `handleStop()` waits rather than racing. A second `createCallRecord()` is only called if `!this.callDbId && !this.isCreatingRecord` — i.e., the pipeline never started or failed before creating the record (caller hung up in the first ~200ms before `initializePipeline()` started the DB insert). That's the correct fallback. No duplicates.

**Note:** `cleanup()` is called immediately after the async `waitForRecord` branch fires, before the `.then()` resolves. This is safe — `handleCallEnd` uses the captured `session` object and `this.callDbId` string directly; `cleanup()` destroys `this.engine` and `this.stt`, which `handleCallEnd` doesn't touch after the session snapshot. Order is fine.

**C3 Summary:** Race condition is fully resolved. All three checklist items pass.

---

### TypeScript — zero errors: ✅ PASS

`npx tsc --noEmit` in `apps/voice/` produced no output — zero errors, zero warnings.

---

### New Issues Found

**NI-5 (Critical — C1 follow-on):** `voiceUrl` in `/provision` is `${VOICE_SERVER_URL}/twilio/voice` — should be `${VOICE_SERVER_URL}/webhook/twilio/voice`. Numbers provisioned via this endpoint will 404 on all inbound calls. One-line fix required.

---

## Revised Fix Status (Third Pass)

| Fix | Status | Summary |
|-----|--------|---------|
| C1 | ⚠️ PARTIAL | Logic correct (Twilio search + purchase + proper errors). One new critical bug: `voiceUrl` path is `/twilio/voice` instead of `/webhook/twilio/voice`. Calls will 404. One-line fix. |
| C3 | ✅ PASS | `isCreatingRecord` flag prevents duplicate records. `handleStop()` correctly polls. All three race-condition scenarios handled. |
| TypeScript | ✅ PASS | Zero errors. |

**Overall verdict: needs more work — one more fix before testing.**

C3 is done. C1 is 95% there — one wrong path string is the last blocker. Fix `voiceUrl` to `/webhook/twilio/voice` and C1 should be production-ready. Everything else previously passing (C4, C5, C6, C7) is unchanged.
