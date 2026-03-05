/**
 * Voice server types for NeverMiss AI.
 * These extend/mirror the shared package types for use within the voice server.
 */

export type Trade = 'plumbing' | 'hvac' | 'electrical' | 'roofing' | 'pest_control' | 'landscaping' | 'general';
export type Urgency = 'emergency' | 'urgent' | 'routine' | 'unknown';
export type LeadStatus = 'new' | 'called_back' | 'booked' | 'lost';
export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled';

export type ConversationState =
  | 'GREETING'
  | 'CAPTURE_NAME'
  | 'CAPTURE_ISSUE'
  | 'ASSESS_URGENCY'
  | 'CAPTURE_CALLBACK'
  | 'CONFIRM'
  | 'GOODBYE';

export interface Business {
  id: string;
  created_at: string;
  updated_at: string;
  owner_id: string;
  name: string;
  trade: Trade;
  owner_name: string;
  owner_phone: string;
  owner_email: string;
  twilio_phone_number: string | null;
  twilio_phone_sid: string | null;
  forward_from_number: string | null;
  greeting_text: string | null;
  business_hours: Record<string, { open: string; close: string }> | null;
  notification_phones: string[] | null;
  notification_emails: string[] | null;
  max_call_duration_seconds: number;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: SubscriptionStatus;
  trial_ends_at: string | null;
  is_active: boolean;
}

export interface TradePrompt {
  id: string;
  trade: Trade;
  system_prompt: string;
  greeting_template: string;
  emergency_keywords: string[];
  common_services: string[];
}

/** Live session state for a single active call */
export interface CallSession {
  callSid: string;
  streamSid: string | null;
  businessId: string;
  business: Business;
  tradePrompt: TradePrompt;
  state: ConversationState;
  callerPhone: string | null;
  callerName: string | null;
  serviceNeeded: string | null;
  urgency: Urgency;
  preferredCallback: string | null;
  transcript: TranscriptEntry[];
  startTime: number;
  isEmergency: boolean;
  humanRequested: boolean;
  wrapUpScheduled: boolean;
  /** Whether the AI is currently speaking (suppress incoming audio processing) */
  isSpeaking: boolean;
}

export interface TranscriptEntry {
  speaker: 'ai' | 'caller';
  text: string;
  timestamp: number;
}

/** Post-call structured lead data extracted by Claude Haiku */
export interface LeadExtraction {
  caller_name: string | null;
  caller_phone: string | null;
  service_needed: string | null;
  urgency: Urgency;
  preferred_callback: string | null;
  is_spam: boolean;
  summary: string;
}

/** Result from ConversationEngine.processTranscript() */
export interface ConversationResult {
  /** Text for AI to speak. Null = still processing / waiting */
  responseText: string | null;
  /** Whether to end the call after speaking responseText */
  shouldEnd: boolean;
  /** Whether this is a wrap-up triggered by the 2:30 timeout */
  isWrapUp: boolean;
  /** Updated session state */
  newState: ConversationState;
}

/** Twilio Media Stream message formats */
export interface TwilioStreamMessage {
  event: 'connected' | 'start' | 'media' | 'stop' | 'mark';
  sequenceNumber?: string;
  streamSid?: string;
  start?: {
    streamSid: string;
    callSid: string;
    accountSid: string;
    tracks: string[];
    customParameters: Record<string, string>;
    mediaFormat: {
      encoding: string;
      sampleRate: number;
      channels: number;
    };
  };
  media?: {
    track: string;
    chunk: string;
    timestamp: string;
    payload: string; // base64-encoded mulaw audio
  };
  mark?: {
    name: string;
  };
}

/** Outbound media event to send audio back to Twilio */
export interface TwilioMediaOutbound {
  event: 'media';
  streamSid: string;
  media: {
    payload: string; // base64-encoded mulaw audio
  };
}

/** Clear event to stop playback on Twilio's side */
export interface TwilioClearEvent {
  event: 'clear';
  streamSid: string;
}

/** Notification payload for SMS/email */
export interface NotificationPayload {
  business: Business;
  callSid: string;
  callerName: string | null;
  callerPhone: string | null;
  serviceNeeded: string | null;
  urgency: Urgency;
  preferredCallback: string | null;
  isEmergency: boolean;
  transcriptText: string;
  recordingUrl?: string;
  callId?: string;
}
