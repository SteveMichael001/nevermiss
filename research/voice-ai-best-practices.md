# Voice AI Best Practices: Building Natural, Human-Like Voice Agents

*Research compiled: March 2026*  
*Purpose: Inform the NeverMiss voice agent design for contractor / home services businesses*

---

## Executive Summary

The difference between a voice AI that feels human and one that feels robotic comes down to four things: **latency**, **conversation design**, **voice selection**, and **prompt engineering**. None of these alone is sufficient — great voice AI requires deliberate work across all four. The contractor use case has a specific profile: customers are often stressed, calling because something is broken, and they need speed + competence + warmth, not formality.

---

## 1. Platform Landscape

### Retell AI
**Best for:** Production voice agents that need to "just work"  
**What makes it natural:** Built voice-first — the streaming pipeline is optimized from the ground up for conversational speech, not a text chatbot with voice bolted on. Barge-in (interruption detection) is consistently praised as feeling "human." Producers report spending more time on agent logic than fighting robotic intonation issues.

> *"Retell AI doesn't need complicated configuration to sound natural. You spend more time improving the agent's logic than trying to fix robotic intonation."* — r/Best_Ai_Agents

**Pricing:** ~$0.13/min  
**Verdict:** Best overall platform for production voice agents in 2025. More opinionated, fewer gotchas.

---

### Vapi
**Best for:** Developers who want full flexibility and BYOM (bring your own models)  
**What makes it stand out:**
- Proprietary endpointing model that prevents cutting users off mid-pause
- WebRTC (same protocol as Google Meet/Teams) for lowest network latency
- Multilingual support (100+ languages)
- Turbo latency optimizations via intelligent caching + GPU inference

**Weaknesses (from users):** Barge-in detection inconsistent in high-traffic, multi-branch conversations. Requires more tweaking vs. Retell to sound natural — users report "kept tweaking settings, forcing pauses, adjusting prosody — it still sounded scripted."

**Pricing:** $0.05/min (+ provider costs for STT/TTS/LLM)  
**Verdict:** Best for technical teams who need customization. More footguns than Retell.

---

### Bland AI
**Best for:** Enterprise scale outbound calling  
**What makes it natural:** Handles the entire end-to-end pipeline internally (no external model deps by default), which reduces latency variance. Fine-tuning on your own call recordings is a key differentiator — you can train on real human agent transcripts.

**Key features:**
- Fine-tuning on existing call recordings & transcripts
- Graphical conversation pathway builder
- Dynamic data injection mid-call
- Dedicated infrastructure for enterprise (isolated from general API traffic)

**Pricing:** $0.12/min (all-in, including infrastructure)  
**Verdict:** Strong for high-volume outbound. Fine-tuning capability is best-in-class.

---

### Air AI
**Best for:** Sales teams wanting a "set it and forget it" AI caller  
**What makes it natural:** Claims to handle full-length phone calls with natural language processing that mimics human contact. Real-time responses, smooth integrations with CRMs.

**Caution:** Marketing-heavy, less developer-focused. Review sites note it promises a "human-like tone, perfect memory" — take with a grain of salt. Works best for defined sales scripts.

**Verdict:** Better for outbound sales cadences than complex inbound service calls.

---

### Sierra AI
**Best for:** Enterprise brands building premium customer experience  
**What makes it natural:** Sierra is the most thoughtful about conversation design at the platform level. Their blog content reveals actual engineering principles:

1. **Noise signal separation** — proprietary VAD (Voice Activity Detection) that distinguishes real interruptions from background TV, dog barking, side conversations
2. **Multi-tasking** — the agent can think while listening (pre-fetch API data before the sentence ends), listen while talking (handle interruptions mid-sentence), and show progress ("let me check... we don't have that in size 9, but...")
3. **Context-richness in voice** — counterintuitively, Sierra found that longer responses (not always shorter) produce better conversation in voice because people give more detail and context back
4. **Custom voice design** — they have a "Voice Sommelier" role dedicated to matching voice to brand personality. Celebrity touchstone exercise: "if any actor could voice your brand, who?"

**Metrics they track:** Acceptance rate (did caller stay after first 3 seconds?), Resolution rate, Satisfaction score  
**Verdict:** The gold standard for conversation design philosophy. Study their blog deeply. Enterprise pricing.

---

### PlayHT
**Best for:** TTS voice generation and voice agent infrastructure  
**Strengths:** Ultra-low latency TTS engine, wide voice library, supports SSML (Speech Synthesis Markup Language) for fine-grained control over pauses, emphasis, and rhythm.  
**Verdict:** More of a component (TTS layer) than a full platform. Excellent to pair with Vapi or Retell.

---

### Stack Recommendation for NeverMiss

| Need | Recommendation |
|------|----------------|
| Platform | **Retell AI** (voice-first, reliable barge-in, less configuration) |
| TTS Voice | **ElevenLabs** (best quality) or **Cartesia** (lowest latency) |
| STT | **Deepgram** (fastest, best for phone audio) |
| LLM | **GPT-4o mini** or **Claude Haiku** (low latency, high quality) |
| Telephony | **Twilio** or **Telnyx** (Telnyx cheaper, Twilio more reliable) |

---

## 2. Conversation Design Patterns

### The Core Problem: LLMs Are Trained to Write, Not Speak

LLMs are post-trained on text to produce clean, grammatically correct writing. That's great for emails. It's why voice agents sound robotic by default. The fix is prompt-level intervention — you cannot simply say "be conversational." The model will fight you.

---

### Latency: The #1 Factor in Perceived Naturalness

> *"Latency is what customers use to decide whether a voice agent sounds human."* — Bluejay AI

**Target:** < 800ms voice-to-voice latency (from end of user speech to first agent audio)  
**Ideal:** < 400ms first-word latency  

**Where latency comes from (in order):**

| Stage | What It Is | Optimization |
|-------|-----------|-------------|
| Endpointing | Detecting when user stops talking | Tune silence threshold on real data; use semantic VAD not just silence detection |
| STT (transcription) | Speech → text | Deepgram Nova-2 is fastest; use streaming partials |
| LLM (reasoning) | Thinking + response | Use smaller/faster models; cache common responses |
| TTS (synthesis) | Text → speech | Stream audio; measure TTFB (time to first byte) not just total duration |
| Tool calls | API lookups | Pre-load predictable data; use thinking phrases during lookups |

**Top latency reduction tactics:**
1. **Thinking phrases** — When making a slow API call, immediately say "Let me pull that up for you..." (buys 3-8 seconds of perceived responsiveness)
2. **Context pre-loading** — Pull customer data the moment the call connects (by phone number lookup), before any greeting finishes
3. **Short first responses** — Don't have the agent output a paragraph; one sentence first, then continue
4. **Parallel processing** — Start retrieving data on STT partials, not final transcript
5. **Cache static content** — Pre-record common phrases as audio files (legal disclaimers, greetings) to skip TTS latency

---

### Handling Pauses and Silence

- Don't fill every silence — brief pauses feel human, they signal thinking
- Long silence (>2 seconds): agent should say "Still working on that, one moment..."
- Very long silence (>5 seconds): "Sorry, are you still there?"
- Avoid talking over background noise — implement noise cancellation (Krisp, DeepFilterNet) and smart VAD to distinguish silence from background TV/traffic

---

### Handling Interruptions (Barge-In)

This is one of the hardest problems and most impactful for naturalness:

- **Immediate pause** — the moment user speaks, agent should stop. No finishing the sentence.
- **Don't assume all speech is interruption** — "okay yup" mid-explanation is agreement, not an interruption. Smart VAD differentiates.
- **Detect type of interruption:**
  - Real interruption: "Wait, actually—" → stop, adapt
  - Agreement: "Yeah, got it" → continue but acknowledge
  - Side conversation: agent detects different speaker/direction → ignore

> Sierra's insight: "They should think about what they're hearing, like humans." — Sierra AI Blog

---

### Turn-Taking

- **One question at a time** — never ask two questions in a single response
- **Explicit `<wait for user response>` logic** in prompts — tell the agent when to stop and listen
- **Semantic endpointing** — use models that understand sentence completion, not just silence detection (prevents cutting off pauses mid-thought)
- **Natural handoffs** — ending turns with slight upward inflection, a question, or a brief summary creates natural handoff cues

---

### Acknowledgment Phrases

These are critical. Humans signal they're listening through backchanneling — the "yeah," "got it," "okay" that keep conversation flowing.

**Best practice (from GitHub awesome-voice-prompts):**
> *"You will always start sentences with words such as 'makes sense', 'got it', 'oh', 'ok', 'haha', 'hmm', choosing whichever one fits perfectly into the conversation. You will never repeat filler words."*

Rotate through: "Got it," "Sure," "Okay," "Absolutely," "Of course," "Right," "Makes sense" — but never repeat the same one back to back.

---

### Filler Words and Disfluencies

The LiveKit blog is the gold standard here:

**What makes fillers feel real:**
- It's not just the word "um" — it's the **timing** and **recovery**
- After "um" → brief pause → "so..." is natural. "um" then immediately continuing is fake.
- Use SSML `<break time="300ms"/>` if your TTS supports it

**Filler word formula from LiveKit:**
```
"Yeah, um <break time="300ms"/> so <break time="300ms"/>, I can do that, no problem."
```

**Effective fillers for business context:**
- "Um," "so," "okay," "hm," "like," "ya so"
- "Let me think about that..."
- "So..."
- "Right, so..."
- Avoid: "Absolutely!" (corporate), "Great question!" (patronizing), "Certainly!" (robotic)

**Response length:** Keep turns under 2 sentences for simple queries. Voice listeners lose attention fast. Target 150 words/min speaking rate — a 30-second read takes longer to hear.

---

## 3. Voice Selection

### What Research Says About Trust

From UCLA Trust in AI Voice research and peer-reviewed studies:

1. **Female voices perceived as more trustworthy** than male voices (Goodman & Mayhorn, 2023) — this is a social bias finding, not a quality finding. Context matters.
2. **Warm + neutral tone = most trusted** — Positive and neutral tones rated more attractive; warmth signals approachability. Neutral > negative, always. Emotional neutrality is preferred over over-anthropomorphism.
3. **Lower frequency voices = slightly more reliable** (didn't reach statistical significance, but directionally consistent across studies)
4. **Speech rate, pitch, harmonics-to-noise ratio, jitter, and shimmer** all significantly influence trustworthiness ratings for both human and synthetic voices (ScienceDirect, 2025)

### Voice Characteristics That Work in Business

| Characteristic | What Works | What to Avoid |
|---------------|-----------|--------------|
| Pitch | Lower-to-mid range; avoid shrillness | High frequency (perceived as less reliable) |
| Speed | 140-160 wpm (conversational, not rushed) | Too fast (anxious) or too slow (condescending) |
| Warmth | Present but not syrupy | Saccharine, "call center chirpy" |
| Texture | Slight gravel, vocal fry in moderation | Too clean/perfect (uncanny valley) |
| Energy | Calm confidence | Fake enthusiasm |

> *Sierra's Voice Sommelier: "Lean into vocal textures that one might call defects — a touch of gravel, vocal fry, or a little breathiness. Used in moderation, they make the voice feel lived-in and real."*

---

### ElevenLabs Voice Recommendations for Business

| Voice | Profile | Best For |
|-------|---------|---------|
| **Drew** | Steady, confident, friendly, neutral accent | Contractor dispatch, appointment setting, tech support |
| **Adam** | Deep, resonant, authoritative | High-trust industries (finance, medical, legal) |
| **Chad** | Confident, energetic, assertive | Outbound sales, engagement |
| **Emily** | Soft, calm, clear, patient | Customer service, healthcare, support |
| **Matilda** | Warm, nurturing, encouraging | Health/wellness, long-form support conversations |

**For contractor context:** Drew is the strongest match — approachable but professional, sounds like a capable dispatcher rather than a call center robot.

---

### Gender Voice for Contractor Use Case

Blue-collar service businesses (HVAC, plumbing, roofing, electrical) skew toward male contractors calling back male workers/customers. Research suggests:
- **Female voice for intake/scheduling**: Trusted more per research; customers find it easier to describe a home problem to a warm female voice
- **Male voice for technical authority/escalation**: Perceived as more competent in skilled trades contexts by some demographics

**Practical recommendation:** Start with a neutral, warm female voice (like Emily or a custom ElevenLabs clone) for the NeverMiss intake agent. A/B test against a male voice after 500 calls.

---

## 4. Prompt Engineering for Voice AI

### Voice Prompts ≠ Text Prompts

| Text Prompts | Voice Prompts |
|-------------|--------------|
| Can use bullet points, headers | Everything must flow as spoken audio |
| Longer = more thorough | Shorter = more usable |
| Grammar is proper | Grammar breaks are natural |
| No concern about pronunciation | Must handle numbers, acronyms, dates |
| No interruption awareness | Must anticipate and handle barge-in |

### Core Prompt Architecture (Vapi's Framework)

Structure your system prompt in sections:
```md
[Identity]
Who the agent is, their name, their role

[Style]
Tone, speech patterns, filler word usage, brevity

[Response Guidelines]  
Max response length, how to handle dates/numbers/acronyms

[Task / Goals]
Step-by-step flow, conditional logic, what to collect

[Error Handling]
What to do when confused or user is unclear

[Conversation Flow]
Explicit steps with <wait for user response> markers
```

---

### Critical Voice-Specific Rules in Prompts

**1. Numbers and symbols must be spelled out**
- $130,000 → "one hundred thirty thousand dollars"
- 50% → "fifty percent"
- API → "A P I"
- 4:30pm → "four thirty pee em"
- Dates → "January twenty-fourth" (not "1/24")

**2. Pronunciation hints for proper nouns**
- "When saying our company name 'NeverMiss', emphasize the first syllable: NEV-er-miss"

**3. Response length constraints**
- "NEVER speak more than 2 sentences. Keep all sentences crisp."
- "This is a conversation, NOT an interrogation."
- "Ask ONE question at a time."

**4. Filler word instructions (be explicit)**
```
You speak naturally. Use filler words: "um," "so," "okay," "let me think..."
After "um," pause briefly, then restart with "so."
Start responses with acknowledgment phrases: "Got it," "Sure," "Makes sense," "Okay" — rotating, never repeating the same one.
```

**5. Persona as behavior, not adjective**
- Bad: "You are friendly and helpful"
- Good: "You break grammar rules. Start sentences with 'And,' 'But,' or 'So.' Use 'like' naturally. Loop back to earlier topics casually: 'About that other thing you mentioned...'"

---

### Example System Prompt Template (Contractor Intake Agent)

```md
[Identity]
You are Jamie, a friendly dispatcher for [Business Name]. You answer calls, collect job details, and get things scheduled. You're not a robot — you're the person who picks up the phone.

[Style]
- Keep responses to 1-2 sentences. This is a phone call, not a letter.
- Start responses with natural acknowledgments: "Got it," "Sure," "Right," "Makes sense" — rotating, never repeating.
- Use natural filler words: "so," "um," "let me just..." — sparingly.
- Sound like you're having a conversation, not reading a form.
- Spell out ALL numbers. Four twenty PM, not 4:20 PM.
- Never say "bullet point," "per your request," "I apologize for any inconvenience."

[Response Guidelines]
- Dates: say "Friday the fourteenth" not "the 14th"
- Times: say "two thirty in the afternoon" not "2:30 PM"
- Do not use lists, headers, or formatting — it's audio only.
- If the caller seems frustrated or urgent, acknowledge that first before asking questions.

[Task]
Your goal is to collect all the information needed to dispatch a technician. Do this naturally — it's a conversation, not a form.

1. Greet the caller warmly and ask what they need help with.
<wait for user response>

2. Acknowledge what they've described and show you understood.
Then ask: what's their address?
<wait for user response>

3. Confirm the address you heard. Then ask: what's the best number to reach them?
<wait for user response>

4. Ask: when works for them — is this urgent or can they pick a time?
<wait for user response>

5. Confirm the job summary back to them in plain language: "Okay so I've got you down for [problem] at [address] — I'll have someone reach out to confirm the time."

6. Thank them and let them know a tech will be in touch.

[Error Handling]
If you didn't catch something: "Sorry, can you say that again? I want to make sure I've got it right."
If they're upset or frustrated: acknowledge it first. "Yeah that sounds really frustrating. Let's get someone out there fast."
If they ask a question you can't answer (pricing, availability): "I'll have the tech give you a callback with all those details."

[Escalation]
If the caller says it's an emergency (water, gas, no heat in winter, no AC in summer), say:
"Okay — I'm flagging this as urgent right now. Someone will reach out within the next [X] minutes." Then trigger the emergency escalation tool.
```

---

### Prompting Hacks from the Community

1. **Reinforce the same rule multiple angles** — State it as a rule, show examples, then restate. The model needs more redundancy than expected.
2. **Concrete examples > abstract guidelines** — "Be conversational" doesn't work. Show the exact phrasing: *"Yeah, um so, I can do that, no problem."*
3. **Use SSML if your TTS supports it** — `<break time="300ms"/>` after "um" is the difference between natural and fake
4. **Define personality as audible behaviors** — Don't say "warm" — say "Loop back to earlier topics without naming them: 'About that other thing you mentioned...'"
5. **Emotion tags as guardrails** — Stay "peaceful" as baseline. Use "happy" sparingly. Never ping-pong between emotions.
6. **Tell the LLM it's processing speech transcription** — Say in the prompt: "Your input comes from a voice transcription system. It may have errors — use context to interpret unclear words." This dramatically improves handling of mishearing.

---

## 5. The Contractor Use Case

### What Customers Expect When They Call a Contractor

Based on AgentVoice analysis and home services industry research:

**The psychology of the call:**
- 80% of callers who hit voicemail don't leave a message — they call the next contractor
- 60% of calls to contractors go unanswered during busy periods
- Speed is the #1 competitive advantage: Harvard Business Review found responding within 5 minutes makes you 21x more likely to qualify the lead vs. waiting 30 minutes
- When something is broken (burst pipe, dead AC), the customer is stressed. They're not comparison shopping — they want to talk to a human who can help, right now.

**What customers want:**
1. Someone to pick up immediately
2. To feel heard and understood quickly
3. To describe their problem without being interrupted by a script
4. Confidence that someone competent is coming
5. A clear next step

**What customers do NOT want:**
- Long hold music or IVR menus
- To repeat themselves
- To be asked the same question twice
- Corporate-speak ("How may I assist you today?")
- Uncertainty about what happens next

---

### Information to Collect on Every Call

Minimum viable intake for contractor scheduling:

| Field | How to Ask | Notes |
|-------|-----------|-------|
| Problem description | "What's going on?" | Let them describe freely first — don't interrupt with a form |
| Address | "What's the address where you need the work done?" | Confirm back what you heard |
| Best callback number | "Best number to reach you?" | Confirm digits |
| Timing preference | "Is this urgent, or would you like to pick a time?" | Urgent = flag for immediate dispatch |
| Name | "And your name?" | Often comes naturally — don't ask first |
| Unit type (if applicable) | "Is this a house, condo, apartment?" | Relevant for HVAC/plumbing access |

**For HVAC specifically:**
- Is it heating or cooling?
- What's the make/model of the unit if they know it?
- When did it last work?

**For emergency escalation:**
- Keywords to detect: "water everywhere," "can't breathe," "gas smell," "no heat" (in winter), "no AC" (in extreme heat), "flooding"
- Immediate response: stop intake flow, acknowledge urgency, trigger escalation tool

---

### Tone That Works for Blue-Collar Service Businesses

**The voice should sound like:** A competent, friendly dispatcher — not a call center agent, not a cheerleader, not a formal receptionist.

**Characteristics:**
- Direct and efficient — respects the customer's time
- Warm but not effusive — no fake enthusiasm
- Slightly informal — contractions, natural phrasing
- Confident about the process — "I'll get you set up right now"
- Empathetic when things are bad — "That sounds really frustrating, let's get someone out there fast"

**Words that work:**
- "Let me get you taken care of"
- "I'll flag that as urgent"
- "We'll get someone out there"
- "Let me pull that up for you"
- "Got it — I've got everything I need"

**Words to avoid:**
- "Certainly!"
- "Absolutely!" (every response)
- "I apologize for any inconvenience"
- "Your call is very important to us"
- "Per our conversation"
- "I'd be happy to assist"

---

### Case Study: AgentVoice for Home Services

AgentVoice is a purpose-built AI dispatcher for contractors. Key design decisions:

- **Answers as "a trained dispatcher"** — the framing matters for voice personality
- **Emergency escalation via keyword detection** — detects urgency from caller tone + keywords, can text on-call tech directly or transfer live
- **Integrates with ServiceTitan, Housecall Pro, Jobber** — books directly into calendar during the call
- **Full context delivery** — after call: name, address, problem, recording, and summary sent via text/email

> *"Feels like someone we hired. It's that good."* — Rachel M., AgentVoice customer

> *"We were able to triple our call volume with the same number of staff."*

---

## 6. Key Takeaways & Recommendations for NeverMiss

### Technical Architecture
1. **Platform:** Start with Retell AI — most reliable for production voice-first use case
2. **Latency target:** < 800ms TTFA; optimize endpointing first (biggest lever)
3. **Use thinking phrases** for any tool call (scheduling lookup, customer lookup) — never leave dead air
4. **Pre-load customer data** on call connect (by caller ID lookup before greeting ends)

### Voice Design
5. **Voice:** ElevenLabs "Drew" as starting point — steady, confident, warm, neutral
6. **A/B test** female voice (Emily) vs. male (Drew) after 500 calls — female voices may generate more trust per research
7. **Avoid over-polished** — slight texture, natural speech rhythms > pristine synthetic voice

### Conversation Design
8. **One question at a time.** Always.
9. **Acknowledge before asking** — "Got it" before every next question
10. **Smart interruption handling** — use Retell's barge-in tuning to differentiate real interruptions from "yep" agreement
11. **Emergency detection** — keyword + tone detection for urgency; have escalation path ready (text tech, transfer call)

### Prompt Engineering
12. **Spell out numbers, dates, acronyms** — every time, no exceptions
13. **Show don't tell in prompts** — provide exact example phrases, not abstract descriptions
14. **Reinforce filler word rules multiple ways** — state the rule, show examples, restate
15. **Tell the LLM it's processing phone transcription** — reduces hallucinations from mishearing

### The Contractor Value Prop
16. **Speed wins the job** — 21x better lead qualification in first 5 minutes. This is the headline for NeverMiss.
17. **Emergencies are the highest-value calls** — a burst pipe at 10pm that gets answered vs. not is a $500+ job. That's the real ROI story.
18. **Tone = competent dispatcher, not call center** — "I'll get you taken care of" beats "How may I assist you today?" every time

---

## Sources

- [Vapi Prompting Guide](https://docs.vapi.ai/prompting-guide)
- [LiveKit: Prompting Voice Agents to Sound More Realistic](https://blog.livekit.io/prompting-voice-agents-to-sound-more-realistic/) — March 2026
- [Hugging Face: Deep Dive into Voice Agent Architecture](https://huggingface.co/blog/abdeljalilELmajjodi/deep-dive-into-voice-agent)
- [Walturn: Vapi vs Bland AI vs Retell AI Comparison](https://www.walturn.com/insights/a-comparison-between-vapi-and-other-voice-ai-platforms)
- [Sierra AI: Building More Human Voice Experiences](https://sierra.ai/blog/building-more-human-voice-experiences)
- [Sierra AI: Meet the Voice Sommelier](https://sierra.ai/blog/meet-the-voice-sommelier)
- [AgentVoice: AI Voice for Home Services](https://www.agentvoice.com/ai-voice-home-services/)
- [Layercode: How to Write Prompts for Voice AI Agents](https://layercode.com/blog/how-to-write-prompts-for-voice-ai-agents)
- [Bluejay AI: 12 Ways to Reduce Voice Agent Latency](https://getbluejay.ai/blog/12-ways-to-reduce-voice-agent-latency)
- [Skim AI: Top 10 ElevenLabs AI Voices](https://skimai.com/our-top-10-elevenlabs-ai-voices-elevate-your-user-experience-with-ai-agents/)
- [UCLA Trust in AI Voice Research](https://trustinvoice.humspace.ucla.edu/sound-features/)
- [ScienceDirect: Evaluating trustworthiness across synthesised voices (2025)](https://www.sciencedirect.com/science/article/pii/S2451958825001770)
- [GitHub: Awesome Voice Prompts](https://github.com/langgptai/awesome-voice-prompts)
- Reddit: r/Best_Ai_Agents, r/AI_Agents, r/LocalLLM — developer community insights
- Harvard Business Review: Speed to Lead research (referenced via AgentVoice)
