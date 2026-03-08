/**
 * POST /api/webhook/elevenlabs
 *
 * Post-call handler. ElevenLabs fires this webhook when a conversation ends.
 *
 * Flow:
 *   1. Read raw body (required for HMAC validation — do not let Next.js parse first)
 *   2. Validate ElevenLabs-Signature HMAC (production only)
 *   3. Parse JSON payload — event type: post_call_transcription
 *   4. Extract lead data from data.analysis.data_collection_results
 *   5. Look up business in Supabase (by business_id, fall back to elevenlabs_agent_id)
 *   6. Insert call record to Supabase
 *   7. Send SMS notification (awaited, non-fatal on error)
 *   8. Send email notification (fire and forget)
 *   9. Update call record with notification timestamps
 *  10. Return { success: true }
 *
 * Error handling: all unhandled errors return 200 with { error: 'internal' }
 * because ElevenLabs retries on non-200, causing duplicate processing.
 */

import { createHmac, timingSafeEqual } from 'crypto'
import { createClient } from '@supabase/supabase-js'
import { sendLeadSMS } from '@/lib/notifications/sms'
import { sendLeadEmail } from '@/lib/notifications/email'

// ---------------------------------------------------------------------------
// Runtime
// ---------------------------------------------------------------------------

export const runtime = 'nodejs'

// ---------------------------------------------------------------------------
// Startup validation
// ---------------------------------------------------------------------------

// Validate required secret at module load time (not request time).
// In production, missing secret is a deploy error — fail loudly.
const WEBHOOK_SECRET = process.env.ELEVENLABS_WEBHOOK_SECRET

if (process.env.NODE_ENV === 'production' && !WEBHOOK_SECRET) {
  throw new Error(
    '[elevenlabs-webhook] ELEVENLABS_WEBHOOK_SECRET is required in production. Set it in your environment variables.'
  )
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TranscriptEntry {
  role: 'agent' | 'user'
  message: string
  time_in_call_secs: number
}

interface DataCollectionResult {
  value: string
  rationale?: string
}

interface ElevenLabsPostCallData {
  agent_id: string
  conversation_id: string
  status: 'done' | 'error'
  transcript: TranscriptEntry[]
  metadata: {
    start_time_unix_secs: number
    call_duration_secs: number
  }
  analysis: {
    data_collection_results: {
      caller_name?: DataCollectionResult
      service_needed?: DataCollectionResult
      urgency?: { value: 'emergency' | 'urgent' | 'routine'; rationale?: string }
      preferred_callback?: DataCollectionResult
    }
    call_successful: string
  }
  conversation_initiation_client_data?: {
    dynamic_variables?: {
      caller_phone?: string
      twilio_call_sid?: string
      business_id?: string
      system__called_number?: string
      [key: string]: string | undefined
    }
  }
}

interface ElevenLabsPostCallPayload {
  type: 'post_call_transcription'
  event_timestamp: number
  data: ElevenLabsPostCallData
}

interface Business {
  id: string
  name: string
  owner_phone: string
  owner_email: string
  owner_name: string
  notification_phones: string[] | null
  notification_emails: string[] | null
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Supabase admin client — no cookie auth needed for webhook routes */
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!url || !key) {
    throw new Error(
      'Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY'
    )
  }
  return createClient(url, key)
}

/**
 * Validate the ElevenLabs-Signature header.
 * Format: t=TIMESTAMP,v0=HASH
 * HMAC is computed over `${timestamp}.${rawBody}` using ELEVENLABS_WEBHOOK_SECRET.
 * Returns null on success, or an error string describing the failure.
 */
function validateSignature(
  signatureHeader: string | null,
  rawBody: string,
  secret: string
): string | null {
  if (!signatureHeader) {
    return 'Missing ElevenLabs-Signature header'
  }

  // Parse t=TIMESTAMP and v0=HASH from comma-separated pairs
  const parts = signatureHeader.split(',')
  let timestamp: string | null = null
  let hash: string | null = null

  for (const part of parts) {
    const [key, value] = part.split('=')
    if (key === 't') timestamp = value
    if (key === 'v0') hash = value
  }

  if (!timestamp || !hash) {
    return 'Malformed ElevenLabs-Signature header — expected t=TIMESTAMP,v0=HASH'
  }

  // Replay protection: reject if timestamp is more than 5 minutes old
  const timestampMs = parseInt(timestamp, 10) * 1000
  if (isNaN(timestampMs)) {
    return 'Invalid timestamp in ElevenLabs-Signature header'
  }
  const ageMs = Date.now() - timestampMs
  if (ageMs > 5 * 60 * 1000) {
    return `Signature timestamp too old (${Math.round(ageMs / 1000)}s) — possible replay attack`
  }

  // Compute expected HMAC-SHA256 of `timestamp.rawBody`
  const payload = `${timestamp}.${rawBody}`
  const expected = createHmac('sha256', secret).update(payload, 'utf8').digest('hex')

  // Timing-safe comparison
  try {
    const expectedBuf = Buffer.from(expected, 'hex')
    const receivedBuf = Buffer.from(hash, 'hex')
    if (expectedBuf.length !== receivedBuf.length) {
      return 'Signature mismatch'
    }
    if (!timingSafeEqual(expectedBuf, receivedBuf)) {
      return 'Signature mismatch'
    }
  } catch {
    return 'Signature comparison failed'
  }

  return null // valid
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(req: Request): Promise<Response> {
  try {
    // ------------------------------------------------------------------
    // 1. Read raw body (must precede JSON.parse — needed for HMAC)
    // ------------------------------------------------------------------
    const rawBody = await req.text()

    // ------------------------------------------------------------------
    // 2. Validate ElevenLabs signature (production only)
    // ------------------------------------------------------------------
    if (process.env.NODE_ENV === 'production') {
      const signatureHeader = req.headers.get('ElevenLabs-Signature')
      // WEBHOOK_SECRET is guaranteed non-null in prod (startup validation above)
      const validationError = validateSignature(signatureHeader, rawBody, WEBHOOK_SECRET!)
      if (validationError) {
        console.warn('[elevenlabs-webhook] Signature validation failed:', validationError)
        return Response.json({ error: 'invalid signature' }, { status: 200 })
      }
    }

    // ------------------------------------------------------------------
    // 3. Parse JSON body
    // ------------------------------------------------------------------
    let payload: ElevenLabsPostCallPayload
    try {
      payload = JSON.parse(rawBody) as ElevenLabsPostCallPayload
    } catch (parseErr) {
      console.error('[elevenlabs-webhook] JSON parse error:', parseErr)
      return Response.json({ error: 'internal' }, { status: 200 })
    }

    // ------------------------------------------------------------------
    // 3b. Log full incoming payload for debugging
    // ------------------------------------------------------------------
    console.log('[elevenlabs-webhook] Incoming payload:', rawBody.slice(0, 4000))

    // ------------------------------------------------------------------
    // 4. Ignore non-post_call_transcription events
    // ------------------------------------------------------------------
    if (payload.type !== 'post_call_transcription') {
      console.log(`[elevenlabs-webhook] Ignoring event type: ${payload.type}`)
      return Response.json({ received: true }, { status: 200 })
    }

    const data = payload.data

    // ------------------------------------------------------------------
    // 5. Extract lead data
    // ------------------------------------------------------------------
    const { agent_id, conversation_id } = data

    // Transcript → full text
    const fullTranscript = data.transcript
      .map((entry) => `${entry.role}: ${entry.message}`)
      .join('\n')

    // Analysis results — each field is { value: string } or undefined
    const dcr = data.analysis.data_collection_results
    const callerName = dcr.caller_name?.value ?? 'unknown'
    const serviceNeeded = dcr.service_needed?.value ?? 'unknown'
    const urgencyRaw = dcr.urgency?.value ?? 'routine'
    const urgency: 'emergency' | 'urgent' | 'routine' = (
      ['emergency', 'urgent', 'routine'].includes(urgencyRaw)
        ? urgencyRaw
        : 'routine'
    ) as 'emergency' | 'urgent' | 'routine'
    // preferred_callback is the field name in ElevenLabs data_collection.
    // Fall back to dcr.caller_phone for backward compat (old agents used that field name).
    const preferredCallback = dcr.preferred_callback?.value ?? (dcr as Record<string, DataCollectionResult | undefined>).caller_phone?.value ?? 'unknown'

    // Dynamic variables from conversation initiation
    const dynamicVars = data.conversation_initiation_client_data?.dynamic_variables
    const callerPhone = dynamicVars?.caller_phone ?? ''
    const twilioCallSid = dynamicVars?.twilio_call_sid ?? ''
    const businessIdFromVars = dynamicVars?.business_id

    // Metadata
    const callDurationSecs = data.metadata.call_duration_secs

    console.log(
      `[elevenlabs-webhook] Processing conversation=${conversation_id} agent=${agent_id} ` +
        `caller=${callerPhone} urgency=${urgency} duration=${callDurationSecs}s`
    )

    // ------------------------------------------------------------------
    // 6. Look up business in Supabase
    // ------------------------------------------------------------------
    const supabase = getSupabaseAdmin()
    let business: Business | null = null

    // Attempt 1: look up by business_id from dynamic_variables
    if (businessIdFromVars) {
      const { data: biz, error } = await supabase
        .from('businesses')
        .select('id, name, owner_phone, owner_email, owner_name, notification_phones, notification_emails')
        .eq('id', businessIdFromVars)
        .single<Business>()

      if (!error && biz) {
        business = biz
      } else {
        console.warn(
          `[elevenlabs-webhook] Business not found by id=${businessIdFromVars}, ` +
            `falling back to elevenlabs_agent_id lookup`
        )
      }
    }

    // Attempt 2: fall back to elevenlabs_agent_id = agent_id
    if (!business) {
      const { data: biz, error } = await supabase
        .from('businesses')
        .select('id, name, owner_phone, owner_email, owner_name, notification_phones, notification_emails')
        .eq('elevenlabs_agent_id', agent_id)
        .single<Business>()

      if (!error && biz) {
        business = biz
      }
    }

    // Attempt 3: fall back to system__called_number → twilio_phone_number lookup
    if (!business) {
      const calledNumber = data.conversation_initiation_client_data
        ?.dynamic_variables?.['system__called_number'] ?? ''

      if (calledNumber) {
        const { data: biz, error } = await supabase
          .from('businesses')
          .select('id, name, owner_phone, owner_email, owner_name, notification_phones, notification_emails')
          .eq('twilio_phone_number', calledNumber)
          .eq('is_active', true)
          .single()

        if (!error && biz) {
          business = biz as Business
          console.log(`[elevenlabs-webhook] Found business by called_number=${calledNumber}`)
        } else {
          console.warn(
            `[elevenlabs-webhook] Business not found by called_number=${calledNumber}:`,
            error?.message
          )
        }
      }
    }

    if (!business) {
      console.warn(
        `[elevenlabs-webhook] Could not find business for agent_id=${agent_id} ` +
          `business_id=${businessIdFromVars ?? 'none'} — dropping event`
      )
      return Response.json({ received: true }, { status: 200 })
    }

    // ------------------------------------------------------------------
    // 7. Insert into calls table
    // ------------------------------------------------------------------
    const callStartMs = Date.now()

    const { data: callRecord, error: insertError } = await supabase
      .from('calls')
      .insert({
        business_id: business.id,
        twilio_call_sid: twilioCallSid || `el_${conversation_id}`, // fallback if SID missing
        caller_phone: callerPhone,
        caller_name: callerName,
        service_needed: serviceNeeded,
        urgency,
        preferred_callback: preferredCallback,
        full_transcript: fullTranscript,
        duration_seconds: callDurationSecs,
        elevenlabs_conversation_id: conversation_id,
        extraction_json: data.analysis as Record<string, unknown>,
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('[elevenlabs-webhook] Failed to insert call record:', insertError)
      return Response.json({ error: 'internal' }, { status: 200 })
    }

    const callId = callRecord.id as string
    console.log(`[elevenlabs-webhook] Inserted call record id=${callId} for business=${business.name}`)

    // ------------------------------------------------------------------
    // 8. Send SMS notification (awaited, non-fatal on error)
    // ------------------------------------------------------------------
    try {
      await sendLeadSMS({
        ownerPhone: business.owner_phone,
        additionalPhones: business.notification_phones ?? undefined,
        businessName: business.name,
        callerName,
        callerPhone,
        serviceNeeded,
        urgency,
        preferredCallback,
      })
      console.log(`[elevenlabs-webhook] SMS sent for call id=${callId}`)
    } catch (smsErr) {
      console.error('[elevenlabs-webhook] SMS send failed (non-fatal):', smsErr)
    }

    // ------------------------------------------------------------------
    // 9. Send email notification (fire and forget)
    // ------------------------------------------------------------------
    sendLeadEmail({
      ownerEmail: business.owner_email,
      additionalEmails: business.notification_emails ?? undefined,
      businessName: business.name,
      ownerName: business.owner_name,
      callerName,
      callerPhone,
      serviceNeeded,
      urgency,
      preferredCallback,
      fullTranscript,
      callId,
    }).catch((err: unknown) => console.error('[email] Fire-and-forget send failed:', err))

    // ------------------------------------------------------------------
    // 10. Update call record: sms_sent_at + email_sent_at + notification_latency_ms
    // ------------------------------------------------------------------
    const notificationLatencyMs = Date.now() - callStartMs

    const { error: updateError } = await supabase
      .from('calls')
      .update({
        sms_sent_at: new Date().toISOString(),
        email_sent_at: new Date().toISOString(),
        notification_latency_ms: notificationLatencyMs,
      })
      .eq('id', callId)

    if (updateError) {
      console.warn('[elevenlabs-webhook] Failed to update notification timestamps:', updateError)
    } else {
      console.log(
        `[elevenlabs-webhook] Done — call=${callId} latency=${notificationLatencyMs}ms`
      )
    }

    return Response.json({ success: true }, { status: 200 })
  } catch (err) {
    // Always return 200 — ElevenLabs retries on non-200, causing duplicate processing
    console.error('[elevenlabs-webhook] Unhandled error:', err)
    return Response.json({ error: 'internal' }, { status: 200 })
  }
}
