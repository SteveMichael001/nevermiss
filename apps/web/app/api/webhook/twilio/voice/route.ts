import { createClient } from '@supabase/supabase-js'
import { format, toZonedTime } from 'date-fns-tz'
import { getAppUrl, getRequiredEnv } from '@/lib/env'
import { twimlElevenLabs } from '@/lib/twilio/voice'
import {
  formParamsToObject,
  getTwilioAuthToken,
  shouldValidateTwilioWebhook,
  validateTwilioSignature,
} from '@/lib/twilio/webhook'
import { redactPhone } from '@/lib/utils'

// Architecture note:
// 1. Active production routing: Twilio points directly to ElevenLabs native inbound handling at
//    https://api.us.elevenlabs.io/twilio/inbound_call. ElevenLabs then calls our variables webhook
//    before the conversation and our post-call webhook after the conversation.
// 2. Standby fallback routing: if the Twilio voice URL is ever pointed back at Vercel, this route
//    handles business-hours owner forwarding first, then falls back to the legacy ElevenLabs
//    WebSocket TwiML flow. Native ElevenLabs is preferred today because it is the live path.

type DayKey = 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat'

interface DayHours {
  open: string | null
  close: string | null
}

type BusinessHours = Partial<Record<DayKey, DayHours>>

interface Business {
  id: string
  name: string
  owner_phone: string
  dial_timeout_seconds: number | null
  business_hours: BusinessHours | null
  is_active: boolean
  timezone: string | null
}

const DAY_KEYS: DayKey[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

function getSupabaseAdmin() {
  const url = getRequiredEnv('NEXT_PUBLIC_SUPABASE_URL', 'twilio/voice')
  const key = getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY', 'twilio/voice')

  if (!url || !key) {
    throw new Error('[twilio/voice] Missing Supabase env vars')
  }

  return createClient(url, key)
}

function xmlResponse(twiml: string): Response {
  return new Response(twiml, {
    status: 200,
    headers: { 'Content-Type': 'text/xml' },
  })
}

function twimlHangup(): string {
  return '<?xml version="1.0" encoding="UTF-8"?><Response><Hangup/></Response>'
}

function twimlError(): string {
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Say>We're sorry, we're experiencing technical difficulties. Please call back shortly.</Say><Hangup/></Response>`
}

function twimlDial(ownerPhone: string, appUrl: string, timeoutSeconds: number): string | null {
  if (timeoutSeconds === 0) return null

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial action="${appUrl}/api/webhook/twilio/dial-fallback" timeout="${timeoutSeconds}" method="POST">
    <Number>${ownerPhone}</Number>
  </Dial>
</Response>`
}

function isWithinBusinessHours(businessHours: BusinessHours | null, timezone: string): boolean {
  if (!businessHours) return false

  const zoned = toZonedTime(new Date(), timezone)
  const dayKey = DAY_KEYS[zoned.getDay()]
  const todayHours = businessHours[dayKey]

  if (!todayHours) return false
  if (todayHours.open === null || todayHours.close === null) return false

  const currentTime = format(zoned, 'HH:mm', { timeZone: timezone })
  return currentTime >= todayHours.open && currentTime < todayHours.close
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.text()
    const params = new URLSearchParams(body)
    const to = params.get('To') ?? ''
    const from = params.get('From') ?? ''
    const callSid = params.get('CallSid') ?? ''

    const skipValidation =
      process.env.NODE_ENV !== 'production' &&
      process.env.SKIP_TWILIO_VALIDATION?.trim() === 'true'

    if (!skipValidation && shouldValidateTwilioWebhook()) {
      const authToken = getTwilioAuthToken('twilio/voice')
      if (!authToken) {
        return xmlResponse(twimlError())
      }

      const signature = request.headers.get('X-Twilio-Signature') ?? ''
      const isValid = validateTwilioSignature(
        authToken,
        signature,
        `${getAppUrl(request)}/api/webhook/twilio/voice`,
        formParamsToObject(params)
      )

      if (!isValid) {
        console.warn(`[twilio/voice] Invalid signature for callSid=${callSid}`)
        return xmlResponse(twimlError())
      }
    }

    const supabase = getSupabaseAdmin()
    const { data: business, error } = await supabase
      .from('businesses')
      .select('id, name, owner_phone, dial_timeout_seconds, business_hours, is_active, timezone')
      .eq('twilio_phone_number', to.trim())
      .maybeSingle<Business>()

    if (error) {
      console.error('[twilio/voice] Failed to load business:', error)
      return xmlResponse(twimlError())
    }

    if (!business) {
      console.warn(`[twilio/voice] Business not found for number=${redactPhone(to)}`)
      return xmlResponse(twimlHangup())
    }

    if (!business.is_active) {
      console.warn(`[twilio/voice] Inactive business id=${business.id}`)
      return xmlResponse(twimlHangup())
    }

    const timezone = business.timezone || 'America/Los_Angeles'
    const inHours = isWithinBusinessHours(business.business_hours, timezone)
    const appUrl = getAppUrl(request)
    const dialTimeoutSeconds = business.dial_timeout_seconds ?? 20

    if (inHours) {
      const dialResponse = twimlDial(business.owner_phone, appUrl, dialTimeoutSeconds)

      if (dialResponse) {
        console.info(
          `[twilio/voice] Forwarding callSid=${callSid} business=${business.id} from=${redactPhone(from)}`
        )
        return xmlResponse(dialResponse)
      }
    }

    const agentId = getRequiredEnv('ELEVENLABS_AGENT_ID', 'twilio/voice')
    if (!agentId) {
      return xmlResponse(twimlError())
    }

    console.info(
      `[twilio/voice] Routing to AI callSid=${callSid} business=${business.id} from=${redactPhone(from)}`
    )
    return xmlResponse(twimlElevenLabs(agentId, from, callSid, business.id))
  } catch (error) {
    console.error('[twilio/voice] Unhandled error:', error)
    return xmlResponse(twimlError())
  }
}
