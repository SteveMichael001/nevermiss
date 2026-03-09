# Product Requirements Document — NeverMiss AI

**Version:** 2.0  
**Date:** March 9, 2026  
**Status:** MVP Live — Iterating

---

## 1. Product Overview

NeverMiss AI is an AI-powered phone answering service for home service contractors (plumbers, HVAC, electricians, roofers). When a contractor can't answer the phone, the AI picks up, has a natural conversation with the caller, captures their information, and immediately texts the business owner with the lead details.

**Core loop:** Customer calls → AI answers → captures lead → texts owner → owner calls back → wins the job.

**Live URL:** https://nevermiss-delta.vercel.app

---

## 2. Current Architecture

```
┌──────────────┐     ┌──────────────────────────────────────┐
│  Customer     │────▶│  Twilio (Inbound Voice)               │
│  Phone Call   │     │  +16196482491 (San Diego)             │
└──────────────┘     └──────────────┬───────────────────────┘
                                    │
                     ┌──────────────▼───────────────────────┐
                     │  ElevenLabs Conversational AI         │
                     │  (Native Twilio Integration)          │
                     │                                       │
                     │  - Agent: Sarah (AI receptionist)     │
                     │  - Dynamic variables via webhook      │
                     │  - Business name, owner, trade        │
                     │  - Captures: name, phone, service,    │
                     │    urgency, callback preference       │
                     └──────────────┬───────────────────────┘
                                    │
                     ┌──────────────▼───────────────────────┐
                     │  Post-Call Webhook (Vercel)           │
                     │  /api/webhook/elevenlabs              │
                     │                                       │
                     │  1. Parse transcript + extracted data │
                     │  2. Insert call record (Supabase)     │
                     │  3. Send SMS notification (Twilio)    │
                     │  4. Send email notification (Resend)  │
                     └──────────────┬───────────────────────┘
                                    │
                     ┌──────────────▼───────────────────────┐
                     │  Web App (Next.js on Vercel)          │
                     │                                       │
                     │  - Landing page (B&W design)          │
                     │  - Onboarding (4 steps)               │
                     │  - Dashboard (call log, settings)     │
                     │  - Billing (Stripe)                   │
                     └──────────────────────────────────────┘
```

---

## 3. Tech Stack (Actual)

| Layer | Technology | Notes |
|-------|-----------|-------|
| **Framework** | Next.js 14 (App Router) | Dashboard + API routes |
| **Hosting** | Vercel | All-in-one deployment |
| **Database** | Supabase (PostgreSQL) | Auth + data + storage |
| **Auth** | Supabase Auth (Google OAuth) | OAuth preferred over magic link |
| **Voice AI** | ElevenLabs Conversational AI | Native Twilio integration |
| **Phone** | Twilio Voice | +16196482491 for inbound calls |
| **SMS** | Twilio (Toll-Free) | +18339015846 (pending verification) |
| **Payments** | Stripe | Subscriptions + checkout |
| **Email** | Resend | Transactional (not yet wired) |

---

## 4. Phone Numbers

| Number | Purpose | Status |
|--------|---------|--------|
| +16196482491 | Inbound voice (AI answering) | ✅ Active |
| +18339015846 | Outbound SMS (lead alerts) | ⏳ Pending toll-free verification |

---

## 5. Design System

**Apple-style B&W palette. No accent colors.**

```css
--nm-black: #000000   /* Primary text, CTAs */
--nm-white: #ffffff   /* Backgrounds */
--nm-gray: #858484    /* Secondary text */
--nm-border: #e5e5e5  /* Borders, dividers */
--nm-soft: #f7f7f7    /* Subtle backgrounds */
```

Typography: Inter / SF Pro system stack.

---

## 6. User Flows

### Onboarding (4 steps)
1. **Business Setup** — Name, owner, trade, phone for SMS
2. **Phone Number** — Display assigned Twilio number
3. **Payment** — Stripe Checkout ($250/mo)
4. **Complete** — Success → Dashboard

### Dashboard
- **Call Log** — Table with caller, time, urgency, status
- **Call Detail** — Full transcript, extracted data
- **Settings** — Update business info, notification prefs
- **Billing** — Stripe Customer Portal

---

## 7. ElevenLabs Agent Config

**Agent ID:** `agent_0201kk1w0yzsf6vv5aqnkcpmh6wm`

**Variables Webhook:** `/api/webhook/elevenlabs/variables`
- Input: `caller_id`, `called_number`
- Output: `business_name`, `owner_name`, `trade`

**Post-Call Webhook:** `/api/webhook/elevenlabs`
- Receives: full transcript, extracted data, call metadata
- Actions: insert to Supabase, send SMS, send email

---

## 8. Database Schema (Current)

### businesses
- id, owner_id, name, trade, owner_name, owner_phone
- twilio_phone_number, subscription_status
- created_at, updated_at

### calls
- id, business_id, caller_name, caller_phone
- service_needed, urgency, preferred_callback
- full_transcript, duration_seconds
- lead_status (new, called_back, booked, lost)
- sms_sent_at, email_sent_at
- created_at

---

## 9. Pricing

**$250/month flat rate**
- Unlimited AI-answered calls
- Instant SMS + email notifications
- Call transcripts + dashboard
- 14-day free trial

---

## 10. Current Blockers

1. **SMS delivery blocked** — Toll-free number needs verification (1-3 business days)
2. **Email notifications** — Resend not fully wired
3. **Number provisioning** — Manual setup per customer (no self-serve yet)

---

## 11. Roadmap

### Phase 1: MVP Polish (Current)
- [x] Landing page
- [x] Onboarding flow
- [x] Dashboard
- [ ] SMS verification (blocked)
- [ ] End-to-end onboarding test

### Phase 2: Voice Quality
- [ ] ElevenLabs settings optimization
- [ ] ASR keyword injection (trade-specific vocabulary)
- [ ] TTS pronunciation dictionary

### Phase 3: Growth
- [ ] FB ads launch ($500 test)
- [ ] Landing page A/B testing
- [ ] Customer testimonials (real photos)

### Phase 4: Scale
- [ ] Self-serve number provisioning
- [ ] Multi-user dashboard
- [ ] Analytics + call quality metrics
