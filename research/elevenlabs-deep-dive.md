# ElevenLabs Conversational AI — Deep Configuration Guide

> **NeverMiss AI Reference** | Compiled March 2026  
> Sources: [ElevenLabs Docs](https://elevenlabs.io/docs/eleven-agents/overview) · [Changelog](https://elevenlabs.io/docs/changelog) · Reddit r/ElevenLabs

---

## Table of Contents

1. [Voice Selection & Tuning](#1-voice-selection--tuning)
2. [Conversation Flow Settings](#2-conversation-flow-settings)
3. [System Prompt Best Practices](#3-system-prompt-best-practices)
4. [Twilio Integration](#4-twilio-integration)
5. [Monitoring & Debugging](#5-monitoring--debugging)
6. [Advanced Features](#6-advanced-features)
7. [Latency Optimization Cheatsheet](#7-latency-optimization-cheatsheet)

---

## 1. Voice Selection & Tuning

### TTS Model Options

ElevenLabs offers several TTS models, and **model choice is the most impactful latency decision**:

| Model | Quality | Latency | Notes |
|-------|---------|---------|-------|
| **Eleven v3 Conversational** | Highest | Low | Best for NeverMiss — emotionally intelligent, context-aware |
| **Flash v2.5** | Good | Ultra-low | Community favorite for cold calls where speed > expressiveness |
| **Flash v2** | Good | Ultra-low | Slightly older, very reliable |
| **Turbo v2.5** | Very good | Low | Some reports of accent drift on non-English |
| **Turbo v2** | Good | Low | Solid baseline, supports phoneme-based pronunciation |

**For NeverMiss phone calls**: Use **Eleven v3 Conversational** (enables Expressive Mode) unless you hit latency problems, then fall back to **Flash v2.5**.

---

### Recommended Library Voices for Phone Calls

ElevenLabs has 5,000+ voices. These are the officially recommended ones for conversational agents:

| Voice ID | Name | Character | Best For |
|----------|------|-----------|----------|
| `kdmDKE6EkgrWrrykO9Qt` | **Alexandra** | Super realistic, young female, likes to chat | Casual inbound calls, friendly scheduling |
| `L0Dsvb3SLTyegXwtm47J` | **Archer** | Grounded, friendly young British male | Professional outbound |
| `g6xIsTj2HwM6VR4iXFCw` | **Jessica Anne Bogart** | Empathetic, expressive | Wellness, service recovery |
| `OYTbf65OHHFELVut7v2H` | **Hope** | Bright, uplifting | Positive interactions, confirmations |
| `dj3G1R1ilKoFKhBnWOzG` | **Eryn** | Friendly, relatable | Casual home services calls |
| `HDA9tsk27wYi3uq0fPcK` | **Stuart** | Professional & friendly Aussie | Technical assistance |
| `1SM7GgM6IMuvQlz2BwM3` | **Mark** | Relaxed, laid back | Non-urgent, casual conversations |
| `PT4nqlKZfc06VW1BuClj` | **Angela** | Raw, relatable, good listener | Down-to-earth service calls |
| `vBKc2FfBKJfcZNyEt1n6` | **Finn** | Tenor-pitched | Podcasts, light chats |
| `56AoDkrOh6qfVPDXZ7Pt` | **Cassidy** | Engaging, energetic | Entertainment, high-energy contexts |

**For a home service contractor AI (NeverMiss):** Start with **Alexandra** (friendly + realistic) or **Eryn** (relatable). If you need more professionalism, try **Stuart** or **Archer**.

You can also generate custom voices using **Voice Design** by describing what you want in text (age, accent, tone, pacing). Useful if none of the library voices fit the brand.

---

### Voice Settings Explained

These parameters are set per-voice in the agent configuration:

#### `stability` (0.0–1.0)
- Controls **randomness/consistency** between generations
- **Lower** (0.3–0.5) = broader emotional range, more expressive, slightly different each time
- **Higher** (0.7–0.9) = very consistent/predictable, can sound monotonous
- **For phone calls**: 0.55–0.70 is a good starting range — consistent but not robotic

#### `similarity_boost` (0.0–1.0)
- AKA "Clarity + Similarity Enhancement"
- Controls how closely the AI adheres to the **original voice characteristics**
- Higher = clearer, more faithful to source voice
- Too high (>0.90) can introduce artifacts/distortion
- **For phone calls**: 0.70–0.80 is the sweet spot

#### `style` (0.0–1.0)
- Exaggerates the **style** of the original speaker
- Adds latency at any value > 0
- **For phone calls**: Keep at `0.0` — adds latency with minimal conversational benefit

#### `speed` (0.7–1.2)
- Adjusts pace of speech
- **1.0** = normal speed
- **0.85–0.95** is often ideal for phone calls — slightly slower than default, more human-like
- Don't go below 0.7 or above 1.2 — quality degrades
- Values outside 0.7–1.2 are not supported

#### `use_speaker_boost` (boolean)
- Boosts similarity to original speaker
- **Adds latency** — disable for phone calls unless you really need the voice fidelity

---

### Expressive Mode

Enable by selecting **Eleven v3 Conversational** as your TTS model. It:
- Uses real-time signals from **Scribe v2 Realtime** (speech patterns, prosody) to time responses more naturally
- Adapts tone based on conversational context (responds calmer when user sounds worried, etc.)
- Supports **expressive tags** in LLM output:

```
[laughs]    — adds laughter (~4-5 words of effect)
[whispers]  — lowers volume
[sighs]     — sighing quality
[slow]      — slows delivery
[excited]   — adds excitement
```

**Note:** Expressive mode does NOT work with Professional Voice Clones (PVCs). The output may not sound like the original PVC.

---

## 2. Conversation Flow Settings

All conversation flow settings live in the agent's **Advanced** tab.

### Turn Timeout

Controls how long the agent waits **in silence** before prompting the user for a response.

| Setting | Range | Notes |
|---------|-------|-------|
| Duration | 1–30 seconds | How long before agent re-engages |
| Customer service | 5–10 seconds | Quick back-and-forth |
| Complex/technical | 10–30 seconds | Give user time to think |

**For NeverMiss home service calls**: 7–10 seconds. Homeowners often need a moment to process before confirming an appointment time.

---

### Soft Timeout (LLM Think-Time Filler)

Plays a filler phrase when the LLM takes longer than expected to respond. Prevents awkward silence.

| Setting | Default | Range | Recommended |
|---------|---------|-------|-------------|
| Timeout duration | -1 (disabled) | 0.5–8.0 sec | **3.0 sec** |
| Static message | "Hhmmmm...yeah." | 1–200 chars | Customize to fit your agent's voice |
| LLM-generated | false | boolean | Enable for more natural variety |

**Tips:**
- Don't use time-specific fillers like "Just one second…" — actual response time is unpredictable
- LLM-generated mode uses recent conversation context (up to 4 messages, 1000 chars) to generate contextual fillers like "Hmm…", "I see…", "Got it…"
- Always set a static fallback even if LLM-generated is enabled
- Disable for simple FAQ bots where responses are consistently fast

**Example fillers for a service call agent:**
- "Let me check on that…"
- "Hmm, yeah…"
- "Just a moment…" ← avoid (implies specific duration)
- "One sec…" ← avoid

---

### Interruptions

Controls whether users can interrupt the agent mid-speech.

**Enable when:** Conversational flow is the goal (customer service, scheduling)  
**Disable when:** Complete delivery is critical (legal disclaimers, safety instructions, terms)

Configure via the agent's Advanced tab → **Client Events** → ensure `interruption` is a selected event.

---

### Turn Eagerness

Controls how quickly the agent "jumps in" after detecting a pause.

| Mode | Behavior | Best For |
|------|----------|----------|
| **Eager** | Responds at earliest opportunity | Customer service, quick Q&A |
| **Normal** | Waits for natural conversation breaks | General use (default) |
| **Patient** | Waits longer, gives user more time | Collecting phone numbers, addresses, emails |

**NeverMiss recommendation:**
- **Eager** for the opening greeting and simple Q&A
- **Patient** when collecting address, name, or contact info
- You can dynamically switch modes per workflow step via the **Workflows** feature

---

### Spelling Patience *(Added Jan 2026)*

**New setting** — controls how long the agent waits when a user is spelling something out character-by-character.

| Value | Behavior |
|-------|----------|
| `auto` | System decides based on context |
| `low` | Short wait, assumes spelling is done quickly |
| `medium` | Moderate wait |
| `high` | Long wait — best for users spelling out email addresses, complex names, codes |

**Configure via API:** `turn.spelling_patience` on the agent config.

**For NeverMiss:** Use `high` when collecting confirmation codes, address numbers, or email addresses. This prevents the agent from cutting off the caller mid-spell.

---

### End-of-Turn Detection

ElevenLabs uses a **proprietary turn-taking model** (part of the Expressive Mode stack). It analyzes:
- Transcript content
- Prosody (how something was said, not just what)
- Speech patterns

Example: "yeah" can be a full acknowledgment OR a lead-in to continue speaking — the system distinguishes based on how it was said.

**To tune end-of-turn behavior**, combine:
1. **Turn eagerness** setting
2. **Spelling patience** setting
3. **Eleven v3 Conversational** model (most accurate turn detection)

---

## 3. System Prompt Best Practices

### Core Principles (from ElevenLabs official prompting guide)

**1. Use clean section headers**
```
# Persona
# Goal
# Instructions
# Guardrails
```
Models are specifically tuned to pay extra attention to `# Guardrails`. Section boundaries prevent instruction bleed.

**2. Be concise**
Every unnecessary word is a potential misinterpretation. Remove filler. Be action-based.

**3. Emphasize critical instructions**
Add "This step is important." at the end of lines the model must follow. Repeat the 1–2 most critical rules.

**4. Dedicated Guardrails section**
Non-negotiable rules go in `# Guardrails` only. Centralize them — easier to audit and update.

---

### Phone Call–Specific Prompt Patterns

#### Controlling pacing / natural speech
```
# Persona
You are Riley, a friendly scheduling assistant for [Company]. You speak naturally, conversationally, 
and at a comfortable pace. Never rush the caller. Use brief affirmations like "Got it", "Sure", 
"Absolutely" when appropriate.

Avoid long run-on sentences. Pause naturally between thoughts.
```

#### Handling silence / no response
```
# Instructions
If the caller doesn't respond for several seconds, gently re-engage with:
"I'm still here — did you have a chance to check your schedule?"

If they still don't respond after a second prompt, say:
"It sounds like you may have stepped away. Feel free to call us back at [number]. Goodbye!"
Then end the call.
```

#### Handling unclear input
```
# Instructions  
If you cannot understand what the caller said, ask for clarification once:
"Sorry, I missed that — could you repeat your [address / name / preferred time]?"

If after two attempts the information is still unclear, escalate to a human:
"Let me connect you with a team member who can help. One moment please."
```

#### Sounding less robotic
- Use **Eleven v3 Conversational** model (most natural delivery)
- Enable **Expressive Mode** 
- Use **[sighs]**, **[laughs]** sparingly in the prompt for natural moments
- Set `style = 0`, `stability = 0.60–0.65` for more dynamic delivery
- Tell the agent to use contractions, filler words, and short sentences:
```
Speak naturally. Use contractions (it's, we'll, you'd). 
Use brief acknowledgments ("Got it", "Mm-hmm") before responding.
```

#### Text normalization — critical for phone numbers and emails
By default, ElevenLabs normalizes via `system_prompt` (tells the LLM to write out numbers as words). 

For better transcript readability, switch to `elevenlabs` normalizer (in agent Voice settings → cog icon → bottom of voice settings):
- More reliable normalization
- Transcripts retain symbols like `$1,000` and `john@gmail.com` instead of written-out versions
- Adds minor latency

**For tool calls that need structured data** (e.g., booking an appointment), always specify format in tool parameter descriptions:
```
email: "Customer's email address, formatted as written characters (e.g., 'john@gmail.com', NOT 'john at gmail dot com')"
```

---

### Example System Prompt Structure for NeverMiss

```markdown
# Persona
You are Riley, a friendly AI receptionist for [Company Name], a [service type] company in [city]. 
You schedule appointments and answer basic questions about services.
Speak in a warm, conversational tone. Use natural contractions. Keep responses concise.

# Goal
1. Greet the caller and identify the reason for their call.
2. If they want to schedule service, collect their name, address, and preferred time window.
3. Confirm the appointment details back to them clearly.
4. Offer a confirmation text/email if applicable.
5. Thank them and close the call warmly.

# Instructions
- If you don't understand something, ask once to clarify.
- When collecting an address, use Patient mode — let them finish before responding.
- If the caller wants to speak to a person, immediately transfer to [number].
- Always confirm details before ending the call.

# Guardrails
- Never quote pricing without saying "I'll have a technician confirm the exact quote."
- Never commit to same-day service unless you've confirmed availability via the booking tool.
- Never share personal information about other customers.
- If the caller becomes hostile, stay calm and offer to connect them with a manager.
```

---

## 4. Twilio Integration

### Setup (Native Integration)

1. Go to **ElevenAgents → Phone Numbers**
2. Click **Import Number**
3. Fill in: Label, Phone Number, Twilio Account SID, Twilio Auth Token
4. ElevenLabs auto-detects capabilities (inbound+outbound vs outbound-only)
5. Assign an agent to the number for inbound handling

ElevenLabs **automatically configures the Twilio webhook** — you don't need to set TwiML manually.

---

### Phone Number Types

| Type | Inbound | Outbound | Notes |
|------|---------|----------|-------|
| **Purchased Twilio Number** | ✅ | ✅ | Full support |
| **Verified Caller ID** | ❌ | ✅ | Use your existing business number for outbound AI calls |

---

### Twilio Call Personalization (Webhook)

When a Twilio call is received, ElevenLabs can call **your webhook** to fetch caller-specific data *before* the call connects. The ringtone covers the fetch latency.

**What the webhook receives:**
```json
{
  "caller_id": "+16195551234",
  "agent_id": "agent_xyz",
  "called_number": "+18585550000",
  "call_sid": "CA..."
}
```

**What your webhook returns:**
```json
{
  "dynamic_variables": {
    "caller_name": "John Smith",
    "account_status": "active",
    "last_service_date": "2025-11-15"
  },
  "conversation_config_override": {
    "agent": {
      "first_message": "Hi John, thanks for calling [Company]! How can I help?"
    }
  }
}
```

**Setup:** ElevenAgents → Settings → Webhooks → configure URL + secrets. Then enable "Fetch conversation initiation data" in the agent's Security tab.

---

### Known Gotchas & Issues

**Latency (biggest complaint):**
- 1–6 second lag after the first response is a known community issue
- Root cause: LLM processing time + Twilio audio pipeline overhead
- See [Section 7](#7-latency-optimization-cheatsheet) for fixes

**Audio codec:**
- ElevenLabs uses **mulaw 8kHz** for Twilio telephony by default (standard for PSTN)
- The `alaw_8000` format is also now supported (Jan 2026 changelog)
- Don't try to use high-fidelity codecs — Twilio's PSTN path compresses everything anyway

**Verified Caller IDs cannot receive inbound calls.** Common gotcha — if you verified your business number (vs purchasing one), it can't be assigned to an agent for inbound. You need a purchased Twilio number for that.

**Call drops:**
- Most drops are caused by WebSocket timeout on the ElevenLabs side if the LLM response is too slow
- Also caused by Twilio's 30-second "no audio" timeout
- Fix: Enable **Soft Timeout** so there's audio activity during LLM processing
- Check your webhook response time — must respond quickly enough or Twilio hangs up

**Webhook timeouts:**
- Your personalization webhook must respond fast (within Twilio's dialing window, ~3-5 seconds)
- Use async/fast endpoints; don't do heavy DB queries synchronously

**Regional routing:**
- ElevenLabs supports regional routing for Twilio numbers (data residency compliance)
- See: `/docs/eleven-agents/phone-numbers/twilio-integration/regional-routing`

---

## 5. Monitoring & Debugging

### Call History Dashboard

**URL:** `https://elevenlabs.io/app/agents/history`

Shows all inbound and outbound calls. Each conversation shows:
- Call duration
- Transcript (full turn-by-turn)
- Audio playback
- Conversation ID
- Metadata (agent used, language, model)

---

### Analytics Dashboard

**URL:** `https://elevenlabs.io/app/agents` → Analytics tab

Available metrics:
- **Call count** — total conversations
- **Total & average duration**
- **Total & average cost** (per minute billing)
- **Agent response latency** — median and percentiles (the key number for debugging slowness)
- **Error rate** — percentage with errors
- **Error breakdown** by type: tool failures, LLM errors, connection issues
- **Language distribution**
- **Active calls** (real-time)
- **Success evaluation results** (if configured)

**Filtering dimensions:** agent, branch, time period, language, call type (inbound/outbound), LLM model

**Grouping:** Group by model to compare Flash vs. v3 latency. Group by branch to run A/B tests on prompts.

---

### Identifying Why a Call Dropped

1. **Check the transcript** — did the conversation end mid-sentence? Likely a WebSocket timeout or Twilio hangup
2. **Check error rate** in Analytics → look for connection issues
3. **Post-call webhook** — if you have `call_initiation_failure` webhooks enabled, failed call attempts send a payload with failure reasons and Twilio metadata
4. **Twilio console** — check the call log for error codes (e.g., 31480 = no answer, 31486 = busy)
5. **Soft Timeout** — if not enabled and LLM is slow, Twilio may timeout due to audio silence

**call_initiation_failure webhook fires when:**
- Connection error
- User declined the call
- User didn't pick up

**Does NOT fire if:** Call went to voicemail or was picked up by an automated service (those count as successful initiations).

---

### Real-Time Monitoring (Enterprise)

Enterprise users can monitor active conversations in real-time via:
```
WebSocket: /v1/convai/conversations/{id}/monitor
```
Added December 2025. Allows watching transcript and audio in real time during a live call.

---

### Conversation Transcript

Each call transcript shows:
- Turn-by-turn dialogue (agent vs. user)
- Timestamps
- Dynamic variable values used
- Tool calls made (if any)
- Analysis results (if conversation analysis is configured)
- Audio playback per turn

**Data Collection (optional config):** Configure your agent to extract structured fields from each conversation (e.g., "caller_intent", "appointment_confirmed", "address_collected"). These appear as filterable analytics dimensions.

---

## 6. Advanced Features

### conversation_config_override

Pass overrides when initiating a conversation to customize behavior per-call. This is the `conversation_initiation_client_data` structure:

```json
{
  "conversation_config_override": {
    "agent": {
      "prompt": {
        "prompt": "Custom system prompt for this call"
      },
      "first_message": "Hi {{caller_name}}, how can I help?"
    },
    "tts": {
      "voice_id": "specific_voice_for_this_call"
    }
  },
  "dynamic_variables": {
    "caller_name": "Sarah",
    "account_id": "ACC123"
  }
}
```

**Overrides can replace:**
- System prompt
- First message
- Language
- Voice settings
- Any agent configuration field defined in the "allowable overrides" list

This is how the Twilio personalization webhook works — it returns overrides based on the caller's phone number.

---

### Dynamic Variables

Inject runtime values into prompts, first messages, and tool calls using `{{variable_name}}` syntax.

**System variables (automatically available):**

| Variable | What It Is |
|----------|-----------|
| `system__agent_id` | Agent identifier |
| `system__caller_id` | Caller's phone number |
| `system__called_number` | Number that was called |
| `system__call_duration_secs` | Call duration in seconds |
| `system__conversation_id` | ElevenLabs conversation ID |
| `system__call_sid` | Twilio call SID |
| `system__time_utc` | Current UTC time (ISO format) |
| `system__time` | Current time in specified timezone |
| `system__timezone` | User-provided timezone |

**Best practices:**
- Use `secret__` prefix for auth tokens/private IDs — these are never sent to LLM providers
- Tool calls can **update** dynamic variables by returning JSON with dot-notation assignments
- Use `system__time` to tell the agent what time it is (for scheduling awareness)

**Example prompt usage:**
```
# Persona
You are an assistant for {{company_name}}. 
The caller's name is {{caller_name}} and they're a {{account_tier}} customer.
Current time: {{system__time}}
```

---

### Webhooks

Three types of post-call webhooks:

| Type | Event Name | Contents |
|------|-----------|----------|
| **Transcription** | `post_call_transcription` | Full transcript, analysis, metadata |
| **Audio** | `post_call_audio` | Base64-encoded MP3 of full call |
| **Initiation Failure** | `call_initiation_failure` | Why call failed to start + Twilio metadata |

**When webhooks trigger:** After call ends AND post-call analysis is complete (slight delay after hangup).

**Setup:** ElevenAgents → Settings → Webhooks → add URL + HMAC secret

**Security:** Validate using `ElevenLabs-Signature` header with the SDK's `constructEvent` method.

**Auto-disable rule:** Webhooks are auto-disabled if they have 10+ consecutive failures AND the last successful delivery was >7 days ago. Monitor your endpoint!

**Use the transcription webhook to:**
- Push conversation data to your CRM after every call
- Store call summaries in your database
- Trigger follow-up automations
- Build "memory" across calls using dynamic variables + stored data

---

### Stateful Conversations (Cross-Call Memory)

ElevenLabs doesn't natively remember previous calls. Here's the pattern:

1. **Start of call:** Pass `user_id` as a dynamic variable
2. **End of call:** Your webhook receives transcript + extracts `user_id` from `dynamic_variables` → stores summary in your DB
3. **Next call:** Your Twilio personalization webhook looks up `user_id` by `caller_id` → passes `{{previous_topics}}` dynamic variable into the new conversation

---

### LLM Cascading

Configure fallback LLMs so if your primary model is slow or fails, the agent switches to a backup.

**Location:** Agent → Models → LLM Cascading  
**Use case:** Set Qwen3-30b as primary (ultra-low latency), fall back to Claude/GPT for complex reasoning

---

### A/B Testing (Experiments)

Run live traffic splits between agent versions:
- Go to agent → Experiments
- Create branches (different prompts, models, voice settings)
- Assign traffic percentages
- Analytics dashboard → Group by Branch to compare performance

---

## 7. Latency Optimization Cheatsheet

This is the #1 pain point for phone call deployments.

### The Stack (Where Latency Lives)

```
User stops talking
    → Turn detection (ElevenLabs ASR)
        → LLM generates response
            → TTS synthesizes audio
                → Audio streams back
                    → Caller hears response
```

Total target: **under 1.5 seconds** for natural-feeling phone calls.

### Fixes by Layer

**1. Turn detection latency:**
- Use **Eleven v3 Conversational** with Expressive Mode (best turn-taking accuracy)
- Set **Turn Eagerness = Eager** for general conversation
- Avoid overly long system prompts — they slow ASR context processing

**2. LLM latency (biggest lever):**
- **Qwen3-30b-a3b** (ElevenLabs-hosted): sub-100ms, median ~130ms to first sentence — best for latency
- **Flash models** (Flash v2 / v2.5): next best option
- Keep system prompt concise — every token costs time
- Avoid complex tool calls in the main response path; use them for background actions
- Enable **Soft Timeout** so callers hear audio while LLM is thinking

**3. TTS latency:**
- Set `style = 0` (removes style exaggeration overhead)
- Disable `use_speaker_boost` (adds compute)
- Flash models start speaking faster (word-by-word streaming) — agent speaks "after receiving enough words and a comma" rather than waiting for full sentences

**4. Audio pipeline (Twilio):**
- Use `mulaw_8000` or `alaw_8000` codec — designed for telephony, minimal transcoding overhead
- Keep audio stream active during LLM processing (Soft Timeout prevents Twilio silence timeout)

### Community-Reported Numbers (Reddit, Dec 2025)

| Configuration | Typical First-Response Latency |
|--------------|-------------------------------|
| GPT-4o + v3 Conversational | 2–4 seconds (too slow for cold calls) |
| Qwen3-30b + Flash v2.5 | ~500ms–1.3s ✅ |
| Claude Haiku + Flash v2 | ~800ms–1.5s ✅ |
| Claude Sonnet + v3 Conversational | 1.5–3s (okay for service calls, borderline cold calls) |

**Red flag:** If lag is 1–6 seconds *after* the first message plays fine, the issue is almost always LLM response time, not connection setup. Switch to a faster LLM first.

---

## Sources

- [ElevenAgents Overview](https://elevenlabs.io/docs/eleven-agents/overview)
- [Conversation Flow Docs](https://elevenlabs.io/docs/eleven-agents/customization/conversation-flow)
- [Voice Customization](https://elevenlabs.io/docs/eleven-agents/customization/voice)
- [Conversational Voice Design](https://elevenlabs.io/docs/eleven-agents/customization/voice/best-practices/conversational-voice-design)
- [Expressive Mode](https://elevenlabs.io/docs/eleven-agents/customization/voice/expressive-mode)
- [Speed Control](https://elevenlabs.io/docs/eleven-agents/customization/voice/speed-control)
- [System Prompt Guide](https://elevenlabs.io/docs/eleven-agents/best-practices/prompting-guide)
- [Twilio Native Integration](https://elevenlabs.io/docs/eleven-agents/phone-numbers/twilio-integration/native-integration)
- [Twilio Personalization](https://elevenlabs.io/docs/eleven-agents/phone-numbers/twilio-integration/customising-calls)
- [Analytics Dashboard](https://elevenlabs.io/docs/eleven-agents/dashboard)
- [Post-Call Webhooks](https://elevenlabs.io/docs/eleven-agents/workflows/post-call-webhooks)
- [Dynamic Variables](https://elevenlabs.io/docs/eleven-agents/customization/personalization/dynamic-variables)
- [Changelog Jan 19, 2026](https://elevenlabs.io/docs/changelog/2026/1/19) — Spelling patience, audio formats
- [Voice Settings API](https://elevenlabs.io/docs/api-reference/voices/settings/get)
- Reddit r/ElevenLabs: [Latency cold calls thread](https://www.reddit.com/r/ElevenLabs/comments/1poh9ku/) (Dec 2025)
- Reddit r/ElevenLabs: [Best models for voice agents](https://www.reddit.com/r/ElevenLabs/comments/1h0so4p/) (Nov 2024)

---

*Last updated: March 2026 | Owner: Maggie | Project: NeverMiss*
