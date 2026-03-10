import { createClient } from '@supabase/supabase-js'
import { getAppUrl, getRequiredEnv } from '@/lib/env'
import { twimlElevenLabs, twimlEmptyResponse } from '@/lib/twilio/voice'
import {
  formParamsToObject,
  getTwilioAuthToken,
  shouldValidateTwilioWebhook,
  validateTwilioSignature,
} from '@/lib/twilio/webhook'

interface Business {
  id: string
}

function getSupabaseAdmin() {
  const url = getRequiredEnv('NEXT_PUBLIC_SUPABASE_URL', 'twilio/dial-fallback')
  const key = getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY', 'twilio/dial-fallback')

  if (!url || !key) {
    throw new Error('[twilio/dial-fallback] Missing Supabase env vars')
  }

  return createClient(url, key)
}

function xmlResponse(twiml: string): Response {
  return new Response(twiml, {
    status: 200,
    headers: { 'Content-Type': 'text/xml' },
  })
}

function twimlError(): string {
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Say>We're sorry, we're experiencing technical difficulties. Please call back shortly.</Say><Hangup/></Response>`
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.text()
    const params = new URLSearchParams(body)
    const dialCallStatus = params.get('DialCallStatus') ?? ''
    const to = params.get('To') ?? ''
    const from = params.get('From') ?? ''
    const callSid = params.get('CallSid') ?? ''

    const skipValidation =
      process.env.NODE_ENV !== 'production' &&
      process.env.SKIP_TWILIO_VALIDATION?.trim() === 'true'

    if (!skipValidation && shouldValidateTwilioWebhook()) {
      const authToken = getTwilioAuthToken('twilio/dial-fallback')
      if (!authToken) {
        return xmlResponse(twimlError())
      }

      const signature = request.headers.get('X-Twilio-Signature') ?? ''
      const isValid = validateTwilioSignature(
        authToken,
        signature,
        `${getAppUrl(request)}/api/webhook/twilio/dial-fallback`,
        formParamsToObject(params)
      )

      if (!isValid) {
        console.warn(`[twilio/dial-fallback] Invalid signature for callSid=${callSid}`)
        return xmlResponse(twimlError())
      }
    }

    if (dialCallStatus === 'completed') {
      return xmlResponse(twimlEmptyResponse())
    }

    const agentId = getRequiredEnv('ELEVENLABS_AGENT_ID', 'twilio/dial-fallback')
    if (!agentId) {
      return xmlResponse(twimlError())
    }

    const supabase = getSupabaseAdmin()
    const { data: business, error } = await supabase
      .from('businesses')
      .select('id')
      .eq('twilio_phone_number', to.trim())
      .eq('is_active', true)
      .maybeSingle<Business>()

    if (error) {
      console.error('[twilio/dial-fallback] Failed to load business:', error)
      return xmlResponse(twimlError())
    }

    if (!business) {
      return xmlResponse(twimlEmptyResponse())
    }

    console.info(`[twilio/dial-fallback] Routing fallback callSid=${callSid} business=${business.id}`)
    return xmlResponse(twimlElevenLabs(agentId, from, callSid, business.id))
  } catch (error) {
    console.error('[twilio/dial-fallback] Unhandled error:', error)
    return xmlResponse(twimlError())
  }
}
