/**
 * POST /api/webhook/twilio/voice
 *
 * Inbound call router — every call to a NeverMiss Twilio number hits this first.
 *
 * Routing logic:
 *   1. Parse Twilio webhook POST (form-encoded: To, From, CallSid)
 *   2. Validate Twilio signature (skip in dev, enforce in prod unless SKIP_TWILIO_VALIDATION=true)
 *   3. Look up business in Supabase by twilio_phone_number = To
 *   4. If not found or is_active = false → TwiML <Hangup/>
 *   5. Determine current time in the business's timezone
 *   6. Check if current time falls within business_hours for today:
 *      - IN HOURS (open/close set, time within range)  → TwiML <Dial> owner's cell
 *      - OUT OF HOURS or null hours ("all day" = AI answers) → TwiML <Stream> to ElevenLabs
 *   7. Log routing decision to console
 *
 * Note: businesses.timezone column does not exist yet — defaulting to America/Los_Angeles.
 * TODO: ADD `timezone TEXT DEFAULT 'America/Los_Angeles'` to businesses table in Supabase.
 *
 * Business hours JSONB schema:
 *   { mon: { open: "08:00", close: "17:00" }, tue: {...}, sat: { open: null, close: null }, ... }
 *   null open/close means "all day" — AI always answers that day.
 */

import { createClient } from '@supabase/supabase-js'
import { createHmac } from 'crypto'
import { toZonedTime, format } from 'date-fns-tz'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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
  twilio_phone_number: string
  business_hours: BusinessHours | null
  is_active: boolean
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Supabase admin client — no cookie auth needed for webhook routes */
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!url || !key) {
    throw new Error('Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }
  return createClient(url, key)
}

/**
 * Validate a Twilio webhook signature using Node's built-in crypto (no twilio package needed).
 * https://www.twilio.com/docs/usage/webhooks/webhooks-security
 */
function validateTwilioSignature(
  authToken: string,
  signature: string,
  url: string,
  params: Record<string, string>
): boolean {
  // Sort all POST params alphabetically and concatenate key+value pairs to the URL
  const sortedKeys = Object.keys(params).sort()
  const dataToSign = url + sortedKeys.map(k => k + params[k]).join('')
  const expected = createHmac('sha1', authToken).update(dataToSign).digest('base64')
  return expected === signature
}

const DAY_KEYS: DayKey[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

/**
 * Returns true if the current time (in the given timezone) is within business hours.
 * Returns false if out of hours OR if hours are null (null = "all day" → AI always answers).
 */
function isWithinBusinessHours(
  businessHours: BusinessHours | null,
  timezone: string
): boolean {
  if (!businessHours) return false // no config → AI always answers

  const now = new Date()
  const zoned = toZonedTime(now, timezone)

  const dayIndex = zoned.getDay() // 0 = Sunday
  const dayKey = DAY_KEYS[dayIndex]
  const todayHours = businessHours[dayKey]

  if (!todayHours) return false // day not configured → AI answers
  if (todayHours.open === null || todayHours.close === null) return false // "all day" → AI answers

  const currentTime = format(zoned, 'HH:mm', { timeZone: timezone })
  return currentTime >= todayHours.open && currentTime < todayHours.close
}

/** TwiML: hang up (business not found or inactive) */
function twimlHangup(): string {
  return '<?xml version="1.0" encoding="UTF-8"?><Response><Hangup/></Response>'
}

/** TwiML: forward to owner's cell phone */
function twimlDial(ownerPhone: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Dial><Number>${ownerPhone}</Number></Dial></Response>`
}

/** TwiML: connect to ElevenLabs via Twilio Media Streams */
function twimlElevenLabs(
  agentId: string,
  callerPhone: string,
  callSid: string,
  businessId: string
): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Stream url="wss://api.elevenlabs.io/v1/convai/twilio?agent_id=${agentId}">
      <Parameter name="caller_phone" value="${callerPhone}"/>
      <Parameter name="twilio_call_sid" value="${callSid}"/>
      <Parameter name="business_id" value="${businessId}"/>
    </Stream>
  </Connect>
</Response>`
}

/** TwiML: generic error — always return 200 so Twilio doesn't retry */
function twimlError(): string {
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Say>We're sorry, we're experiencing technical difficulties. Please call back shortly.</Say><Hangup/></Response>`
}

/** Build a Response with text/xml content type */
function xmlResponse(twiml: string, status = 200): Response {
  return new Response(twiml, {
    status,
    headers: { 'Content-Type': 'text/xml' },
  })
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(req: Request): Promise<Response> {
  try {
    // 1. Parse form-encoded Twilio webhook body
    const body = await req.text()
    const params = new URLSearchParams(body)
    const to = params.get('To') ?? ''
    const from = params.get('From') ?? ''
    const callSid = params.get('CallSid') ?? ''

    // 2. Validate Twilio signature in production (skip if SKIP_TWILIO_VALIDATION=true)
    if (process.env.NODE_ENV === 'production' && process.env.SKIP_TWILIO_VALIDATION?.trim() !== 'true') {
      const authToken = process.env.TWILIO_AUTH_TOKEN?.trim()
      if (!authToken) {
        console.error('[voice] TWILIO_AUTH_TOKEN not set — cannot validate signature')
        return xmlResponse(twimlError())
      }

      const signature = req.headers.get('X-Twilio-Signature') ?? ''
      const url = process.env.NEXT_PUBLIC_APP_URL?.trim()
        ? `${process.env.NEXT_PUBLIC_APP_URL.trim()}/api/webhook/twilio/voice`
        : `https://${req.headers.get('host')}/api/webhook/twilio/voice`

      // Convert URLSearchParams to plain object for validation
      const paramObj: Record<string, string> = {}
      params.forEach((value, key) => { paramObj[key] = value })

      const isValid = validateTwilioSignature(authToken, signature, url, paramObj)
      if (!isValid) {
        console.warn('[voice] Invalid Twilio signature — rejecting request')
        return xmlResponse(twimlError())
      }
    }

    // 3. Look up business by Twilio phone number
    const supabase = getSupabaseAdmin()
    const { data: business, error } = await supabase
      .from('businesses')
      .select('id, name, owner_phone, twilio_phone_number, business_hours, is_active')
      .eq('twilio_phone_number', to.trim())
      .single<Business>()

    if (error || !business) {
      console.warn(`[voice] Business not found for number: ${to}`)
      return xmlResponse(twimlHangup())
    }

    // 4. Check if business is active
    if (!business.is_active) {
      console.warn(`[voice] Business is inactive: ${business.name} (${business.id})`)
      return xmlResponse(twimlHangup())
    }

    // 5. Determine timezone
    // TODO: use business.timezone once `timezone TEXT DEFAULT 'America/Los_Angeles'` column is added
    const timezone = 'America/Los_Angeles'

    // 6. Route based on business hours
    const inHours = isWithinBusinessHours(business.business_hours, timezone)

    if (inHours) {
      // In hours: forward to owner's cell
      console.log(`[voice] IN HOURS → Dialing owner | business="${business.name}" to=${to} from=${from} callSid=${callSid}`)
      return xmlResponse(twimlDial(business.owner_phone))
    } else {
      // Out of hours (or all-day AI): connect to ElevenLabs
      const agentId = process.env.ELEVENLABS_AGENT_ID?.trim()
      if (!agentId) {
        console.error('[voice] ELEVENLABS_AGENT_ID not set')
        return xmlResponse(twimlError())
      }

      console.log(`[voice] OUT OF HOURS → ElevenLabs AI | business="${business.name}" to=${to} from=${from} callSid=${callSid}`)
      return xmlResponse(twimlElevenLabs(agentId, from, callSid, business.id))
    }
  } catch (err) {
    // Always return 200 to Twilio — non-200 causes retries and duplicate calls
    console.error('[voice] Unhandled error:', err)
    // In debug mode, speak the error so we can diagnose it
    if (process.env.SKIP_TWILIO_VALIDATION?.trim() === 'true') {
      const msg = err instanceof Error ? err.message : String(err)
      return xmlResponse(`<?xml version="1.0" encoding="UTF-8"?><Response><Say>${msg}</Say><Hangup/></Response>`)
    }
    return xmlResponse(twimlError())
  }
}
