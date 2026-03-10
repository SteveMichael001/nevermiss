# Vercel Env Checklist

Audit date: March 10, 2026
Production target: `https://nevermiss-delta.vercel.app`

Legend:
- `✅ CONFIRMED` = clearly supported by `PROJECT_STATUS.md` or required by live features already described there
- `⚠️ NEEDS VERIFICATION` = referenced in runtime code but not clearly proven in production config
- `❌ MISSING` = referenced in runtime code and not present in the documented Vercel env list

## Required Runtime Vars

| Variable | Status | Used in | Notes |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ CONFIRMED | middleware, Supabase clients, ElevenLabs/Twilio webhooks | App and dashboard are live, so auth/data access depends on this. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ CONFIRMED | middleware, Supabase clients | Required for auth/session handling in the live app. |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ CONFIRMED | server admin client, ElevenLabs/Twilio webhook routes | Live webhook logging depends on this. |
| `TWILIO_ACCOUNT_SID` | ✅ CONFIRMED | onboarding provisioning, SMS, scripts | Voice flow is live per `PROJECT_STATUS.md`. |
| `TWILIO_AUTH_TOKEN` | ✅ CONFIRMED | onboarding provisioning, SMS, Twilio signature validation | Required for live Twilio routing and signature checks. |
| `TWILIO_PHONE_NUMBER` | ✅ CONFIRMED | SMS fallback sender | Listed in `PROJECT_STATUS.md` as the live voice number. |
| `TWILIO_SMS_NUMBER` | ✅ CONFIRMED | SMS sender override | Listed in `PROJECT_STATUS.md` as the toll-free SMS number. |
| `ELEVENLABS_AGENT_ID` | ✅ CONFIRMED | Twilio voice webhook | The shared agent is live in the current flow. |
| `ELEVENLABS_WEBHOOK_SECRET` | ✅ CONFIRMED | ElevenLabs post-call webhook | `PROJECT_STATUS.md` says it is configured. |
| `STRIPE_SECRET_KEY` | ⚠️ NEEDS VERIFICATION | Stripe checkout, Stripe webhook | Runtime code requires it, but production setup is not documented as verified. |
| `STRIPE_PRICE_ID` | ❌ MISSING | Stripe checkout | Referenced in code, but absent from the documented Vercel env list in `PROJECT_STATUS.md`. Confirm this is a real Stripe Price ID, not a placeholder. |
| `STRIPE_WEBHOOK_SECRET` | ❌ MISSING | Stripe webhook | Referenced in code, but absent from the documented Vercel env list in `PROJECT_STATUS.md`. Must match the webhook endpoint registered in Stripe. |
| `NEXT_PUBLIC_APP_URL` | ⚠️ NEEDS VERIFICATION | Twilio provisioning, Twilio signature validation | Must be `https://nevermiss-delta.vercel.app` in production. Code now falls back safely, but this should still be set correctly in Vercel. |
| `VERCEL_URL` | ✅ CONFIRMED | production URL fallback for Twilio routes | Auto-provided by Vercel; code now uses it as a fallback. |

## Email / Notification Vars

| Variable | Status | Used in | Notes |
| --- | --- | --- | --- |
| `RESEND_API_KEY` | ✅ CONFIRMED | email notifications | `PROJECT_STATUS.md` says the Resend API key is configured, but email notifications are still not fully wired. |
| `FROM_EMAIL` | ⚠️ NEEDS VERIFICATION | email notifications | Optional in code, but production sender/domain should be verified. |
| `DASHBOARD_URL` | ⚠️ NEEDS VERIFICATION | email notification links | Optional in code. Current fallback is `https://app.nevermiss.ai`, which does not match the live app domain. Set this to `https://nevermiss-delta.vercel.app`. |

## Optional / Safety Vars

| Variable | Status | Used in | Notes |
| --- | --- | --- | --- |
| `SKIP_TWILIO_VALIDATION` | ⚠️ NEEDS VERIFICATION | Twilio voice webhook | Should be unset in production. If set to `true`, Twilio signature validation is bypassed. |
| `NODE_ENV` | ✅ CONFIRMED | webhook security branches | Vercel sets this automatically in production. |

## Notable Findings

- The production app URL bug was real in the provisioning path because the code previously trusted `NEXT_PUBLIC_APP_URL` directly.
- `STRIPE_PRICE_ID` and `STRIPE_WEBHOOK_SECRET` are the main documented gaps for production billing.
- `DASHBOARD_URL` should be updated to the live Vercel domain or email links will point at the wrong host.
