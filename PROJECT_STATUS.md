# NeverMiss — Project Status

**Last updated:** 2026-03-09 09:08 PDT  
**Status:** MVP Live — SMS Pending Verification

---

## What's Working ✅

### Voice / AI Answering
- ElevenLabs agent answering calls on +16196482491
- Dynamic variables webhook injecting business name/owner
- Post-call webhook logging calls to Supabase
- Full transcripts captured

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
| +16196482491 | Voice (AI answering) | ✅ Active |
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
3. Full end-to-end onboarding test
4. Stripe Checkout integration test
5. Voice quality improvements (ElevenLabs settings)
