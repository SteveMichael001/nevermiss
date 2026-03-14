# NeverMiss AI

> AI phone answering for home service contractors. Never miss a lead again.

**Live:** [nevermiss-delta.vercel.app](https://nevermiss-delta.vercel.app) · **Phone:** +1 (619) 648-2491

---

## What It Does

Home service contractors (plumbers, HVAC, electricians, roofers) miss calls constantly — jobs, after-hours, busy on-site. NeverMiss routes those calls to an AI receptionist that captures the lead, extracts the job details, and sends the contractor an immediate SMS/email with everything they need to call back and close.

**The flow:**
1. Customer calls contractor's forwarded number
2. During business hours → rings owner first; AI picks up if no answer
3. After hours → AI answers immediately
4. AI captures name, job type, urgency, and contact info via natural conversation
5. Contractor gets instant SMS alert with transcript and callback context
6. All calls logged in dashboard with full transcripts and recordings

---

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 App Router |
| Hosting | Vercel |
| Auth | Supabase Auth |
| Database | Supabase PostgreSQL |
| Storage | Supabase Storage (call recordings) |
| Voice AI | ElevenLabs Conversational AI (native Twilio inbound) |
| Telephony | Twilio Voice + SMS |
| Email | Resend |
| Billing | Stripe Subscriptions + Customer Portal |

---

## Features

- **AI receptionist** — ElevenLabs voice agent with per-business dynamic variables (name, trade, business hours)
- **Smart routing** — Business-hours awareness, dial-owner-first with AI fallback
- **Lead capture** — Structured extraction of caller name, job type, phone, urgency from conversation transcript
- **Instant alerts** — SMS + email notification to contractor within seconds of call end
- **Dashboard** — Full call log, transcripts, recordings, lead status tracking
- **Self-serve onboarding** — Contractor signs up, enters business info, gets a phone number, starts 14-day trial — no human touchpoint required
- **Billing** — Stripe-powered subscriptions at $250/month

---

## Architecture

```
Inbound call → Twilio
  → Business hours? → Dial owner → No answer → ElevenLabs AI
  → After hours?    → ElevenLabs AI directly

ElevenLabs conversation completes →
  POST /api/webhook/elevenlabs (post-call)
    → Extract lead fields from transcript
    → Insert call record to Supabase
    → Send SMS via Twilio
    → Send email via Resend
    → Fetch + store recording to Supabase Storage

Web App (Next.js on Vercel):
  → Marketing site
  → Auth (Supabase)
  → Onboarding (4 steps: setup → number → test call → payment)
  → Dashboard (call log, transcripts, recordings, settings, billing)
```

---

## Status

MVP live as of March 2026. First real call logged March 11, 2026.

**Working:** Voice routing, AI answering, lead capture, call logging, transcripts, onboarding flow, dashboard, Stripe billing
**In progress:** Twilio toll-free SMS verification, call recording pipeline

---

## Pricing

$250/month · 14-day free trial · No setup fee · Cancel anytime

---

Built by [Steve Chranowski](https://stevechranowski.com)
