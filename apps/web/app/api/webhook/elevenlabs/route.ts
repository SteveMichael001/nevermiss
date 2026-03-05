import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendLeadSMS } from '@/lib/notifications/sms'
import { sendLeadEmail } from '@/lib/notifications/email'

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface ElevenLabsWebhookPayload {
  type: 'conversation_ended'
  conversation_id: string
  agent_id: string
  status: 'done' | 'error'
  transcript: Array<{
    role: 'agent' | 'user'
    message: string
    time_in_call_secs: number
  }>
  metadata: {
    start_time_unix_secs: number
    call_duration_secs: number
    cost: number
  }
  analysis: {
    evaluation_criteria_results: Record<string, unknown>
    data_collection_results: {
      caller_name?: { value: string }
      service_needed?: { value: string }
      urgency?: { value: 'emergency' | 'urgent' | 'routine' }
      preferred_callback?: { value: string }
    }
    call_successful: string
  }
  conversation_initiation_client_data?: {
    dynamic_variables?: {
      caller_phone?: string
      twilio_call_sid?: string
      business_id?: string
    }
  }
}

// ─────────────────────────────────────────────
// Signature verification
// ─────────────────────────────────────────────

async function verifyElevenLabsSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string
): Promise<boolean> {
  if (!signatureHeader) return false

  // ElevenLabs signature format: "t=<timestamp>,v1=<hmac>"
  const parts = Object.fromEntries(
    signatureHeader.split(',').map((part) => part.split('=') as [string, string])
  )
  const timestamp = parts['t']
  const receivedHmac = parts['v1']

  if (!timestamp || !receivedHmac) return false

  // Reject if timestamp is >5 minutes old (replay attack prevention)
  const ts = parseInt(timestamp, 10)
  if (Math.abs(Date.now() / 1000 - ts) > 300) return false

  const signedPayload = `${timestamp}.${rawBody}`

  const encoder = new TextEncoder()
  const keyData = encoder.encode(secret)
  const messageData = encoder.encode(signedPayload)

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData)
  const computedHmac = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  return computedHmac === receivedHmac
}

// ─────────────────────────────────────────────
// POST handler
// ─────────────────────────────────────────────

export async function POST(request: Request) {
  const webhookSecret = process.env.ELEVENLABS_WEBHOOK_SECRET
  if (!webhookSecret) {
    throw new Error('ELEVENLABS_WEBHOOK_SECRET env var is not set')
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase env vars not configured')
  }

  const rawBody = await request.text()
  const signatureHeader = request.headers.get('ElevenLabs-Signature')

  const isValid = await verifyElevenLabsSignature(rawBody, signatureHeader, webhookSecret)
  if (!isValid) {
    console.error('[ElevenLabs Webhook] Invalid signature')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let payload: ElevenLabsWebhookPayload
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Only handle conversation_ended events
  if (payload.type !== 'conversation_ended') {
    return NextResponse.json({ success: true, skipped: true })
  }

  // Extract key fields
  const agentId = payload.agent_id
  const conversationId = payload.conversation_id
  const dynamicVars = payload.conversation_initiation_client_data?.dynamic_variables ?? {}
  const callerPhone = dynamicVars.caller_phone ?? null
  const twilioCallSid = dynamicVars.twilio_call_sid ?? conversationId
  const durationSecs = payload.metadata.call_duration_secs

  const dataCollection = payload.analysis.data_collection_results
  const callerName = dataCollection.caller_name?.value ?? null
  const serviceNeeded = dataCollection.service_needed?.value ?? null
  const urgency = dataCollection.urgency?.value ?? 'routine'
  const preferredCallback = dataCollection.preferred_callback?.value ?? null

  // Build transcript text
  const fullTranscript = payload.transcript
    .map((t) => `${t.role === 'agent' ? 'AI' : 'Caller'}: ${t.message}`)
    .join('\n')

  // Service role client — bypasses RLS for webhook inserts
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Look up business by elevenlabs_agent_id
  const { data: business, error: bizError } = await supabase
    .from('businesses')
    .select('id, name, owner_phone, owner_email, owner_name, notification_phones, notification_emails')
    .eq('elevenlabs_agent_id', agentId)
    .single()

  if (bizError || !business) {
    console.error(`[ElevenLabs Webhook] No business found for agent_id: ${agentId}`, bizError)
    return NextResponse.json({ error: 'Business not found for this agent' }, { status: 404 })
  }

  // Insert call record
  const { data: callRecord, error: insertError } = await supabase
    .from('calls')
    .insert({
      business_id: business.id,
      twilio_call_sid: twilioCallSid,
      elevenlabs_conversation_id: conversationId,
      caller_phone: callerPhone,
      duration_seconds: Math.round(durationSecs),
      caller_name: callerName,
      service_needed: serviceNeeded,
      urgency,
      preferred_callback: preferredCallback,
      full_transcript: fullTranscript,
      extraction_json: payload.analysis,
      lead_status: 'new',
    })
    .select('id')
    .single()

  if (insertError) {
    console.error('[ElevenLabs Webhook] Failed to insert call record:', insertError)
    return NextResponse.json({ error: 'Failed to save call' }, { status: 500 })
  }

  const callId = callRecord.id

  // Send SMS notification (awaited — we want to record sentAt)
  const smsResult = await sendLeadSMS({
    ownerPhone: business.owner_phone,
    additionalPhones: business.notification_phones ?? [],
    businessName: business.name,
    callerName: callerName ?? 'Unknown caller',
    callerPhone: callerPhone ?? 'Unknown number',
    serviceNeeded: serviceNeeded ?? 'Service request',
    urgency,
    preferredCallback: preferredCallback ?? 'As soon as possible',
  })

  if (smsResult.sentAt) {
    await supabase
      .from('calls')
      .update({ sms_sent_at: smsResult.sentAt.toISOString() })
      .eq('id', callId)
  }

  // Send email notification — fire and forget
  sendLeadEmail({
    ownerEmail: business.owner_email,
    additionalEmails: business.notification_emails ?? [],
    businessName: business.name,
    ownerName: business.owner_name,
    callerName: callerName ?? 'Unknown caller',
    callerPhone: callerPhone ?? 'Unknown number',
    serviceNeeded: serviceNeeded ?? 'Service request',
    urgency,
    preferredCallback: preferredCallback ?? 'As soon as possible',
    fullTranscript,
    callId,
  }).then(async (emailResult) => {
    if (emailResult.success) {
      await supabase
        .from('calls')
        .update({ email_sent_at: new Date().toISOString() })
        .eq('id', callId)
    }
  }).catch((err) => {
    console.error('[ElevenLabs Webhook] Email notification failed:', err)
  })

  console.log(`[ElevenLabs Webhook] Processed call ${conversationId} for business ${business.name}`)
  return NextResponse.json({ success: true, callId })
}
