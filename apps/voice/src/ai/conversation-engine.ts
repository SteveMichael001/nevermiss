/**
 * NeverMiss AI Conversation Engine — State Machine
 *
 * Drives the full conversation flow for an inbound call.
 * Uses a deterministic state machine (no LLM during the call — low latency).
 * Claude Haiku is used ONLY post-call for structured extraction.
 *
 * State flow:
 *   GREETING → CAPTURE_NAME → CAPTURE_ISSUE → ASSESS_URGENCY
 *            → CAPTURE_CALLBACK → CONFIRM → GOODBYE
 *
 * Special triggers (any state):
 *   - Emergency keywords → flag urgent, accelerate to CAPTURE_CALLBACK
 *   - Human request → flag urgent, skip to GOODBYE
 *   - 2:30 timeout → wrap-up sequence
 *   - 3:00 hard limit → force GOODBYE
 */

import { EventEmitter } from 'events';
import { detectEmergency, detectHumanRequest, detectSpam } from './emergency-detector.js';
import type {
  CallSession,
  ConversationState,
  TranscriptEntry,
  Urgency,
  Business,
  TradePrompt,
} from '../types.js';

/** Max call duration: 3 minutes (180 seconds) */
const MAX_CALL_DURATION_MS = 180_000;
/** Start wrap-up at 2:30 */
const WRAP_UP_AT_MS = 150_000;

// Regexes for simple entity extraction from speech
const NAME_PREFIXES = /\b(?:my name is|i'm|i am|this is|name's)\s+([a-z]+(?:\s+[a-z]+)?)/i;
const YES_PATTERN = /\b(?:yes|yeah|yep|yup|correct|right|that's right|that is correct|sounds good|sounds right|sure|ok|okay|perfect|exactly)\b/i;
const NO_PATTERN = /\b(?:no|nope|not quite|that's wrong|incorrect|wait|actually|hold on|that's not right)\b/i;

export interface ConversationEngineEvents {
  /** Fired when the AI should speak something to the caller */
  on(event: 'speak', listener: (text: string) => void): this;
  /** Fired when the call should be ended (after speaking any pending text) */
  on(event: 'end', listener: (session: CallSession) => void): this;
  /** Fired when an emergency is detected mid-conversation */
  on(event: 'emergency', listener: (session: CallSession) => void): this;
}

export class ConversationEngine extends EventEmitter implements ConversationEngineEvents {
  private session: CallSession;
  private wrapUpTimer: NodeJS.Timeout | null = null;
  private hardStopTimer: NodeJS.Timeout | null = null;
  private hasGreeted = false;

  constructor(session: CallSession) {
    super();
    this.session = session;
    this.scheduleTimers();
  }

  // ─────────────────────────────────────────────────────────────────
  // Public API
  // ─────────────────────────────────────────────────────────────────

  /**
   * Start the conversation — emit the greeting.
   * Called once when the WebSocket media stream connects.
   */
  async start(): Promise<void> {
    if (this.hasGreeted) return;
    this.hasGreeted = true;
    const greeting = this.buildGreeting();
    this.addAITranscript(greeting);
    this.emit('speak', greeting);
    this.session.state = 'CAPTURE_NAME';
  }

  /**
   * Process a caller transcript (final or interim).
   * Only final transcripts drive state transitions.
   * Interim transcripts are used for real-time emergency detection.
   *
   * @param text - Transcribed caller speech
   * @param isFinal - Whether this is a final Deepgram transcript
   */
  processTranscript(text: string, isFinal: boolean): void {
    if (!text || text.trim() === '') return;

    // Add to transcript log
    this.addCallerTranscript(text);

    // --- Real-time emergency/spam detection (any transcript, not just final) ---
    if (!this.session.isEmergency) {
      const isEmergency = detectEmergency(text, this.session.tradePrompt.emergency_keywords);
      if (isEmergency) {
        this.session.isEmergency = true;
        this.session.urgency = 'emergency';
        this.emit('emergency', this.session);
      }
    }

    // Check for human request (any state)
    if (!this.session.humanRequested && detectHumanRequest(text)) {
      this.session.humanRequested = true;
      this.session.urgency = this.session.urgency === 'emergency' ? 'emergency' : 'urgent';
      this.handleHumanRequest();
      return;
    }

    // Only advance state on final transcripts
    if (!isFinal) return;

    // Spam detection — end gracefully
    if (detectSpam(text)) {
      console.log(`[ConvEngine][${this.session.callSid}] Spam detected, ending call`);
      this.endCallGracefully('spam');
      return;
    }

    // Route to the appropriate state handler
    this.handleState(text);
  }

  /**
   * Force a wrap-up sequence (called at 2:30 timeout).
   */
  wrapUp(): void {
    if (this.session.state === 'GOODBYE') return;

    const { ownerName } = this.businessInfo();
    const summary = this.buildConfirmationText();

    const text = `I want to make sure I get this to ${ownerName} quickly. Let me confirm what I have — ${summary} Is that right?`;
    this.session.state = 'CONFIRM';
    this.addAITranscript(text);
    this.emit('speak', text);
  }

  /** Clean up all timers when call ends */
  destroy(): void {
    if (this.wrapUpTimer) clearTimeout(this.wrapUpTimer);
    if (this.hardStopTimer) clearTimeout(this.hardStopTimer);
    this.wrapUpTimer = null;
    this.hardStopTimer = null;
    this.removeAllListeners();
  }

  /** Get the current session (for post-call processing) */
  getSession(): CallSession {
    return this.session;
  }

  /** Set the streamSid on the session (called once Twilio provides it) */
  setStreamSid(streamSid: string): void {
    this.session.streamSid = streamSid;
  }

  // ─────────────────────────────────────────────────────────────────
  // State Handlers
  // ─────────────────────────────────────────────────────────────────

  private handleState(text: string): void {
    const state = this.session.state;

    switch (state) {
      case 'GREETING':
        // Should not happen — GREETING transitions immediately after speaking
        this.session.state = 'CAPTURE_NAME';
        break;

      case 'CAPTURE_NAME':
        this.handleCaptureName(text);
        break;

      case 'CAPTURE_ISSUE':
        this.handleCaptureIssue(text);
        break;

      case 'ASSESS_URGENCY':
        // ASSESS_URGENCY is auto-resolved during CAPTURE_ISSUE based on keywords
        // If we somehow land here, move to CAPTURE_CALLBACK
        this.handleCaptureCallback(text);
        break;

      case 'CAPTURE_CALLBACK':
        this.handleCaptureCallback(text);
        break;

      case 'CONFIRM':
        this.handleConfirm(text);
        break;

      case 'GOODBYE':
        // Ignore input — already ending
        break;
    }
  }

  /** CAPTURE_NAME: Extract caller's name from their response */
  private handleCaptureName(text: string): void {
    const name = extractName(text);

    if (name) {
      this.session.callerName = name;
      this.session.state = 'CAPTURE_ISSUE';
      const response = `Thanks, ${name}! What can we help you with today?`;
      this.addAITranscript(response);
      this.emit('speak', response);
    } else {
      // Couldn't extract name — ask again once
      const { businessName } = this.businessInfo();
      const response = `I'm sorry, I didn't catch your name. Could you repeat it for me?`;
      this.addAITranscript(response);
      this.emit('speak', response);
      // Note: we stay in CAPTURE_NAME — next transcript will try again
      // If name still not found on second try, we'll accept whatever they said
      if (this.session.transcript.filter((t) => t.speaker === 'ai').length >= 3) {
        // Third AI message — accept the raw text as the name and move on
        this.session.callerName = text.trim().slice(0, 50);
        this.session.state = 'CAPTURE_ISSUE';
      }
      void businessName; // used for context
    }
  }

  /** CAPTURE_ISSUE: Capture what the caller needs, detect urgency */
  private handleCaptureIssue(text: string): void {
    this.session.serviceNeeded = text.trim();
    this.session.state = 'ASSESS_URGENCY';

    // Determine urgency from the issue description
    if (this.session.isEmergency) {
      this.session.urgency = 'emergency';
    } else if (containsUrgentLanguage(text)) {
      this.session.urgency = 'urgent';
    } else {
      this.session.urgency = 'routine';
    }

    // Move directly to CAPTURE_CALLBACK — urgency is determined inline
    this.session.state = 'CAPTURE_CALLBACK';
    const { ownerName } = this.businessInfo();

    let response: string;
    if (this.session.urgency === 'emergency') {
      response = `That sounds urgent — I'll make sure ${ownerName} gets this message right away. When's the best time for them to call you back?`;
    } else {
      response = `Got it. When's the best time for ${ownerName} to call you back?`;
    }

    this.addAITranscript(response);
    this.emit('speak', response);
  }

  /** CAPTURE_CALLBACK: Capture preferred callback time */
  private handleCaptureCallback(text: string): void {
    this.session.preferredCallback = extractCallbackTime(text);
    this.session.state = 'CONFIRM';

    const confirmText = this.buildConfirmationText();
    const response = `Just to confirm — ${confirmText} Is that right?`;
    this.addAITranscript(response);
    this.emit('speak', response);
  }

  /** CONFIRM: Caller confirms or corrects the info */
  private handleConfirm(text: string): void {
    if (NO_PATTERN.test(text)) {
      // Caller wants to correct something
      this.session.state = 'CAPTURE_ISSUE';
      const response = `I'm sorry about that! Let me start over. What can we help you with?`;
      this.addAITranscript(response);
      this.emit('speak', response);
      return;
    }

    // Assume yes / confirmation (YES_PATTERN, or any other response)
    this.session.state = 'GOODBYE';
    const goodbye = this.buildGoodbye();
    this.addAITranscript(goodbye);
    this.emit('speak', goodbye);

    // End call after speaking the goodbye
    // Small delay to ensure TTS finishes before we signal end
    setTimeout(() => {
      this.emit('end', this.session);
    }, 4000);
  }

  // ─────────────────────────────────────────────────────────────────
  // Special handlers
  // ─────────────────────────────────────────────────────────────────

  /** Caller requested a human — acknowledge and end gracefully */
  private handleHumanRequest(): void {
    const { ownerName } = this.businessInfo();
    const response = `I completely understand. I'll make sure ${ownerName} gets your message right away and calls you back as soon as possible.`;
    this.session.state = 'GOODBYE';
    this.session.urgency = 'urgent';
    this.addAITranscript(response);
    this.emit('speak', response);

    setTimeout(() => {
      this.emit('end', this.session);
    }, 3500);
  }

  /**
   * End the call gracefully due to spam or other non-service reasons.
   */
  private endCallGracefully(reason: string): void {
    const { businessName } = this.businessInfo();
    let response: string;

    if (reason === 'spam') {
      response = `Thank you for calling ${businessName}. Goodbye!`;
    } else {
      response = `Thank you for calling ${businessName}. Have a great day!`;
    }

    this.session.state = 'GOODBYE';
    this.addAITranscript(response);
    this.emit('speak', response);

    setTimeout(() => {
      this.emit('end', this.session);
    }, 2500);
  }

  // ─────────────────────────────────────────────────────────────────
  // Text builders
  // ─────────────────────────────────────────────────────────────────

  /**
   * Build the initial greeting for the call.
   * Includes California two-party consent disclosure.
   *
   * California law requires ALL parties to consent to recording.
   * We disclose this at the start of every call.
   */
  private buildGreeting(): string {
    const { businessName, ownerName } = this.businessInfo();

    // Use custom greeting if set, otherwise use trade template
    let greetingBase = this.session.business.greeting_text;
    if (!greetingBase) {
      greetingBase = this.session.tradePrompt.greeting_template.replace('{business_name}', businessName);
    }

    // REQUIRED: California two-party consent disclosure
    // Must be included at the very start of every call
    return `${greetingBase} This call may be recorded for quality purposes. Can I get your name?`;

    void ownerName; // ownerName available for future use in greeting
  }

  private buildConfirmationText(): string {
    const { ownerName } = this.businessInfo();
    const name = this.session.callerName ?? 'you';
    const issue = this.session.serviceNeeded ?? 'your service request';
    const callback = this.session.preferredCallback ?? 'as soon as possible';

    return `you're ${name}, you need help with ${issue}, and you'd like a call back from ${ownerName} ${callback}.`;
  }

  private buildGoodbye(): string {
    const { businessName, ownerName } = this.businessInfo();
    const callback = this.session.preferredCallback ?? 'as soon as possible';

    const timeframe =
      callback.toLowerCase().includes('asap') || callback.toLowerCase().includes('soon')
        ? 'as soon as possible'
        : callback;

    return `Great, I've passed your info along to ${ownerName}. They'll give you a call ${timeframe}. Thanks for calling ${businessName}!`;
  }

  // ─────────────────────────────────────────────────────────────────
  // Utilities
  // ─────────────────────────────────────────────────────────────────

  private businessInfo(): { businessName: string; ownerName: string } {
    return {
      businessName: this.session.business.name,
      ownerName: this.session.business.owner_name,
    };
  }

  private addAITranscript(text: string): void {
    this.session.transcript.push({
      speaker: 'ai',
      text,
      timestamp: Date.now(),
    });
  }

  private addCallerTranscript(text: string): void {
    // Only add if it's different from the last caller entry (avoid duplicates from interim)
    const lastEntry = this.session.transcript.at(-1);
    if (lastEntry?.speaker === 'caller' && lastEntry.text === text) return;

    this.session.transcript.push({
      speaker: 'caller',
      text,
      timestamp: Date.now(),
    });
  }

  /**
   * Schedule wrap-up (2:30) and hard-stop (3:00) timers.
   * These fire regardless of conversation state.
   */
  private scheduleTimers(): void {
    // Wrap-up at 2:30
    this.wrapUpTimer = setTimeout(() => {
      if (this.session.state !== 'GOODBYE') {
        console.log(`[ConvEngine][${this.session.callSid}] 2:30 reached — initiating wrap-up`);
        this.wrapUp();
      }
    }, WRAP_UP_AT_MS);

    // Hard stop at 3:00
    this.hardStopTimer = setTimeout(() => {
      if (this.session.state !== 'GOODBYE') {
        console.log(`[ConvEngine][${this.session.callSid}] 3:00 reached — forcing end`);
        this.session.state = 'GOODBYE';
        this.emit('end', this.session);
      }
    }, MAX_CALL_DURATION_MS);
  }
}

// ─────────────────────────────────────────────────────────────────
// Entity extraction helpers
// ─────────────────────────────────────────────────────────────────

/**
 * Extract a caller's name from their speech.
 * Handles patterns like:
 *   - "My name is John"
 *   - "I'm Sarah"
 *   - "This is Mike"
 *   - "John Smith" (bare name)
 */
function extractName(text: string): string | null {
  // Try explicit prefix patterns first
  const prefixMatch = NAME_PREFIXES.exec(text);
  if (prefixMatch && prefixMatch[1]) {
    return capitalize(prefixMatch[1].trim());
  }

  // If it's a short utterance (1-3 words), treat it as a name
  const words = text.trim().split(/\s+/);
  if (words.length <= 3 && words.every((w) => /^[a-zA-Z'-]+$/.test(w))) {
    return capitalize(text.trim());
  }

  return null;
}

function capitalize(str: string): string {
  return str
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Extract preferred callback time from caller speech.
 * Returns the raw text if no pattern matches — that's fine, it's freeform.
 */
function extractCallbackTime(text: string): string {
  const lower = text.toLowerCase();

  // Common patterns
  if (/\basap\b|as soon as possible|right away|immediately|right now/.test(lower)) return 'ASAP';
  if (/today/.test(lower)) return 'today';
  if (/tomorrow morning/.test(lower)) return 'tomorrow morning';
  if (/tomorrow afternoon/.test(lower)) return 'tomorrow afternoon';
  if (/tomorrow/.test(lower)) return 'tomorrow';
  if (/this morning/.test(lower)) return 'this morning';
  if (/this afternoon/.test(lower)) return 'this afternoon';
  if (/this evening|tonight/.test(lower)) return 'this evening';
  if (/morning/.test(lower)) return 'morning';
  if (/afternoon/.test(lower)) return 'afternoon';
  if (/evening/.test(lower)) return 'evening';

  // Time pattern (e.g., "after 3", "around 2pm", "before noon")
  const timeMatch = /(?:after|around|before|at)\s+[\d:apm]+/.exec(lower);
  if (timeMatch) return timeMatch[0];

  // Return trimmed raw text as fallback — it's already freeform per PRD
  return text.trim().slice(0, 100);
}

/**
 * Detect urgent language that doesn't reach emergency level.
 * Used to set urgency = 'urgent' for expedited handling.
 */
function containsUrgentLanguage(text: string): boolean {
  const lower = text.toLowerCase();
  const urgentPhrases = [
    'asap', 'soon as possible', 'today', 'tonight', 'right now',
    'need it fixed', "can't wait", 'urgent', 'hurry', 'really bad',
    'getting worse', 'keeps happening', 'been a while',
  ];
  return urgentPhrases.some((phrase) => lower.includes(phrase));
}

// ─────────────────────────────────────────────────────────────────
// Factory function
// ─────────────────────────────────────────────────────────────────

/**
 * Create a new ConversationEngine for a call.
 */
export function createConversationEngine(
  callSid: string,
  business: Business,
  tradePrompt: TradePrompt,
  callerPhone: string | null
): ConversationEngine {
  const session: CallSession = {
    callSid,
    streamSid: null,
    businessId: business.id,
    business,
    tradePrompt,
    state: 'GREETING',
    callerPhone,
    callerName: null,
    serviceNeeded: null,
    urgency: 'unknown',
    preferredCallback: null,
    transcript: [],
    startTime: Date.now(),
    isEmergency: false,
    humanRequested: false,
    wrapUpScheduled: false,
    isSpeaking: false,
  };

  return new ConversationEngine(session);
}
