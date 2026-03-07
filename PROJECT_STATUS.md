# NeverMiss — Project Status

**Last updated:** 2026-03-06 7:23 PM PST

---

## What We Built Today (Mar 6)

### Backend / Infrastructure ✅
- **Supabase** — Schema deployed (`001_initial_schema.sql`), test business inserted ("Coconut Bangers Balls Home Services")
- **Twilio** — Number purchased: +1 619-648-2491 (San Diego area code)
- **ElevenLabs** — Native Twilio integration set up (not our custom TwiML → Stream approach)
  - Agent ID: `agent_0201kk1w0yzsf6vv5aqnkcpmh6wm`
  - Post-call webhook: `https://nevermiss-delta.vercel.app/api/webhook/elevenlabs`
  - Variables webhook: `https://nevermiss-delta.vercel.app/api/webhook/elevenlabs/variables`
- **Stripe** — Sandbox mode, recurring payments, flat rate, prebuilt checkout
- **Resend** — API key configured for transactional email
- **Vercel** — Deployed to `https://nevermiss-delta.vercel.app`

### Frontend ✅
- **Landing page redesign** — DM Serif Display italic headlines, white/black/zinc palette
- **Responsive polish** — Proper type scale (capped at `text-8xl`), centered hero on desktop, 3-column How It Works on lg screens
- **Full frontend consistency** — 19 files updated: auth, onboarding, dashboard all match landing page aesthetic
- **Copy QA** — "One missed call per day" (not "1"), comma fix in testimonial

### Env Vars (all in Vercel production + preview)
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER
ELEVENLABS_API_KEY
ELEVENLABS_AGENT_ID
ELEVENLABS_WEBHOOK_SECRET
RESEND_API_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY
NEXT_PUBLIC_APP_URL
SKIP_TWILIO_VALIDATION=true
```

---

## Known Bugs / Issues

### 🔴 Call Drops — HIGH PRIORITY
Two reported instances:
1. **Steve's call** — Changed first message text to make parents laugh → call dropped early
2. **Friend's call** — When agent asked for phone number and caller started saying digits → call dropped

**Suspected causes:**
- First message customization with `{{business_name}}` placeholder caused immediate termination earlier (we hardcoded it to fix). Related issue may persist.
- Phone number digit parsing might be triggering an error in ElevenLabs agent
- Variables webhook returning fallback values ("the business", "the owner") — business lookup by Twilio number not working for native EL calls

### 🟡 Dynamic Variables Not Injecting
- Variables webhook (`/api/webhook/elevenlabs/variables`) returns fallback values during actual EL native calls
- Suspected: payload format mismatch between what ElevenLabs sends and what endpoint expects (`caller_id`, `called_number` field names may differ)
- Test curl works fine; live calls don't

### 🟡 SKIP_TWILIO_VALIDATION Still Enabled
- Should be turned off once variables injection is confirmed working
- Currently `true` in Vercel env

### 🟡 Vercel GitHub Auto-Deploy Broken
- Root cause: Git commits authored as `steve@bridgesourceconsulting.com` but Vercel team tied to `stevenchranowski3@gmail.com`
- Workaround: Manual `vercel --prod` CLI deploys
- Fix: Change git config email to Gmail, or add BridgeSource email to Vercel team

---

## Next Steps

### Immediate (before launch)
1. **Debug call drops** — Check ElevenLabs logs, review agent configuration, test phone number collection flow
2. **Fix variables injection** — Log actual EL payload, match field names, confirm business lookup works
3. **Re-enable Twilio validation** — Once variables working

### Before Paid Launch
4. Stripe checkout flow end-to-end test
5. Onboarding flow: user signs up → gets their own Twilio number → EL agent configured
6. Dashboard: display real call data from Supabase
7. Custom domain (nevermiss.ai or similar)

---

## Key Files

| File | Purpose |
|------|---------|
| `apps/web/app/page.tsx` | Landing page |
| `apps/web/app/api/webhook/twilio/voice/route.ts` | Twilio voice webhook (legacy, may not be used with native EL) |
| `apps/web/app/api/webhook/elevenlabs/route.ts` | Post-call webhook |
| `apps/web/app/api/webhook/elevenlabs/variables/route.ts` | Dynamic variables for EL agent |
| `supabase/migrations/001_initial_schema.sql` | DB schema |

---

## Test Data

- **Test business UUID:** `3caac44c-4399-4d52-83a7-3a81ac48c39e`
- **Business name:** Coconut Bangers Balls Home Services
- **Twilio number:** `+16196482491`
- **Owner phone:** `+16099771254` (Steve)

---

## Architecture Decision: ElevenLabs Native Twilio

We switched from custom TwiML `<Connect><Stream>` to ElevenLabs managing Twilio directly because:
- Our WebSocket stream was being dropped by EL
- Native integration handles call routing end-to-end
- We just provide post-call + variables webhooks

This means:
- Twilio voice webhook URL is `https://api.us.elevenlabs.io/twilio/inbound_call` (set in Twilio console)
- We don't control the TwiML anymore — EL does
- Our code only handles callbacks, not call initiation
