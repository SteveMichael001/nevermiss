# Business Requirements Document — AI Voicemail for Home Services

**Working Title:** NeverMiss AI
**Version:** 1.0
**Date:** March 4, 2026
**Author:** Maggie (on behalf of Steve Chranowski)
**Status:** Draft — Awaiting Steve's Review

---

## 1. Executive Summary

Home service contractors (plumbers, HVAC, electricians, roofers, pest control) lose an estimated **$50,000/year** in revenue from missed calls. Industry data shows **27% of inbound calls go unanswered**, and **80% of callers who hit voicemail hang up** and call the next contractor immediately. Each missed call represents roughly **$1,200 in lost revenue**.

NeverMiss AI is an AI-powered answering service that picks up the phone when the contractor can't, captures the caller's information conversationally, and instantly texts the business owner with the lead details. It replaces voicemail — not the contractor.

**The pitch is simple:** For $250/month — less than one missed weekend job — you never lose a lead to voicemail again.

This is not a technology sale. It's a receptionist replacement at 1/10th the cost. The customer doesn't need to understand AI, Twilio, or speech-to-text. They need their phone answered and their leads captured.

---

## 2. Problem Statement

### The Contractor's Reality
- A plumber can't answer the phone from under a sink
- An HVAC tech can't take calls from a rooftop
- A roofer mid-job has no hands free
- After 5 PM, weekends, and holidays — nobody's answering at all

### What Happens Today
1. Customer calls → voicemail → hangs up → calls competitor
2. Customer calls → no answer → assumes business is closed → calls competitor
3. Customer calls after hours → emergency (burst pipe, no heat) → no response → calls competitor

### The Pain in Numbers
| Metric | Value | Source |
|--------|-------|--------|
| Calls that go unanswered | 27% | Housecall Pro |
| Callers who hang up on voicemail | 80-85% | Industry research |
| Average value per missed call | $1,200 | Ring Eden / industry avg |
| Estimated annual lost revenue | $50,000+ | Per-business estimate |
| After-hours emergency call loss rate | 30% | Industry data |

### Why Current Solutions Fail

**Traditional answering services** ($300-1,000+/mo): Too expensive for 1-5 truck shops. Per-minute billing punishes high-volume businesses. Human agents don't know trade terminology.

**Premium AI platforms** (Sameday AI at $449+/mo): Great product, priced for mid-to-large contractors with ServiceTitan. A 2-truck plumber won't spend $449/mo on phone answering.

**Cheap generic AI** ($29-49/mo): Don't know the difference between hydro jetting and drain snaking. Sound robotic. Trap callers in loops. No emergency escalation.

**The gap:** Nobody owns the **$200-300/mo, home-services-specific, dead-simple** tier for the small-to-mid contractor.

---

## 3. Business Objectives

### Primary Objectives
1. **Launch a paid product within 6 weeks** — pre-sell to 5 local businesses, build MVP, go live
2. **Reach 20 paying customers within 90 days** of launch — all through direct sales in San Diego
3. **Achieve $5,000 MRR within 6 months** — 20 customers × $250/mo
4. **Maintain 85%+ gross margins** — COGS at ~$0.05/call makes this structurally possible

### Secondary Objectives
1. Validate the direct sales channel (cold call / door-to-door) as the primary GTM
2. Build a referenceable customer base for case studies and referrals
3. Establish the product as a natural upsell for Bridge Source's existing client relationships
4. Create a repeatable sales playbook that can be handed to SDRs later

### Success Criteria (6-Month Gate)
| Metric | Target |
|--------|--------|
| Paying customers | 20+ |
| MRR | $5,000+ |
| Monthly churn | <5% |
| Customer satisfaction | 90%+ (NPS or direct feedback) |
| Average booking rate (calls → leads captured) | 85%+ |
| Call-to-notification latency | <60 seconds |

---

## 4. Target Market

### Ideal Customer Profile (ICP)
- **Business type:** Home service contractor — plumbing, HVAC, electrical, roofing, pest control, landscaping, garage door, general contracting
- **Company size:** 1-10 employees (owner-operator to small team)
- **Revenue:** $200K-$2M/year
- **Location:** San Diego metro (launch market), expandable to any US metro
- **Current phone setup:** Personal cell, Google Voice, basic business line, or answering machine
- **Pain level:** Missing calls regularly, especially after hours and while on jobs
- **Tech sophistication:** Low to moderate — uses a smartphone, maybe Jobber or Housecall Pro, definitely not ServiceTitan
- **Decision maker:** The owner. Period. No procurement department, no committee.

### Who This Is NOT For (V1)
- Large contractors (20+ trucks) who already have CSR teams or Sameday AI
- Businesses that need full appointment booking and CRM integration from day one
- Multi-location franchises
- Non-English-only markets (V2)

### Market Sizing

| Tier | Size | Description |
|------|------|-------------|
| **TAM** | $1.6B/year | 900K+ home service businesses in the US × $149/mo avg |
| **SAM** | $715M/year | ~400K businesses with 1-20 employees who miss after-hours calls |
| **SOM (Year 1)** | $60K-$300K ARR | San Diego metro: ~5,000 home service businesses. Realistic capture: 20-100 customers |

---

## 5. User Personas

### Persona 1: Mike the Solo Plumber
- **Profile:** 38, runs his own plumbing business for 6 years, 1 truck
- **Revenue:** ~$350K/year
- **Phone situation:** Personal cell. Misses calls constantly while under sinks, driving, eating dinner. Wife sometimes answers.
- **Current solution:** Voicemail. Checks it 2-3x/day. Knows he's losing jobs.
- **Objections:** "I don't want my customers talking to a robot." / "Is it going to sound weird?"
- **What closes him:** Live demo call on the spot. Hears the AI sound natural. Sees the SMS hit within 30 seconds. Does the math on one missed weekend job vs. $250/mo.
- **Quote:** "I know I'm losing money. I just don't have time to answer every call."

### Persona 2: Sarah the HVAC Shop Owner
- **Profile:** 45, owns a 4-tech HVAC company, has a part-time office person
- **Revenue:** ~$1.2M/year
- **Phone situation:** Office person handles calls M-F 8-5. After hours and weekends go to voicemail. Misses emergency calls (no heat in winter, no AC in summer).
- **Current solution:** Has looked at answering services, found them too expensive or too generic
- **Objections:** "We tried an answering service before and the agents didn't know HVAC." / "Will it handle emergencies?"
- **What closes her:** Emergency escalation demo — AI recognizes "no heat" as urgent and texts her immediately with red urgency flag. The after-hours capture alone pays for 12 months.
- **Quote:** "We lost a $4,000 furnace install last month because the homeowner called at 7 PM on a Friday and we didn't pick up."

### Persona 3: Carlos the Roofer
- **Profile:** 52, been roofing for 25 years, 6-person crew
- **Revenue:** ~$800K/year
- **Phone situation:** Never answers on the roof. Crew lead sometimes takes calls but hates it.
- **Current solution:** Google Voice, checks messages at lunch and end of day
- **Objections:** "My customers want to talk to me, not a machine."
- **What closes him:** Show him the missed call data — he already knows he's losing leads. Position it as "your after-hours backup" not a replacement. The SMS with tap-to-call-back makes him the responsive one.
- **Quote:** "I can't be on the phone when I'm 30 feet up. But I also can't afford to lose the call."

---

## 6. Competitive Positioning

### Landscape Summary

| Competitor | Price | Strengths | Weaknesses | Our Angle |
|-----------|-------|-----------|------------|-----------|
| **Sameday AI** | $449+/mo | Best home-services AI, ServiceTitan integration, 92% booking rate | Too expensive for small shops. Requires demo/sales process | Half the price, same vertical focus, zero onboarding friction |
| **Avoca AI** | Enterprise (demo-only) | Full "AI workforce," great voice quality | Not accessible to SMBs at all. No transparent pricing | We exist for the businesses they don't serve |
| **Rosie** | $49/mo | Cheapest with decent quality | Generic, not trade-specific, basic integrations | Trade-specific prompts, emergency escalation, better UX |
| **Smith.ai** | $97+/mo | Human + AI hybrid, great integrations | Per-call pricing gets expensive, not industry-specific | Flat rate, unlimited within tier, trade-focused |
| **Ruby** | $319+/mo for 50 min | Premium human receptionists | Wildly expensive per-minute (~$6/call) | 10x cheaper, available 24/7, no per-minute anxiety |
| **Goodcall** | $59/mo | Affordable, simple | Limited to Zapier, no industry focus | More vertical, better notifications, better voice |
| **Dialzara/Synthflow** | $29/mo | Ultra-cheap | Developer platforms, not turnkey products | Turnkey product vs. build-it-yourself toolkit |

### Our Position

**"Sameday quality at a small-shop price, sold the way contractors actually buy — in person."**

We don't compete on features. We compete on:
1. **Price:** $250/mo flat — between the cheap generic ($29-49) and the premium ($449+)
2. **Simplicity:** Forward your number, live in 20 minutes. No integrations required.
3. **Sales channel:** We show up at their door and demo it live. Nobody else does this.
4. **Trade knowledge:** AI knows plumbing, HVAC, electrical, roofing terminology out of the box.

### Competitive Moat (Honest Assessment)

| Moat Type | Strength | Notes |
|-----------|----------|-------|
| **Sales channel** | 🟢 Strong | Steve's existing cold-call muscle + local relationships. Most SaaS founders can't/won't do direct sales to contractors. |
| **Industry knowledge** | 🟡 Medium | Understanding what tradespeople need vs. what engineers think they need |
| **Switching costs** | 🟡 Medium | Once call forwarding is set up and owner relies on SMS notifications, switching is friction |
| **Brand / trust** | 🟡 Medium | Local reputation matters in trades — word of mouth is powerful |
| **Technical** | 🔴 Weak | Anyone can build this with Twilio + an LLM. The tech is commodity. |
| **Data** | 🟡 Medium | Over time, call data tunes prompts per trade, improving quality |

**The moat is distribution, not technology.** Steve IS the moat. The question is whether the sales channel scales beyond Steve personally (hire SDRs, referral program, partnerships).

---

## 7. Product Requirements

### 7.1 Functional Requirements

#### FR-1: Inbound Call Handling
| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| FR-1.1 | System answers inbound calls on a dedicated Twilio number | P1 | One number per customer |
| FR-1.2 | AI delivers a natural, customizable greeting using the business name | P1 | Default: "Hi, thanks for calling [Business]. We can't get to the phone right now but I'd love to help..." |
| FR-1.3 | AI conversationally captures: caller name, phone number, service needed, urgency level, preferred callback time | P1 | Must feel like talking to a real person, not an IVR |
| FR-1.4 | AI confirms captured information before ending the call | P1 | "Just to confirm, you're John and you need help with a leaking water heater — is that right?" |
| FR-1.5 | AI recognizes emergency keywords and flags urgency | P1 | Keywords: burst pipe, flooding, gas leak, no heat, no AC, sewage, fire, smoke |
| FR-1.6 | AI handles off-topic or adversarial callers gracefully | P2 | Spam detection, polite deflection, doesn't get trapped in loops |
| FR-1.7 | Caller can request a human at any point | P1 | "I understand, let me make sure [Owner] gets your message right away" — flags as urgent |
| FR-1.8 | Call recording stored for owner playback | P1 | Audio file per call |
| FR-1.9 | Average call duration target: 60-120 seconds | P1 | AI should be efficient, not chatty |

#### FR-2: Notification System
| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| FR-2.1 | SMS notification sent to owner within 60 seconds of call end | P1 | This is the killer feature |
| FR-2.2 | SMS includes: caller name, phone (tap-to-call), service needed, urgency flag | P1 | Must be instantly actionable from the phone |
| FR-2.3 | Emergency calls trigger immediate SMS with 🚨 urgency indicator | P1 | Owner needs to know "burst pipe" is different from "want a quote" |
| FR-2.4 | Email notification with full transcript + audio link | P2 | Secondary channel, not critical path |
| FR-2.5 | Configurable notification recipients (owner + up to 2 team members) | P2 | Small shops may have a dispatcher or office manager |

#### FR-3: Web Dashboard
| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| FR-3.1 | Call log with all captured information, status, audio playback | P1 | Sortable, searchable |
| FR-3.2 | Lead status tracking: New → Called Back → Booked → Lost | P1 | Simple pipeline |
| FR-3.3 | Settings: business name, greeting text, trade type, notification preferences, business hours | P1 | Self-service configuration |
| FR-3.4 | Magic link authentication (no passwords) | P1 | Contractors won't remember passwords |
| FR-3.5 | Mobile-responsive design | P1 | Primary device is phone, not desktop |
| FR-3.6 | One-click callback from dashboard | P2 | Tap phone number → native dialer |

#### FR-4: Onboarding
| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| FR-4.1 | Signup flow: business name, phone, email, trade type | P1 | Under 5 minutes |
| FR-4.2 | Number provisioning: new local number assigned automatically | P1 | Twilio API |
| FR-4.3 | Call forwarding setup instructions (carrier-specific) | P1 | Step-by-step for AT&T, Verizon, T-Mobile |
| FR-4.4 | Test call feature: owner calls their AI number to hear it work | P1 | Critical for confidence |
| FR-4.5 | Stripe billing integration | P1 | $250/mo, card on file |
| FR-4.6 | 14-day free trial (credit card required) | P1 | Industry standard, reduces tire-kickers |

#### FR-5: Trade-Specific Intelligence
| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| FR-5.1 | Pre-trained prompt templates per trade: plumbing, HVAC, electrical, roofing, pest control, landscaping | P1 | AI knows "water heater," "compressor," "breaker panel," etc. |
| FR-5.2 | Emergency keyword recognition per trade | P1 | Plumbing: burst pipe, flooding, sewage. HVAC: no heat, no AC, gas smell. Electrical: sparking, outage, burning smell. |
| FR-5.3 | Configurable service list per business | P2 | Owner can add their specific services |
| FR-5.4 | Service area awareness | P2 | AI can ask "What's your zip code?" and confirm coverage |

### 7.2 Non-Functional Requirements

| ID | Requirement | Target | Notes |
|----|-------------|--------|-------|
| NFR-1 | Call answer latency | <2 seconds | Must feel instant |
| NFR-2 | AI voice quality | Indistinguishable from human for first 30 seconds | The bar from user research — if it sounds robotic in the first sentence, caller hangs up |
| NFR-3 | SMS notification delivery | <60 seconds from call end | Owner expectation is "instant" |
| NFR-4 | System uptime | 99.9% | Missed calls due to downtime = churn |
| NFR-5 | Concurrent call handling | 10+ simultaneous per customer | Twilio handles this natively |
| NFR-6 | Call recording storage | 90 days minimum | Sufficient for dispute resolution |
| NFR-7 | Data privacy | SOC 2 awareness, no PII in logs beyond necessary | Not HIPAA — home services don't require it |
| NFR-8 | Onboarding time | <20 minutes from signup to live | Zero-friction positioning |

---

## 8. User Stories

### Business Owner Stories
```
As a plumber on a job, I want missed calls answered by an AI that sounds human,
so that potential customers don't hang up and call my competitor.

As a business owner, I want an SMS with the caller's name, number, and issue within 60 seconds,
so that I can call back quickly and win the job.

As an HVAC contractor, I want the AI to recognize "no heat" as an emergency,
so that I get alerted immediately instead of finding out hours later.

As a solo operator, I want to sign up and be live in under 20 minutes,
so that I don't waste half a day on setup and integrations.

As a roofer who works during the day, I want to review all my missed calls in one place at the end of the day,
so that I can prioritize callbacks efficiently.

As a business owner, I want to customize the greeting with my business name and hours,
so that callers feel like they reached the right place.

As a contractor who's been burned by answering services before, I want to make a test call and hear the AI myself,
so that I trust it before giving it my real number.

As a business owner who hates passwords, I want to log in with a magic link,
so that I can access my dashboard without remembering another credential.
```

### Caller (Customer) Stories
```
As a homeowner with a burst pipe at 2 AM, I want someone to answer the phone,
so that I know help is on the way and I'm not just leaving a voicemail into the void.

As a homeowner calling for a quote, I want a short, friendly interaction,
so that I feel heard without spending 5 minutes talking to a robot.

As a caller, I want the option to say "I need to talk to a real person,"
so that I'm not trapped in an AI loop with no escape.
```

---

## 9. Pricing Strategy

### Steve's Reframing (Core Insight)
This is not a software subscription. This is a receptionist replacement.

- Full-time receptionist: $3,000-4,000/mo
- Part-time receptionist: $1,500-2,000/mo
- Answering service: $300-1,000/mo
- **NeverMiss AI: $250/mo**

That's $2,500 over 10 months. One missed HVAC install pays for 2 years of the service.

### Pricing Model — Single Tier (V1)

| | NeverMiss AI |
|---|---|
| **Price** | **$250/mo** |
| Includes | 1 dedicated local number |
| | Unlimited calls |
| | SMS + email notifications |
| | Web dashboard |
| | Call recordings + transcripts |
| | Trade-specific AI prompts |
| | Emergency escalation |
| | 14-day free trial |

**Why single tier for V1:**
- Simplifies the sales conversation ("It's $250/month. That's it.")
- Eliminates "which plan?" friction
- Unlimited calls removes usage anxiety
- Easier to close on the spot during a door-to-door demo
- Can introduce tiers later once we understand usage patterns

**Why $250 instead of $79-149:**
Steve's insight — don't race to the bottom. $250/mo is still 10x cheaper than a receptionist and less than one missed job. The customers who balk at $250 are price shoppers who churn anyway. The customers who see the value at $250 stick around.

### Unit Economics at $250/mo

| Item | Monthly Cost (per customer, ~150 calls/mo) |
|------|---------------------------------------------|
| Twilio (voice + SMS + number) | $15 |
| Deepgram (STT + TTS) | $8 |
| LLM extraction | $0.15 |
| Hosting/DB (amortized) | $2 |
| **Total COGS** | **~$25** |
| **Revenue** | **$250** |
| **Gross Profit** | **$225 (90%)** |

### Revenue Projections

| Milestone | Customers | MRR | ARR | Timeline |
|-----------|-----------|-----|-----|----------|
| Launch | 5 | $1,250 | $15,000 | Week 6 |
| Traction | 20 | $5,000 | $60,000 | Month 3 |
| Product-market fit signal | 50 | $12,500 | $150,000 | Month 6 |
| Scale trigger | 100 | $25,000 | $300,000 | Month 12 |

---

## 10. Go-to-Market Strategy

### Steve's Unfair Advantage
Steve cold-calls and door-knocks local businesses every day for Bridge Source. He:
- Knows how to get past gatekeepers
- Speaks the language of tradespeople
- Understands their pain points from years of selling to them
- Can demo the product live on the spot (call the AI number right in front of them)
- Has existing Bridge Source client relationships to warm-sell into

**Nobody in this space does direct local sales.** Every competitor relies on inbound (SEO, ads, content, demo request forms). Steve walks in the door.

### Phase 1: Pre-Sales Validation (Weeks 1-2)
**Before writing a line of code:**
1. Identify 20 local home service businesses (mix of plumbing, HVAC, electrical, roofing)
2. Cold call or door-knock 20 businesses with the pitch:
   > "How many calls did you miss last weekend? Each one is a $1,000-5,000 job going to your competitor. I'm building a service that answers your phone when you can't, captures the lead, and texts you within 30 seconds — for $250/month. Less than one missed job. Can I show you how it works?"
3. Show a prototype demo (even a staged one — Twilio + basic script)
4. Goal: **5 businesses say "I'd pay for that" and give a verbal or deposit**
5. If 5/20 say yes → build. If 0/20 → pivot the pitch or the product.

### Phase 2: MVP Build (Weeks 3-6)
- Build the core product (see Technical Architecture below)
- Onboard pre-sale customers as beta testers (free for first month)
- Tune AI prompts based on real calls
- Fix bugs, refine notifications

### Phase 3: Local Sales Blitz (Months 2-6)
1. **Cold call / door-to-door** San Diego home service businesses — Steve's existing sales motion
2. **Live demo on the spot** — call the AI number in front of them
3. **Close on the spot** — $250/mo, 14-day free trial, credit card
4. **Target:** 5 new customers/month minimum
5. **Track:** Close rate, common objections, which trades convert best

### Phase 4: Referral & Expansion (Months 6-12)
1. **Referral program:** $50 credit per referral (contractors talk to each other at supply houses, trade events)
2. **Partner with local SEO / marketing agencies** — bundle offering
3. **Trade association partnerships** — PHCC (plumbing), ACCA (HVAC), local chapters
4. **Bridge Source cross-sell** — existing clients already trust Steve
5. **Expand to adjacent SD metros** — Orange County, Riverside, LA

### Sales Pitch Framework

**The 60-Second Pitch:**
> "Quick question — when you're on a job or it's after hours, what happens to your incoming calls? [Let them answer — they'll say voicemail or nothing.]
>
> Here's the thing — 80% of people who hit voicemail hang up and call the next guy. You're probably losing $50K a year in calls you never even know about.
>
> What if, instead of voicemail, a real-sounding AI picked up, got the caller's name and what they need, and texted you the details within 30 seconds? You call them back, you get the job.
>
> It's $250 a month. Less than one missed weekend call. Want to hear it? I can call the number right now."

**Objection Handling:**
| Objection | Response |
|-----------|----------|
| "My customers want to talk to a real person" | "They do — and you'll call them back in minutes because you got the text. Right now they're getting voicemail and calling your competitor." |
| "I can't afford $250/month" | "You can't afford to miss one job. One water heater install covers the whole year." |
| "I tried an answering service, it was terrible" | "Those are call centers reading scripts. This is AI trained on plumbing/HVAC/electrical — it knows your industry. Let me demo it." |
| "What if the AI says something wrong?" | "It doesn't try to diagnose or sell. It just captures the lead and texts you. You're still the expert — this just makes sure you don't miss the call." |

---

## 11. Technical Architecture (High-Level)

### System Overview
```
Customer calls → Twilio (inbound) → Voice AI Agent → Deepgram STT → LLM extraction
                                                                         ↓
                                                              Notification service
                                                              (SMS + Email)
                                                                         ↓
                                                              Web Dashboard
                                                              (Next.js + Supabase)
```

### Technology Stack
| Component | Technology | Cost Basis |
|-----------|-----------|------------|
| Phone/SMS | Twilio | $0.0085/min receive, $0.0079/SMS |
| Speech-to-Text | Deepgram Nova-3 | $0.0077/min streaming |
| Text-to-Speech | Deepgram Aura | ~$0.005/min |
| LLM (extraction) | Claude 3.5 Haiku | ~$0.001/call |
| Backend | Node.js on Vercel/Railway | Free-$20/mo |
| Frontend | Next.js on Vercel | Free tier |
| Database + Auth | Supabase | Free tier → $25/mo |
| Payments | Stripe | 2.9% + $0.30 |
| Email | Resend | Free tier |
| Audio Storage | Supabase Storage / S3 | ~$0.50-5/mo |

### Per-Call Cost: ~$0.05
### Monthly Infra at 20 Customers (~3,000 calls): ~$200
### Gross Margin: ~90%

### Build Timeline
| Week | Deliverable |
|------|------------|
| 1 | Core voice pipeline — Twilio inbound → Deepgram STT → LLM extraction → TTS response |
| 2 | Notification system (SMS + email) + call recording + storage |
| 3 | Dashboard (Next.js + Supabase) — call log, lead tracking, settings, magic link auth |
| 4 | Onboarding flow + Stripe + number provisioning + landing page |
| 5-6 | Beta testing with pre-sale customers, prompt tuning, bug fixes |

---

## 12. Success Metrics & KPIs

### Product Health
| Metric | Target | Measurement |
|--------|--------|-------------|
| Call answer rate | 100% | Every inbound call gets picked up |
| Booking/capture rate | 85%+ | Calls where AI successfully extracts lead info |
| SMS delivery latency | <60 seconds | Time from call end to owner receiving text |
| AI voice quality score | 4/5+ | Post-call customer survey (V2) |
| False emergency rate | <5% | Non-emergencies flagged as urgent |

### Business Health
| Metric | Target | Measurement |
|--------|--------|-------------|
| Monthly churn | <5% | Customers who cancel per month |
| Net revenue retention | >100% | Account for upgrades, referrals |
| CAC (customer acquisition cost) | <$200 | Steve's time cost per closed customer |
| LTV (lifetime value) | $3,000+ | 12+ month average retention × $250/mo |
| LTV:CAC ratio | >10:1 | Healthy unit economics |
| Payback period | <1 month | First month's revenue covers acquisition cost |

### Sales Performance
| Metric | Target | Measurement |
|--------|--------|-------------|
| Demos per week | 10+ | Live demos (cold call or in-person) |
| Demo → trial conversion | 40%+ | Of demos, how many start trial |
| Trial → paid conversion | 70%+ | Of trials, how many convert to paid |
| Monthly new customers | 5+ | Net new paying customers |

---

## 13. Risks & Mitigations

| Risk | Severity | Likelihood | Mitigation |
|------|----------|------------|------------|
| **AI sounds robotic, callers hang up** | High | Medium | Invest in voice quality from day one. Test extensively. Use Deepgram Aura or ElevenLabs. Get real user feedback in beta. |
| **Caller gets trapped in an AI loop** | High | Low | Always provide escape hatch ("I'll make sure [Owner] gets your message right away"). Hard limit on call duration (3 min max). |
| **Emergency misclassification** | High | Medium | Conservative keyword matching. When in doubt, flag as urgent — false positive is better than missed emergency. |
| **Low conversion on cold outreach** | Medium | Medium | Pre-sell before building. Iterate the pitch. A/B test different angles. If close rate is <10%, revisit ICP. |
| **Competitor drops price into our range** | Medium | Low-Medium | The moat is sales channel, not price. If Sameday drops to $250, they still don't have Steve door-knocking. |
| **Twilio/Deepgram pricing changes** | Medium | Low | Monitor costs monthly. Architecture is modular — can swap providers. Margins are thick enough to absorb 2x cost increase. |
| **Customer churn from lack of integrations** | Medium | Medium | Track feature requests. Add Jobber/Housecall Pro integration in V2 if it's the top churn reason. |
| **Steve capacity bottleneck** | Medium | High | Sales depends on Steve's time. Plan for referral program and SDR hire at 50 customers. |
| **Regulatory (call recording consent)** | Low | Low | Two-party consent states: AI discloses recording at start of call. California is two-party. |

---

## 14. Phased Roadmap

### V1 — MVP (Weeks 1-6)
Core call handling + SMS notifications + basic dashboard + onboarding + Stripe billing.
Single pricing tier ($250/mo). San Diego only. Manual onboarding support.

### V1.5 — Polish (Months 2-3)
- Refine AI prompts based on real call data
- Add audio playback to dashboard
- Improve onboarding flow based on first 20 customer setups
- Build call forwarding setup guides for all major carriers
- Add basic spam filtering

### V2 — Feature Expansion (Months 4-6)
- Calendar integration (Google Calendar, Jobber, Housecall Pro)
- Spanish/bilingual support
- Auto-follow-up SMS ("Haven't heard back — still need that plumber?")
- Team notifications (multiple recipients with role-based routing)
- Lead analytics (calls by time of day, conversion rate, response time)

### V3 — Scale (Months 6-12)
- Outbound AI calls (appointment reminders, follow-ups)
- Zapier/webhook integrations
- Multi-location support
- Review solicitation ("How was your service? Leave us a Google review!")
- White-label option for agencies
- SDR hiring and sales playbook documentation

---

## 15. Open Questions & Dependencies

| Question | Status | Owner |
|----------|--------|-------|
| Product name — is "NeverMiss AI" the right brand? | Open | Steve |
| Pricing validation — will 5/20 pre-sell targets say yes at $250? | Needs testing | Steve |
| Voice quality — Deepgram Aura vs. ElevenLabs for V1? | Needs A/B testing | Maggie |
| Call forwarding setup — how painful is it per carrier? | Needs research | Maggie |
| California two-party consent — exact disclosure language? | Needs legal review | Maggie |
| Bridge Source client cross-sell — how many are home services? | Needs audit | Steve + Claire |
| Domain/branding — do we need a separate brand or run under Bridge Source? | Open | Steve |
| "City2 Engineering Center" — clarify what this refers to for build work | Open | Steve |

---

## Appendix A: Research Sources

- Competitive landscape: `projects/ai-voicemail/competitors.md`
- Business model & unit economics: `projects/ai-voicemail/business-model.md`
- MVP specification: `projects/ai-voicemail/mvp-spec.md`
- Technical architecture: `projects/ai-voicemail/tech-stack.md`
- User feedback research: Reddit (r/Construction, r/Plumbing, r/hvacadvice, r/smallbusiness), Marlie.ai comparison, TeleCloud risk analysis, Ring Eden plumber AI guide, Sameday AI testimonials, Avoca AI user review (Medium)
- Industry data: Housecall Pro (27% missed calls), Ring Eden ($1,200/missed call), industry estimates ($50K/year lost revenue)

---

*This document is a living artifact. Update as pre-sales data comes in, product decisions are made, and customer feedback shapes the roadmap.*
