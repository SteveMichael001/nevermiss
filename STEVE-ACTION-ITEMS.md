# Steve Action Items

Audit date: March 10, 2026

1. In Vercel Production, set `NEXT_PUBLIC_APP_URL=https://nevermiss-delta.vercel.app`.
2. In Vercel Production, verify `STRIPE_PRICE_ID` is set to the real `$250/mo` Stripe Price ID.
3. In Vercel Production, add `STRIPE_WEBHOOK_SECRET` from the Stripe webhook endpoint configured for `https://nevermiss-delta.vercel.app/api/webhook/stripe`.
4. In Stripe, confirm the webhook endpoint above is registered and includes at least:
   `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted`.
5. In Vercel Production, set `DASHBOARD_URL=https://nevermiss-delta.vercel.app` so email links point to the live app.
6. Verify `FROM_EMAIL` is a valid Resend sender identity for production delivery.
7. Keep `SKIP_TWILIO_VALIDATION` unset in production.
8. Complete Twilio toll-free verification for `+18339015846`; SMS notifications remain blocked until Twilio approves it.
9. Run the Supabase migrations in the target environment if it is not already on the schema from [001_initial_schema.sql](/Users/stevechranowskiaiworkspace/Projects/nevermiss/supabase/migrations/001_initial_schema.sql). No new Stripe migration file was needed because the required billing columns already exist there.
10. Run one live production onboarding test after the env updates: Google sign-up, business setup, number provisioning, test call, Stripe checkout, dashboard entry.
