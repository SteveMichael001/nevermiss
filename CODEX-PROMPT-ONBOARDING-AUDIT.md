# Codex Task: NeverMiss Onboarding — End-to-End Audit & Fix

## Mission
Audit and fix the NeverMiss onboarding flow so a brand-new customer can sign up, get their AI phone number, pay, and have live AI call answering — with zero manual steps required from the NeverMiss team.

## Codebase Context
- Monorepo: `~/Projects/nevermiss/`
- Web app: `apps/web/` (Next.js 14, App Router)
- Stack: Supabase (auth + DB), Twilio (voice + SMS), ElevenLabs (AI agent), Stripe (billing), Vercel (deploy)
- Live URL: https://nevermiss-delta.vercel.app
- PRD: `~/Projects/nevermiss/PRD.md` — READ THIS FIRST before touching anything

## How Calls Actually Work (Critical Context)
When a customer calls a provisioned Twilio number:
1. Twilio hits `POST /api/webhook/twilio/voice`
2. Our webhook looks up the business by `twilio_phone_number`
3. If out-of-hours → returns TwiML `<Connect><Stream>` pointing to ElevenLabs WebSocket
4. ElevenLabs handles the call using our shared agent (`agent_0201kk1w0yzsf6vv5aqnkcpmh6wm`)

**This means: NO manual ElevenLabs import is required per customer.** The WebSocket stream approach works for any provisioned number automatically.

## Specific Issues to Investigate and Fix

### 1. Production URL Bug (HIGH PRIORITY)
File: `apps/web/app/api/onboarding/provision/route.ts`

The provision route uses `process.env.NEXT_PUBLIC_APP_URL` to set `voiceUrl` when buying a Twilio number. In `.env.local` this is `http://localhost:3001` — WRONG for production.

Fix: Update the provision route to use the correct production URL. Use this fallback chain:
```typescript
const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace('http://localhost:3001', 'https://nevermiss-delta.vercel.app')
  ?? 'https://nevermiss-delta.vercel.app'
```
Or better: check `process.env.VERCEL_URL` as a fallback for production.

### 2. Remove Stale Manual ElevenLabs Step
File: `apps/web/app/api/onboarding/provision/route.ts`

There's a comment and response fields (`elevenlabsSetupRequired`, `manualStep`, `nextStep`) suggesting manual ElevenLabs import is needed. This is WRONG — our WebSocket stream approach doesn't require it.

Fix: Remove `elevenlabsSetupRequired`, `manualStep`, `nextStep` from the response. Simplify the response to just `{ phoneNumber, phoneSid }`. Remove all the ElevenLabs import instructions from the route.

### 3. Onboarding Step Count Mismatch
The PRD describes 4 steps: Setup → Number → Payment → Complete.
The actual code has 5 steps: Setup → Number → **Test** → Payment → Complete.
`OnboardingSteps` component likely shows 4 steps but the test page calls it with `currentStep={4}` and payment with `currentStep={3}`.

Fix: Audit `OnboardingSteps` component and make sure step numbering is consistent across all pages. If the test step is valuable UX (it is — lets users verify their number works), update the PRD step count and the component to reflect 5 steps cleanly.

### 4. Stripe Webhook — Verify DB Column Coverage
File: `apps/web/app/api/webhook/stripe/route.ts`

The webhook updates these fields on `businesses`:
- `stripe_subscription_id`
- `subscription_status`
- `trial_ends_at`
- `is_active`
- `stripe_customer_id` (set in checkout route)

Check if these columns exist in Supabase. If any are missing, write a SQL migration file at `supabase/migrations/[timestamp]_add_stripe_columns.sql` that adds them. Don't auto-run it — just create the file and note it needs to be run.

### 5. Env Var Audit
Audit every `process.env.*` reference across all API routes and list in a file `VERCEL-ENV-CHECKLIST.md` which vars must be set in Vercel production. Mark each as:
- ✅ CONFIRMED (if clearly set based on .env.local or project_status.md)
- ⚠️ NEEDS VERIFICATION (if uncertain)
- ❌ MISSING (if clearly absent)

Pay special attention to:
- `STRIPE_PRICE_ID` — is a real price ID set or just a placeholder?
- `STRIPE_WEBHOOK_SECRET` — must match Stripe dashboard webhook endpoint
- `NEXT_PUBLIC_APP_URL` — must be `https://nevermiss-delta.vercel.app` in prod
- `RESEND_API_KEY` — email notifications not wired, note this

### 6. Error Handling in Onboarding Number Step
File: `apps/web/app/(onboarding)/onboarding/number/number-view.tsx`

If `provisionNumber()` fails, the user sees an error and a "Try again" button. Good. But:
- If the area code has no available numbers, the error from the API is `"No available numbers in area code XXX. Try a different area code."` — but there's no UI to change the area code. The user is stuck.
- Fix: Add a fallback in the provision route that retries with area code `415` (SF) then `212` (NYC) then `800` (toll-free) if the preferred area code has no results. The user gets a number that works even if it's not local.

### 7. Dashboard Redirect After Onboarding
File: `apps/web/app/(onboarding)/onboarding/complete/page.tsx`

The complete page shows regardless of payment status. That's fine for trial.
But verify: when the user clicks "Go to Dashboard", does the dashboard properly handle a business with `subscription_status = 'trialing'`? It should show full access — not a paywall.

Check `apps/web/app/(dashboard)/dashboard/page.tsx` — if there's a subscription gate, make sure `trialing` is treated as active.

## Constraints — Do Not Change
- Design system (B&W, Apple aesthetic) — leave all styles alone
- ElevenLabs agent config — don't touch agent settings
- Supabase schema for `calls` table — leave as-is
- Twilio voice number +16196482491 — don't modify
- Landing page (`app/page.tsx`) — leave as-is

## Output
When done:
1. List every file changed and what was changed
2. Create `VERCEL-ENV-CHECKLIST.md` at the repo root
3. Create any SQL migration files needed in `supabase/migrations/`
4. Note anything that requires Steve's action (Stripe webhook registration, env var updates in Vercel dashboard, etc.) in `STEVE-ACTION-ITEMS.md`

## Success Criteria
A brand-new user can:
1. Sign up with Google
2. Enter business info
3. Get a real working Twilio number (auto-provisioned, no manual setup)
4. Test call it and hear the AI
5. Enter payment info (Stripe Checkout)
6. Land on the complete page and proceed to dashboard
7. All of this works in production at nevermiss-delta.vercel.app with zero intervention from Steve
