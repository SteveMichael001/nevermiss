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

export interface Call {
  id: string;
  business_id: string;
  created_at: string;
  twilio_call_sid: string;
  caller_phone: string | null;
  duration_seconds: number | null;
  recording_url: string | null;
  recording_duration_seconds: number | null;
  caller_name: string | null;
  service_needed: string | null;
  urgency: Urgency;
  preferred_callback: string | null;
  full_transcript: string | null;
  extraction_json: Record<string, unknown> | null;
  lead_status: LeadStatus;
  sms_sent_at: string | null;
  email_sent_at: string | null;
  notification_latency_ms: number | null;
}

export interface TradePrompt {
  id: string;
  trade: Trade;
  system_prompt: string;
  greeting_template: string;
  emergency_keywords: string[];
  common_services: string[];
}

export interface CallSession {
  callSid: string;
  businessId: string;
  business: Business;
  tradePrompt: TradePrompt;
  state: ConversationState;
  callerPhone: string | null;
  callerName: string | null;
  serviceNeeded: string | null;
  urgency: Urgency;
  preferredCallback: string | null;
  transcript: string[];
  startTime: number;
  isEmergency: boolean;
  humanRequested: boolean;
}

export interface LeadExtraction {
  caller_name: string | null;
  caller_phone: string | null;
  service_needed: string | null;
  urgency: Urgency;
  preferred_callback: string | null;
  is_spam: boolean;
  summary: string;
}
