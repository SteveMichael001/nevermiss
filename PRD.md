# Product Requirements Document — NeverMiss AI

**Version:** 1.0
**Date:** March 4, 2026
**Status:** Ready for Engineering

---

## 1. Product Overview

NeverMiss AI is an AI-powered phone answering service for home service contractors (plumbers, HVAC, electricians, roofers). When a contractor can't answer the phone, the AI picks up, has a natural conversation with the caller, captures their information, and immediately texts the business owner with the lead details.

**Core loop:** Customer calls → AI answers → captures lead → texts owner → owner calls back → wins the job.

---

## 2. System Architecture

```
┌──────────────┐     ┌──────────────────────────────────────┐
│  Customer     │────▶│  Twilio (Inbound Voice)               │
│  Phone Call   │     │  - Dedicated number per business       │
└──────────────┘     │  - WebSocket media stream              │
                     └──────────────┬───────────────────────┘
                                    │
                     ┌──────────────▼───────────────────────┐
                     │  Voice AI Server (Node.js)            │
                     │                                       │
                     │  ┌─────────────┐  ┌────────────────┐ │
                     │  │ Deepgram    │  │ Deepgram Aura  │ │
                     │  │ Nova-3 STT  │  │ TTS            │ │
                     │  │ (streaming) │  │ (responses)    │ │
                     │  └──────┬──────┘  └───────▲────────┘ │
                     │         │                 │          │
                     │  ┌──────▼─────────────────┴────────┐ │
                     │  │ Conversation Engine              │ │
                     │  │ - State machine (greeting →      │ │
                     │  │   capture → confirm → goodbye)   │ │
                     │  │ - Claude Haiku for extraction     │ │
                     │  │ - Emergency keyword detection     │ │
                     │  │ - 3-minute max call duration      │ │
                     │  └──────┬──────────────────────────┘ │
                     └─────────┼────────────────────────────┘
                               │
                     ┌─────────▼────────────────────────────┐
                     │  Post-Call Pipeline                    │
                     │  1. Save call recording (Supabase)     │
                     │  2. Extract structured lead data (LLM) │
                     │  3. Send SMS notification (Twilio)     │
                     │  4. Send email notification (Resend)   │
                     │  5. Insert lead into database           │
                     └──────────────────────────────────────┘
                               │
                     ┌─────────▼────────────────────────────┐
                     │  Web Dashboard (Next.js + Supabase)   │
                     │  - Call log + audio playback           │
                     │  - Lead pipeline (New → Booked)        │
                     │  - Settings + onboarding               │
                     │  - Magic link auth                     │
                     └──────────────────────────────────────┘
```

---

## 3. Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Runtime** | Node.js 20+ | Twilio + Deepgram SDKs are Node-native |
| **Framework** | Next.js 14 (App Router) | Dashboard + API routes in one project |
| **Hosting** | Vercel (dashboard) + Railway (voice server) | Vercel for frontend, Railway for persistent WebSocket server |
| **Database** | Supabase (PostgreSQL) | Free tier, auth, realtime, storage |
| **Auth** | Supabase Auth (magic link) | No passwords |
| **Phone/SMS** | Twilio Voice + Messaging | Industry standard, cheapest per-minute |
| **STT** | Deepgram Nova-3 (streaming) | Best real-time accuracy, $0.0077/min |
| **TTS** | Deepgram Aura | Low latency, cheapest, same vendor as STT |
| **LLM** | Claude 3.5 Haiku (Anthropic API) | Sub-penny extraction, structured output |
| **Payments** | Stripe | Subscriptions + checkout |
| **Email** | Resend | Transactional email, free tier |
| **Audio Storage** | Supabase Storage | Integrated with DB, simple |

---

## 4. Database Schema

### Table: `businesses`
```sql
CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Auth
  owner_id UUID REFERENCES auth.users(id),
  
  -- Business info
  name TEXT NOT NULL,
  trade TEXT NOT NULL, -- 'plumbing', 'hvac', 'electrical', 'roofing', 'pest_control', 'landscaping', 'general'
  owner_name TEXT NOT NULL,
  owner_phone TEXT NOT NULL,        -- For SMS notifications
  owner_email TEXT NOT NULL,        -- For email notifications
  
  -- Twilio
  twilio_phone_number TEXT,         -- Provisioned Twilio number
  twilio_phone_sid TEXT,            -- Twilio phone number SID
  forward_from_number TEXT,         -- Business's existing number (for reference)
  
  -- Settings
  greeting_text TEXT,               -- Custom greeting (null = use default for trade)
  business_hours JSONB,             -- { mon: {open: "08:00", close: "17:00"}, ... }
  notification_phones TEXT[],       -- Additional SMS recipients
  notification_emails TEXT[],       -- Additional email recipients
  max_call_duration_seconds INT DEFAULT 180,
  
  -- Billing
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status TEXT DEFAULT 'trialing', -- trialing, active, past_due, canceled
  trial_ends_at TIMESTAMPTZ,
  
  -- Status
  is_active BOOLEAN DEFAULT true
);
```

### Table: `calls`
```sql
CREATE TABLE calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Twilio call data
  twilio_call_sid TEXT UNIQUE NOT NULL,
  caller_phone TEXT,                -- Caller's phone number (from Twilio)
  duration_seconds INT,
  recording_url TEXT,               -- Supabase Storage URL
  recording_duration_seconds INT,
  
  -- AI extraction
  caller_name TEXT,
  service_needed TEXT,
  urgency TEXT DEFAULT 'routine',   -- 'emergency', 'urgent', 'routine', 'unknown'
  preferred_callback TEXT,          -- Free text: "ASAP", "morning", "after 3pm"
  full_transcript TEXT,
  extraction_json JSONB,            -- Raw LLM extraction output
  
  -- Status
  lead_status TEXT DEFAULT 'new',   -- 'new', 'called_back', 'booked', 'lost'
  
  -- Notifications
  sms_sent_at TIMESTAMPTZ,
  email_sent_at TIMESTAMPTZ,
  notification_latency_ms INT       -- Time from call end to SMS delivery
);
```

### Table: `trade_prompts`
```sql
CREATE TABLE trade_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade TEXT UNIQUE NOT NULL,
  system_prompt TEXT NOT NULL,       -- AI system prompt for this trade
  greeting_template TEXT NOT NULL,   -- Default greeting
  emergency_keywords TEXT[] NOT NULL, -- Keywords that trigger emergency flag
  common_services TEXT[] NOT NULL    -- Common services for context
);
```

### Seed data for `trade_prompts`:
```sql
INSERT INTO trade_prompts (trade, system_prompt, greeting_template, emergency_keywords, common_services) VALUES
('plumbing', 
 'You are a friendly, professional receptionist for a plumbing business. Your job is to capture the caller''s name, phone number, what plumbing issue they need help with, and how urgent it is. Be warm, efficient, and knowledgeable about common plumbing terminology. Keep the call under 2 minutes.',
 'Hi, thanks for calling {business_name}. We can''t get to the phone right now, but I''d love to help. Can I get your name and what you need help with?',
 ARRAY['burst pipe', 'flooding', 'flood', 'sewage', 'sewer backup', 'gas leak', 'gas smell', 'no water', 'water everywhere', 'pipe burst', 'emergency', 'overflowing'],
 ARRAY['drain cleaning', 'water heater', 'leak repair', 'pipe repair', 'sewer line', 'toilet repair', 'faucet', 'garbage disposal', 'water softener', 'repiping', 'hydro jetting', 'slab leak']),

('hvac',
 'You are a friendly, professional receptionist for an HVAC business. Your job is to capture the caller''s name, phone number, what heating or cooling issue they need help with, and how urgent it is. Be warm, efficient, and knowledgeable about common HVAC terminology. Keep the call under 2 minutes.',
 'Hi, thanks for calling {business_name}. We can''t get to the phone right now, but I''d love to help. Can I get your name and what you need help with?',
 ARRAY['no heat', 'no ac', 'no air conditioning', 'no cooling', 'gas smell', 'gas leak', 'carbon monoxide', 'co detector', 'furnace not working', 'heater not working', 'emergency', 'freezing'],
 ARRAY['AC repair', 'furnace repair', 'heat pump', 'thermostat', 'ductwork', 'AC installation', 'furnace installation', 'maintenance', 'tune-up', 'refrigerant', 'compressor', 'blower motor']),

('electrical',
 'You are a friendly, professional receptionist for an electrical business. Your job is to capture the caller''s name, phone number, what electrical issue they need help with, and how urgent it is. Be warm, efficient, and knowledgeable about common electrical terminology. Keep the call under 2 minutes.',
 'Hi, thanks for calling {business_name}. We can''t get to the phone right now, but I''d love to help. Can I get your name and what you need help with?',
 ARRAY['sparking', 'electrical fire', 'burning smell', 'power outage', 'no power', 'exposed wires', 'shock', 'electrocution', 'emergency', 'smoke from outlet'],
 ARRAY['panel upgrade', 'outlet repair', 'wiring', 'lighting', 'ceiling fan', 'circuit breaker', 'generator', 'EV charger', 'rewiring', 'code violation', 'inspection']),

('roofing',
 'You are a friendly, professional receptionist for a roofing business. Your job is to capture the caller''s name, phone number, what roofing issue they need help with, and how urgent it is. Be warm, efficient, and knowledgeable about common roofing terminology. Keep the call under 2 minutes.',
 'Hi, thanks for calling {business_name}. We can''t get to the phone right now, but I''d love to help. Can I get your name and what you need help with?',
 ARRAY['roof collapse', 'major leak', 'tree fell on roof', 'storm damage', 'emergency', 'water pouring in', 'ceiling caving'],
 ARRAY['roof repair', 'roof replacement', 'leak repair', 'shingle repair', 'tile roof', 'flat roof', 'gutter', 'inspection', 'estimate', 'storm damage', 'insurance claim']),

('pest_control',
 'You are a friendly, professional receptionist for a pest control business. Your job is to capture the caller''s name, phone number, what pest issue they need help with, and how urgent it is. Be warm, efficient, and knowledgeable about common pest control terminology. Keep the call under 2 minutes.',
 'Hi, thanks for calling {business_name}. We can''t get to the phone right now, but I''d love to help. Can I get your name and what you need help with?',
 ARRAY['bee swarm', 'wasp nest', 'snake inside', 'scorpion', 'emergency', 'infestation', 'bitten', 'rats in walls'],
 ARRAY['termite inspection', 'ant treatment', 'rodent control', 'bed bugs', 'cockroach', 'spider', 'mosquito', 'wildlife removal', 'fumigation', 'preventive treatment']),

('general',
 'You are a friendly, professional receptionist for a home services business. Your job is to capture the caller''s name, phone number, what service they need help with, and how urgent it is. Be warm, efficient, and conversational. Keep the call under 2 minutes.',
 'Hi, thanks for calling {business_name}. We can''t get to the phone right now, but I''d love to help. Can I get your name and what you need help with?',
 ARRAY['emergency', 'urgent', 'dangerous', 'flooding', 'fire', 'gas leak'],
 ARRAY['repair', 'installation', 'maintenance', 'inspection', 'estimate', 'consultation']);
```

---

## 5. API Endpoints

### Voice Server (Railway — separate from Next.js)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/webhook/twilio/voice` | Twilio incoming call webhook — initiates AI conversation |
| POST | `/webhook/twilio/status` | Twilio call status callback (completed, failed, etc.) |
| POST | `/webhook/twilio/recording` | Twilio recording ready callback |
| WS | `/media-stream` | Twilio media stream WebSocket for real-time audio |

### Next.js API Routes (Vercel)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/calls` | List calls for authenticated business (paginated) |
| GET | `/api/calls/[id]` | Get single call details + transcript |
| PATCH | `/api/calls/[id]` | Update lead status (new → called_back → booked → lost) |
| GET | `/api/calls/[id]/audio` | Signed URL for call recording playback |
| GET | `/api/business` | Get current business profile + settings |
| PATCH | `/api/business` | Update business settings (greeting, notifications, hours) |
| POST | `/api/business/test-call` | Trigger a test call to the business's AI number |
| POST | `/api/onboarding/provision` | Provision Twilio number + create business record |
| POST | `/api/billing/checkout` | Create Stripe checkout session |
| POST | `/api/billing/portal` | Create Stripe billing portal session |
| POST | `/webhook/stripe` | Stripe webhook (subscription events) |

---

## 6. Conversation Engine (Voice Server)

### State Machine

```
GREETING → CAPTURE_NAME → CAPTURE_ISSUE → ASSESS_URGENCY → CAPTURE_CALLBACK → CONFIRM → GOODBYE
```

Each state:

**GREETING**
- AI delivers trade-specific greeting with business name
- Transitions to CAPTURE_NAME after greeting plays

**CAPTURE_NAME**
- AI asks for caller's name if not already captured
- Caller ID phone number is captured automatically from Twilio
- "Can I get your name?"

**CAPTURE_ISSUE**
- AI asks what they need help with
- "What can we help you with today?"
- Listens for trade-specific service keywords
- Scans for emergency keywords in real-time

**ASSESS_URGENCY**
- If emergency keywords detected → set urgency = "emergency"
- If caller expresses frustration/urgency → set urgency = "urgent"
- Otherwise → urgency = "routine"
- For emergencies: "That sounds urgent — I'll make sure [Owner] gets this message right away."

**CAPTURE_CALLBACK**
- "When's the best time for [Owner] to call you back?"
- Accept freeform: "ASAP", "after 3", "tomorrow morning", etc.

**CONFIRM**
- AI reads back: "Just to confirm — you're [Name], you need help with [Issue], and you'd like a call back [Time]. Is that right?"
- If caller corrects → update and re-confirm
- If caller confirms → GOODBYE

**GOODBYE**
- "Great, I've passed your info along to [Owner]. They'll give you a call [timeframe]. Thanks for calling [Business]!"
- End call

### Escape Hatch
At ANY point, if caller says "I need to talk to someone" / "real person" / "human" / "let me speak to someone":
- AI responds: "I completely understand. I'll make sure [Owner] gets your message right away and calls you back as soon as possible."
- Flag as urgency = "urgent"
- End call gracefully
- Do NOT attempt to transfer (V1 — no live transfer capability)

### Guard Rails
- **Max call duration:** 3 minutes. At 2:30, AI wraps up: "I want to make sure I get this to [Owner] quickly. Let me confirm what I have..."
- **Spam detection:** If caller is clearly a robocall or sales pitch (detected by LLM), log as spam and end gracefully
- **Off-topic:** If caller asks questions AI can't answer, deflect: "That's a great question — [Owner] would be the best person to help you with that. Let me get your info so they can call you back."
- **California two-party consent:** AI MUST say at start of call: "This call may be recorded for quality purposes."

---

## 7. Notification Format

### SMS (via Twilio)
```
🔔 New Lead — {business_name}

👤 {caller_name}
📞 {caller_phone}
🔧 {service_needed}
⏰ Callback: {preferred_callback}

Tap to call back:
tel:{caller_phone}
```

For emergencies, prepend:
```
🚨 EMERGENCY — {business_name}

👤 {caller_name}
📞 {caller_phone}
🔧 {service_needed} [URGENT]
⏰ Callback: ASAP

Tap to call back:
tel:{caller_phone}
```

### Email (via Resend)
Subject: `[NeverMiss] New lead: {caller_name} — {service_needed}`

Body:
- Lead summary (same as SMS)
- Full call transcript
- Link to audio recording (signed URL, 24hr expiry)
- Link to dashboard

---

## 8. Dashboard Pages

### `/login`
- Email input → magic link sent via Supabase Auth
- "Check your email for a login link"

### `/dashboard` (default — call log)
- Table: Date/Time | Caller | Phone | Issue | Urgency | Status | Audio
- Urgency badge: 🔴 Emergency, 🟡 Urgent, 🟢 Routine
- Status dropdown: New → Called Back → Booked → Lost
- Click row → expand with full transcript
- Audio player inline
- Filter: by date range, urgency, status
- Pagination: 25 per page

### `/dashboard/settings`
- Business name (editable)
- Trade type (dropdown)
- Owner name + phone + email
- Custom greeting text (with preview/test button)
- Additional notification recipients (phone + email)
- Business hours (per-day open/close times)
- Your AI phone number (display only, with call-forwarding instructions)

### `/dashboard/billing`
- Current plan: $250/mo
- Stripe billing portal link (manage card, invoices, cancel)
- Usage stats: total calls this month, calls today

### Design
- Clean, minimal. Dark sidebar, white content area.
- Mobile-first. Every interaction must work on a phone screen.
- No heavy frameworks. Tailwind CSS + shadcn/ui components.

---

## 9. Onboarding Flow

### Step 1: Sign Up
```
/signup
- Business name
- Your name
- Email
- Phone number
- Trade type (dropdown: Plumbing, HVAC, Electrical, Roofing, Pest Control, Landscaping, Other)
- [Continue] → sends magic link
```

### Step 2: Verify Email
```
Click magic link → authenticated → redirect to /onboarding/setup
```

### Step 3: Setup
```
/onboarding/setup
- Preview default greeting (based on trade)
- Option to customize greeting text
- [Continue]
```

### Step 4: Get Your Number
```
/onboarding/number
- System provisions local Twilio number (same area code as owner's phone)
- Display: "Your AI answering number: (619) 555-XXXX"
- Show call-forwarding instructions for:
  - iPhone: Settings → Phone → Call Forwarding
  - Android: Phone app → Settings → Call Forwarding
  - Carrier-specific codes (*72, *73, etc.)
- [I've set up forwarding] → continue
```

### Step 5: Test Call
```
/onboarding/test
- "Call your AI number now to hear it in action!"
- Display phone number prominently
- Real-time status: "Waiting for test call..." → "Call received!" → "Lead captured!"
- Show the SMS notification that was sent
- [It works!] → continue
```

### Step 6: Payment
```
/onboarding/payment
- "$250/month — 14-day free trial"
- "You won't be charged until [date + 14 days]"
- Stripe Checkout embed
- [Start Free Trial]
```

### Step 7: Done
```
/onboarding/complete
- "You're live! 🎉"
- "Calls to your AI number will now be answered 24/7"
- Quick links: Dashboard, Settings, Support
- [Go to Dashboard]
```

---

## 10. Stripe Integration

### Subscription
- Single product: "NeverMiss AI" — $250/mo
- 14-day free trial (requires payment method)
- Webhook events to handle:
  - `checkout.session.completed` → activate subscription
  - `invoice.paid` → confirm payment
  - `invoice.payment_failed` → flag account, send warning email
  - `customer.subscription.deleted` → deactivate business, stop answering calls

### On subscription cancel/fail:
- Set `businesses.is_active = false`
- Twilio stops answering (webhook returns standard voicemail)
- Owner gets email: "Your NeverMiss AI service has been paused. Reactivate at [link]."

---

## 11. File/Folder Structure

```
nevermiss/
├── README.md
├── package.json
├── .env.example
├── .env.local                    # Local env (gitignored)
│
├── apps/
│   ├── web/                      # Next.js dashboard (Vercel)
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   ├── login/page.tsx
│   │   │   │   └── signup/page.tsx
│   │   │   ├── (dashboard)/
│   │   │   │   ├── dashboard/page.tsx         # Call log
│   │   │   │   ├── dashboard/settings/page.tsx
│   │   │   │   └── dashboard/billing/page.tsx
│   │   │   ├── (onboarding)/
│   │   │   │   ├── onboarding/setup/page.tsx
│   │   │   │   ├── onboarding/number/page.tsx
│   │   │   │   ├── onboarding/test/page.tsx
│   │   │   │   ├── onboarding/payment/page.tsx
│   │   │   │   └── onboarding/complete/page.tsx
│   │   │   ├── api/
│   │   │   │   ├── calls/route.ts
│   │   │   │   ├── calls/[id]/route.ts
│   │   │   │   ├── calls/[id]/audio/route.ts
│   │   │   │   ├── business/route.ts
│   │   │   │   ├── business/test-call/route.ts
│   │   │   │   ├── onboarding/provision/route.ts
│   │   │   │   ├── billing/checkout/route.ts
│   │   │   │   ├── billing/portal/route.ts
│   │   │   │   └── webhook/stripe/route.ts
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx                       # Landing page
│   │   ├── components/
│   │   │   ├── ui/                            # shadcn/ui components
│   │   │   ├── call-log-table.tsx
│   │   │   ├── audio-player.tsx
│   │   │   ├── lead-status-badge.tsx
│   │   │   ├── urgency-badge.tsx
│   │   │   └── onboarding-steps.tsx
│   │   ├── lib/
│   │   │   ├── supabase/client.ts
│   │   │   ├── supabase/server.ts
│   │   │   ├── stripe.ts
│   │   │   └── utils.ts
│   │   ├── tailwind.config.ts
│   │   ├── next.config.js
│   │   └── tsconfig.json
│   │
│   └── voice/                    # Voice AI server (Railway)
│       ├── src/
│       │   ├── index.ts                       # Express + WebSocket server
│       │   ├── twilio/
│       │   │   ├── webhook.ts                 # Incoming call handler
│       │   │   ├── media-stream.ts            # WebSocket media stream
│       │   │   └── sms.ts                     # Send SMS notifications
│       │   ├── ai/
│       │   │   ├── conversation-engine.ts     # State machine
│       │   │   ├── deepgram-stt.ts            # Streaming transcription
│       │   │   ├── deepgram-tts.ts            # Text-to-speech
│       │   │   ├── extraction.ts              # Claude Haiku lead extraction
│       │   │   └── emergency-detector.ts      # Emergency keyword matching
│       │   ├── prompts/
│       │   │   └── trade-prompts.ts           # Trade-specific prompt templates
│       │   ├── notifications/
│       │   │   ├── sms.ts
│       │   │   └── email.ts
│       │   ├── db/
│       │   │   └── supabase.ts                # Supabase client for voice server
│       │   └── types.ts
│       ├── package.json
│       └── tsconfig.json
│
├── packages/
│   └── shared/                   # Shared types, constants
│       ├── types.ts
│       └── constants.ts
│
└── supabase/
    ├── migrations/
    │   └── 001_initial_schema.sql
    └── seed.sql                  # Trade prompts seed data
```

---

## 12. Environment Variables

```env
# Twilio
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=          # Default/fallback number

# Deepgram
DEEPGRAM_API_KEY=

# Anthropic (Claude Haiku)
ANTHROPIC_API_KEY=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID=              # $250/mo price ID
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Resend
RESEND_API_KEY=

# Voice Server
VOICE_SERVER_URL=             # Railway URL for voice server
PORT=3001                     # Voice server port
```

---

## 13. Acceptance Criteria (V1 Launch)

### Must Have (Launch Blockers)
- [ ] AI answers inbound Twilio calls with trade-specific greeting
- [ ] AI captures: caller name, phone, service needed, urgency, callback preference
- [ ] AI confirms captured info before ending call
- [ ] Emergency keywords trigger urgency flag
- [ ] SMS notification delivered within 60 seconds of call end
- [ ] Call recording stored and playable
- [ ] Full transcript generated and stored
- [ ] Dashboard: call log with search/filter, audio playback, lead status management
- [ ] Dashboard: settings page (greeting, notifications, business hours)
- [ ] Magic link auth (no passwords)
- [ ] Mobile-responsive dashboard
- [ ] Onboarding flow: signup → number provisioning → test call → Stripe payment
- [ ] 14-day free trial with Stripe billing
- [ ] California two-party consent disclosure at call start
- [ ] Caller can request a human at any point (graceful handling)
- [ ] 3-minute max call duration guard rail

### Should Have (Post-Launch Priority)
- [ ] Email notifications with transcript + audio link
- [ ] Spam/robocall detection and filtering
- [ ] Additional notification recipients (team members)
- [ ] Dashboard: billing page with usage stats
- [ ] Landing page with demo and pricing
- [ ] Call forwarding setup instructions per carrier

### Won't Have (V1)
- Calendar/scheduling integration
- ServiceTitan/Jobber/Housecall Pro integration
- Spanish/bilingual support
- Outbound calls
- Mobile app
- Zapier/webhooks
- Auto-follow-up SMS
- Voice cloning
- Multi-location support

---

## 14. Testing Plan

### Voice Pipeline
1. **Happy path:** Call AI number → natural conversation → lead captured → SMS received within 60s
2. **Emergency path:** Call with "my pipe burst" → urgency = emergency → SMS with 🚨
3. **Escape hatch:** Say "I want to talk to a real person" → AI deflects gracefully, flags urgent
4. **Timeout:** Stay silent / ramble for 3+ minutes → AI wraps up at 2:30
5. **Spam:** Robocall or sales pitch → AI detects and ends gracefully
6. **Off-topic:** Ask AI about weather → AI deflects to lead capture
7. **Multiple calls:** 3 simultaneous calls → all handled independently

### Dashboard
1. Call log populates in real-time after calls
2. Audio playback works on mobile and desktop
3. Lead status updates persist
4. Settings changes reflect in next call's greeting
5. Magic link login works on mobile

### Billing
1. Free trial activates on signup (14 days)
2. First charge on day 15
3. Failed payment → account flagged, calls stop
4. Cancel → calls stop, data retained for 30 days

---

## References

- Business Requirements: `projects/ai-voicemail/brd.md`
- Competitive Research: `projects/ai-voicemail/competitors.md`
- Business Model: `projects/ai-voicemail/business-model.md`
- Previous MVP Spec: `projects/ai-voicemail/mvp-spec.md`
- Tech Stack Analysis: `projects/ai-voicemail/tech-stack.md`
