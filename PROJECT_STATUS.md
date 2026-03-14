# NeverMiss — Project Status

**Last updated:** 2026-03-12
**Status:** MVP Live — ElevenLabs Native Voice Routing Active

---

## What's Working ✅

### Voice / AI Answering
- Twilio voice routing is live through ElevenLabs native inbound handling: `https://api.us.elevenlabs.io/twilio/inbound_call`
- ElevenLabs variables webhook is live at `/api/webhook/elevenlabs/variables`
- ElevenLabs post-call webhook is live at `/api/webhook/elevenlabs`
- Calls are being logged to Supabase with transcripts and follow-up SMS delivery
- First real call logged: March 11, 2026 — James, leaky pipe, 69 seconds

### Web App
- Landing page live (Apple-style B&W design)
- Google OAuth sign-in
- Onboarding flow (4 steps)
- Dashboard with call log, settings, billing pages
- Deployed to https://nevermiss-delta.vercel.app

### Database
- Supabase PostgreSQL with businesses + calls tables
- Auth working with proper redirect URLs

---

## What's Blocked ⏳

### Voice Recording Capture
- **Known issue:** `recording_url` is currently `null` on logged calls
- **Impact:** Call records and transcripts are saved, but recording ingestion may still need pipeline work
- **Next step:** Audit the recording pipeline between ElevenLabs post-call data and Supabase storage

### SMS Notifications
- **Issue:** Toll-free number +18339015846 needs verification
- **Action needed:** Complete Twilio Trust Hub verification
  1. Create Customer Profile (Sole Proprietor)
  2. Submit toll-free verification
  3. Wait 1-3 business days
- **Workaround:** None — SMS blocked until verified

### Email Notifications
- Resend API key configured but not fully wired
- Low priority — SMS is primary notification channel

---

## Phone Numbers

| Number | Purpose | Status |
|--------|---------|--------|
| +16196482491 | Voice (ElevenLabs native inbound) | ✅ Active |
| +18339015846 | SMS (toll-free) | ⏳ Pending verification |

---

## Key URLs

- **Production:** https://nevermiss-delta.vercel.app
- **GitHub:** https://github.com/SteveMichael001/nevermiss
- **Supabase:** https://fibauzdvzkfevabxyhkt.supabase.co
- **Twilio Console:** https://console.twilio.com
- **ElevenLabs:** https://elevenlabs.io (agent config)

---

## Environment Variables (Vercel)

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER        (+16196482491 - voice)
TWILIO_SMS_NUMBER          (+18339015846 - SMS)
ELEVENLABS_API_KEY
ELEVENLABS_AGENT_ID
ELEVENLABS_WEBHOOK_SECRET
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY
NEXT_PUBLIC_APP_URL        (https://nevermiss-delta.vercel.app)
```

---

## Design System

**Apple-style B&W. No accent colors.**

See `apps/web/app/globals.css`:
- nm-black: #000000
- nm-white: #ffffff
- nm-gray: #858484
- nm-border: #e5e5e5
- nm-soft: #f7f7f7

---

## Recent Commits

- `74d0410` — feat: use toll-free number for SMS delivery
- `6886b4e` — Simplify onboarding to 4-step flow
- `ea87cc0` — fix: trim env vars for auth
- `0681fa2` — Add wordmark logo
- `b0e5431` — Rebuild in Apple-style B&W system

---

## Next Steps (When Resuming)

1. Complete Twilio toll-free verification
2. Test SMS delivery
3. Investigate why `recording_url` remains `null`
4. Full end-to-end onboarding test
5. Stripe Checkout integration test
