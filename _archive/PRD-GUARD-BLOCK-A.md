<!--
=============================================================================
PRD GUARD — BLOCK A
File reviewed: apps/web/app/api/webhook/twilio/voice/route.ts
PRD sections: 2 (Architecture), 5 (API Endpoints), 6 (Conversation)
Date: 2026-03-05
=============================================================================

SECTION 2 — ARCHITECTURE
─────────────────────────────────────────────────────────────────────────────
✓  Looks up business by Twilio number
   → .eq('twilio_phone_number', to) — correct

✓  Checks business_hours and routes correctly
   → isWithinBusinessHours() evaluates day/time vs JSONB config
   → IN HOURS  → twimlDial(owner_phone)  ✓
   → OUT OF HOURS → twimlElevenLabs(...)  ✓
   → null hours/"all day" config → returns false (AI answers) — matches spec

✓  Passes caller_phone, twilio_call_sid, business_id as Stream parameters
   → twimlElevenLabs(agentId, from, callSid, business.id)
   → <Parameter name="caller_phone" value="..."/> etc. — all three present

✓  Handles is_active = false (hang up)
   → Explicit check after business lookup, returns twimlHangup() — correct


SECTION 5 — API ENDPOINTS
─────────────────────────────────────────────────────────────────────────────
✓  Route is POST /api/webhook/twilio/voice
   → File at app/api/webhook/twilio/voice/route.ts, exports POST — correct

✓  Twilio signature validation present
   → Uses twilio.validateRequest() in production
   ⚠  SKIP in dev (NODE_ENV !== 'production') — intentional, acceptable
   ⚠  On invalid signature, returns 200 + twimlError() rather than 403
      PRD says "never non-200" so this is spec-compliant, but it means bad
      actors get a polite TwiML response instead of a rejection. Low risk in
      practice; flag if you want to revisit post-launch.

✓  Error handling returns 200 + TwiML (never non-200)
   → catch block returns xmlResponse(twimlError()) at status 200 — correct
   → All early-exit paths also return 200 TwiML — correct


SECTION 6 — CONVERSATION ENGINE
─────────────────────────────────────────────────────────────────────────────
✓  Out-of-hours path uses single shared agent via ELEVENLABS_AGENT_ID env var
   → const agentId = process.env.ELEVENLABS_AGENT_ID — correct
   → No per-business agent IDs hardcoded — correct

✓  In-hours path dials owner's cell, NOT ElevenLabs
   → twimlDial(business.owner_phone) → <Dial><Number> TwiML — correct


DRIFT / NOTES
─────────────────────────────────────────────────────────────────────────────
⚠  TIMEZONE COLUMN MISSING — businesses.timezone does not exist yet.
   Code defaults to 'America/Los_Angeles' with a TODO comment.
   This is a real gap: a business in Chicago will get wrong routing.
   Must be fixed before any non-Pacific customers onboard.
   Migration: ADD COLUMN timezone TEXT DEFAULT 'America/Los_Angeles' to businesses.

   Everything else is tight. No phantom logic, no extra routing paths.


OVERALL VERDICT: ✅ APPROVED (with timezone column fix required before multi-timezone launch)
=============================================================================
-->
