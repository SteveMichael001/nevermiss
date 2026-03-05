# PRD Guard — Block B: ElevenLabs Post-Call Webhook
**File:** `apps/web/app/api/webhook/elevenlabs/route.ts`
**Date:** 2026-03-05
**Verdict: ❌ FAIL — FILE DOES NOT EXIST**

---

## Pre-Check

The file `apps/web/app/api/webhook/elevenlabs/route.ts` **has not been created yet.**

The directory `apps/web/app/api/webhook/elevenlabs/` exists and contains only a `variables/` subdirectory (for the pre-call dynamic variables endpoint). The post-call handler itself is missing entirely.

---

## Checklist Results

| # | Check | Result | Notes |
|---|-------|--------|-------|
| 1 | Event type checked: `post_call_transcription`? | ✗ | File missing |
| 2 | All data accessed under `payload.data.*` (not `payload.*` directly)? | ✗ | File missing |
| 3 | Signature validation present with replay protection? | ✗ | File missing |
| 4 | Business lookup: primary by `business_id`, fallback by `elevenlabs_agent_id`? | ✗ | File missing |
| 5 | Supabase insert hits `calls` table with correct columns? | ✗ | File missing |
| 6 | SMS awaited, errors caught without rethrowing? | ✗ | File missing |
| 7 | Email fire-and-forget with `.catch()`? | ✗ | File missing |
| 8 | Always returns 200 (never non-200)? | ✗ | File missing |
| 9 | `sms_sent_at` and `notification_latency_ms` updated post-send? | ✗ | File missing |

---

## Overall Verdict: ❌ BLOCKED

**This is the core of the product** (PRD §5, §2 post-call handler). Nothing has been built here yet. The `variables` endpoint exists, but the post-call transcription handler — which inserts leads into Supabase and fires SMS/email — is unimplemented.

**Next action:** Build `apps/web/app/api/webhook/elevenlabs/route.ts` per PRD §5 spec. Then re-run this guard.
