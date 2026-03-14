import { createHmac, timingSafeEqual } from 'crypto'
import { createClient } from '@supabase/supabase-js'
import { sendLeadEmail } from '@/lib/notifications/email'
import { sendLeadSMS } from '@/lib/notifications/sms'
import { getRequiredEnv } from '@/lib/env'
import { fetchAndStoreRecording } from '@/lib/recordings'
import { redactPhone } from '@/lib/utils'

export const runtime = 'nodejs'

const WEBHOOK_SECRET = process.env.ELEVENLABS_WEBHOOK_SECRET?.trim()

if (process.env.NODE_ENV === 'production' && !WEBHOOK_SECRET) {
  throw new Error('[elevenlabs-webhook] ELEVENLABS_WEBHOOK_SECRET is required in production')
}

interface TranscriptEntry {
  role: 'agent' | 'user'
  message: string
}

interface DataCollectionResult {
  value: string
}

interface ElevenLabsPostCallData {
  agent_id: string
  conversation_id: string
  transcript: TranscriptEntry[]
  metadata: {
    call_duration_secs: number
  }
  analysis: {
    data_collection_results: {
      caller_name?: DataCollectionResult
      service_needed?: DataCollectionResult
      service_address?: DataCollectionResult
      urgency?: { value: 'emergency' | 'urgent' | 'routine' }
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

function ok(payload: Record<string, unknown> = { received: true }) {
  return Response.json(payload, { status: 200 })
}

function getSupabaseAdmin() {
  const url = getRequiredEnv('NEXT_PUBLIC_SUPABASE_URL', 'elevenlabs-webhook')
  const key = getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY', 'elevenlabs-webhook')

  if (!url || !key) {
    throw new Error('[elevenlabs-webhook] Missing Supabase env vars')
  }

  return createClient(url, key)
}

function validateSignature(
  signatureHeader: string | null,
  rawBody: string,
  secret: string
): string | null {
  if (!signatureHeader) {
    return 'Missing ElevenLabs-Signature header'
  }

  const parts = signatureHeader.split(',')
  let timestamp: string | null = null
  let hash: string | null = null

  for (const part of parts) {
    const [key, value] = part.split('=')
    if (key === 't') timestamp = value
    if (key === 'v0') hash = value
  }

  if (!timestamp || !hash) {
    return 'Malformed ElevenLabs-Signature header'
  }

  const timestampMs = parseInt(timestamp, 10) * 1000
  if (Number.isNaN(timestampMs)) {
    return 'Invalid timestamp in ElevenLabs-Signature header'
  }

  if (Date.now() - timestampMs > 5 * 60 * 1000) {
    return 'Signature timestamp too old'
  }

  const expected = createHmac('sha256', secret)
    .update(`${timestamp}.${rawBody}`, 'utf8')
    .digest('hex')

  try {
    const expectedBuffer = Buffer.from(expected, 'hex')
    const receivedBuffer = Buffer.from(hash, 'hex')

    if (expectedBuffer.length !== receivedBuffer.length) {
      return 'Signature mismatch'
    }

    if (!timingSafeEqual(expectedBuffer, receivedBuffer)) {
      return 'Signature mismatch'
    }
  } catch {
    return 'Signature comparison failed'
  }

  return null
}

async function findBusiness(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  data: ElevenLabsPostCallData
): Promise<Business | null> {
  const dynamicVariables = data.conversation_initiation_client_data?.dynamic_variables
  const businessId = dynamicVariables?.business_id

  if (businessId) {
    const { data: business, error } = await supabase
      .from('businesses')
      .select(
        'id, name, owner_phone, owner_email, owner_name, notification_phones, notification_emails'
      )
      .eq('id', businessId)
      .maybeSingle<Business>()

    if (error) {
      console.error('[elevenlabs-webhook] Failed business lookup by id:', error)
    } else if (business) {
      return business
    }
  }

  const { data: agentBusiness, error: agentError } = await supabase
    .from('businesses')
    .select(
      'id, name, owner_phone, owner_email, owner_name, notification_phones, notification_emails'
    )
    .eq('elevenlabs_agent_id', data.agent_id)
    .maybeSingle<Business>()

  if (agentError) {
    console.error('[elevenlabs-webhook] Failed business lookup by agent:', agentError)
  } else if (agentBusiness) {
    return agentBusiness
  }

  const calledNumber =
    data.conversation_initiation_client_data?.dynamic_variables?.['system__called_number'] ?? ''

  if (!calledNumber) {
    return null
  }

  const { data: numberBusiness, error: numberError } = await supabase
    .from('businesses')
    .select(
      'id, name, owner_phone, owner_email, owner_name, notification_phones, notification_emails'
    )
    .eq('twilio_phone_number', calledNumber)
    .eq('is_active', true)
    .maybeSingle<Business>()

  if (numberError) {
    console.error('[elevenlabs-webhook] Failed business lookup by number:', numberError)
    return null
  }

  return numberBusiness
}

export async function POST(request: Request): Promise<Response> {
  try {
    const rawBody = await request.text()

    if (process.env.NODE_ENV === 'production' && WEBHOOK_SECRET) {
      const validationError = validateSignature(
        request.headers.get('ElevenLabs-Signature'),
        rawBody,
        WEBHOOK_SECRET
      )

      if (validationError) {
        console.warn('[elevenlabs-webhook] Signature validation failed:', validationError)
        return ok()
      }
    }

    let payload: ElevenLabsPostCallPayload

    try {
      payload = JSON.parse(rawBody) as ElevenLabsPostCallPayload
    } catch (error) {
      console.error('[elevenlabs-webhook] JSON parse error:', error)
      return ok()
    }

    if (payload.type !== 'post_call_transcription') {
      return ok()
    }

    const data = payload.data
    const dynamicVariables = data.conversation_initiation_client_data?.dynamic_variables
    const callerPhone = dynamicVariables?.caller_phone ?? ''
    const twilioCallSid = dynamicVariables?.twilio_call_sid ?? ''

    const supabase = getSupabaseAdmin()
    const { data: existingCall, error: existingCallError } = await supabase
      .from('calls')
      .select('id')
      .eq('elevenlabs_conversation_id', data.conversation_id)
      .maybeSingle<{ id: string }>()

    if (existingCallError) {
      console.error('[elevenlabs-webhook] Failed duplicate check:', existingCallError)
      return ok()
    }

    if (existingCall) {
      console.info(`[elevenlabs-webhook] Duplicate conversation ${data.conversation_id} ignored`)
      return ok()
    }

    const business = await findBusiness(supabase, data)
    if (!business) {
      console.warn(
        `[elevenlabs-webhook] Business not found for conversation=${data.conversation_id} caller=${redactPhone(callerPhone)}`
      )
      return ok()
    }

    const results = data.analysis.data_collection_results
    const callerName = results.caller_name?.value ?? 'unknown'
    const serviceNeeded = results.service_needed?.value ?? 'unknown'
    const serviceAddress = results.service_address?.value ?? null
    const urgency = results.urgency?.value ?? 'routine'
    const preferredCallback =
      results.preferred_callback?.value ??
      (results as Record<string, DataCollectionResult | undefined>).caller_phone?.value ??
      'unknown'
    const fullTranscript = data.transcript.map((entry) => `${entry.role}: ${entry.message}`).join('\n')

    const { data: callRecord, error: insertError } = await supabase
      .from('calls')
      .insert({
        business_id: business.id,
        twilio_call_sid: twilioCallSid || `el_${data.conversation_id}`,
        caller_phone: callerPhone,
        caller_name: callerName,
        service_needed: serviceNeeded,
        service_address: serviceAddress,
        urgency,
        preferred_callback: preferredCallback,
        full_transcript: fullTranscript,
        duration_seconds: data.metadata.call_duration_secs,
        elevenlabs_conversation_id: data.conversation_id,
        extraction_json: data.analysis as Record<string, unknown>,
      })
      .select('id')
      .single<{ id: string }>()

    if (insertError) {
      const insertMessage = insertError.message.toLowerCase()
      if (insertMessage.includes('duplicate') || insertMessage.includes('unique')) {
        console.warn(`[elevenlabs-webhook] Duplicate insert ignored for ${data.conversation_id}`)
        return ok()
      }

      console.error('[elevenlabs-webhook] Failed to insert call:', insertError)
      return ok()
    }

    const callId = callRecord.id

    fetchAndStoreRecording(data.conversation_id, callId, supabase).catch((error) => {
      console.error('[elevenlabs-webhook] Recording fetch failed:', error)
    })

    let smsSentAt: string | null = null
    let emailSentAt: string | null = null
    const notificationStartedAt = Date.now()

    try {
      const smsResult = await sendLeadSMS({
        ownerPhone: business.owner_phone,
        additionalPhones: business.notification_phones ?? undefined,
        businessName: business.name,
        callerName,
        callerPhone,
        serviceNeeded,
        urgency,
        preferredCallback,
      })

      if (smsResult.success && smsResult.sentAt) {
        smsSentAt = smsResult.sentAt.toISOString()
      }
    } catch (error) {
      console.error('[elevenlabs-webhook] SMS send failed:', error)
    }

    try {
      const emailResult = await sendLeadEmail({
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
      })

      if (emailResult.success) {
        emailSentAt = new Date().toISOString()
      }
    } catch (error) {
      console.error('[elevenlabs-webhook] Email send failed:', error)
    }

    const { error: updateError } = await supabase
      .from('calls')
      .update({
        sms_sent_at: smsSentAt,
        email_sent_at: emailSentAt,
        notification_latency_ms: Date.now() - notificationStartedAt,
      })
      .eq('id', callId)

    if (updateError) {
      console.error('[elevenlabs-webhook] Failed to update notification timestamps:', updateError)
    }

    console.info(
      `[elevenlabs-webhook] Processed conversation=${data.conversation_id} business=${business.id} caller=${redactPhone(callerPhone)}`
    )

    return ok({ success: true })
  } catch (error) {
    console.error('[elevenlabs-webhook] Unhandled error:', error)
    return ok()
  }
}
