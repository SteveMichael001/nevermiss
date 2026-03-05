/**
 * Supabase admin client for the voice server.
 * Uses service role key for full DB access (bypasses RLS).
 * This runs server-side only — never expose to clients.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Business, TradePrompt, LeadExtraction } from '../types.js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Look up a business by its Twilio phone number.
 * Used in the incoming call webhook to identify which business is being called.
 */
export async function getBusinessByPhone(twilioPhone: string): Promise<Business | null> {
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('twilio_phone_number', twilioPhone)
    .eq('is_active', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // not found
    console.error('[DB] getBusinessByPhone error:', error);
    return null;
  }

  return data as Business;
}

/**
 * Get the trade prompt for a given trade.
 * Falls back to 'general' if trade not found.
 */
export async function getTradePrompt(trade: string): Promise<TradePrompt | null> {
  const { data, error } = await supabase
    .from('trade_prompts')
    .select('*')
    .eq('trade', trade)
    .single();

  if (error) {
    console.error(`[DB] getTradePrompt error for trade "${trade}":`, error);
    // Try falling back to 'general'
    if (trade !== 'general') {
      return getTradePrompt('general');
    }
    return null;
  }

  return data as TradePrompt;
}

/**
 * Insert a new call record when a call starts.
 * Returns the UUID of the created record.
 */
export async function createCallRecord(params: {
  businessId: string;
  callSid: string;
  callerPhone: string | null;
}): Promise<string | null> {
  const { data, error } = await supabase
    .from('calls')
    .insert({
      business_id: params.businessId,
      twilio_call_sid: params.callSid,
      caller_phone: params.callerPhone,
      lead_status: 'new',
      urgency: 'unknown',
    })
    .select('id')
    .single();

  if (error) {
    console.error('[DB] createCallRecord error:', error);
    return null;
  }

  return data.id as string;
}

/**
 * Update a call record after the call ends with all extracted data.
 */
export async function updateCallRecord(
  callSid: string,
  updates: {
    callerName?: string | null;
    serviceNeeded?: string | null;
    urgency?: string;
    preferredCallback?: string | null;
    fullTranscript?: string;
    extractionJson?: LeadExtraction;
    durationSeconds?: number;
    recordingUrl?: string | null;
    recordingDurationSeconds?: number | null;
    smssentAt?: string;
    emailSentAt?: string;
    notificationLatencyMs?: number;
  }
): Promise<void> {
  const updatePayload: Record<string, unknown> = {};

  if (updates.callerName !== undefined) updatePayload.caller_name = updates.callerName;
  if (updates.serviceNeeded !== undefined) updatePayload.service_needed = updates.serviceNeeded;
  if (updates.urgency !== undefined) updatePayload.urgency = updates.urgency;
  if (updates.preferredCallback !== undefined) updatePayload.preferred_callback = updates.preferredCallback;
  if (updates.fullTranscript !== undefined) updatePayload.full_transcript = updates.fullTranscript;
  if (updates.extractionJson !== undefined) updatePayload.extraction_json = updates.extractionJson;
  if (updates.durationSeconds !== undefined) updatePayload.duration_seconds = updates.durationSeconds;
  if (updates.recordingUrl !== undefined) updatePayload.recording_url = updates.recordingUrl;
  if (updates.recordingDurationSeconds !== undefined) updatePayload.recording_duration_seconds = updates.recordingDurationSeconds;
  if (updates.smssentAt !== undefined) updatePayload.sms_sent_at = updates.smssentAt;
  if (updates.emailSentAt !== undefined) updatePayload.email_sent_at = updates.emailSentAt;
  if (updates.notificationLatencyMs !== undefined) updatePayload.notification_latency_ms = updates.notificationLatencyMs;

  const { error } = await supabase
    .from('calls')
    .update(updatePayload)
    .eq('twilio_call_sid', callSid);

  if (error) {
    console.error('[DB] updateCallRecord error:', error);
  }
}

/**
 * Get a call record by its Twilio Call SID.
 */
export async function getCallBySid(callSid: string): Promise<{ id: string } | null> {
  const { data, error } = await supabase
    .from('calls')
    .select('id')
    .eq('twilio_call_sid', callSid)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('[DB] getCallBySid error:', error);
    return null;
  }

  return data as { id: string };
}
