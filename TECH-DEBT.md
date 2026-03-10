# TECH-DEBT

| Item | Why it matters | Effort |
| --- | --- | --- |
| Shared ElevenLabs agent for all businesses | Limits voice customization, prompt tuning, and business-specific experimentation | Medium |
| Manual call forwarding setup | Conversion and onboarding completion depend on the customer following instructions correctly | Medium |
| Pricing source of truth is split | Landing page says `$297`, Stripe billing config uses `$250`; this will create sales and support issues | Low |
| No database uniqueness on `elevenlabs_conversation_id` | Duplicate defense exists in application code, but the database still allows races under concurrency | Medium |
| No monitoring or alerting stack | Failures in webhooks, Twilio provisioning, SMS, or recordings can go unnoticed in production | Medium |
| No rate limiting on public or authenticated API routes | Exposes webhook endpoints and dashboard APIs to abuse and accidental traffic spikes | Medium |
| Notification work runs inline in webhook handlers | Slow SMS/email/recording calls increase latency and couple delivery to webhook execution time | Medium |
| Onboarding test view uses client polling | Fine for MVP, but wasteful and noisy at scale compared with realtime or server push | Low |
| Single-business-per-user assumption | Blocks agency/admin use cases and complicates future team access features | High |
| Timezone and business-hours management is basic | Schema supports timezone, but the product still lacks stronger admin UX and validation around schedule setup | Low |
| No end-to-end automated test suite | Core flows span Twilio, ElevenLabs, Stripe, and Supabase; regressions are easy to miss without integration coverage | Medium |
| No dead-letter/retry workflow for recordings and notifications | Transient failures are logged but not retried through a job system | Medium |
