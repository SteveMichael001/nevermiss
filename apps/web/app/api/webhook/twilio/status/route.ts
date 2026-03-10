import { getAppUrl } from '@/lib/env'
import {
  formParamsToObject,
  getTwilioAuthToken,
  shouldValidateTwilioWebhook,
  validateTwilioSignature,
} from '@/lib/twilio/webhook'
import { redactPhone } from '@/lib/utils'

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.text()
    const params = new URLSearchParams(body)
    const callSid = params.get('CallSid') ?? ''
    const callStatus = params.get('CallStatus') ?? ''
    const to = params.get('To') ?? ''
    const from = params.get('From') ?? ''
    const duration = params.get('CallDuration') ?? '0'

    const skipValidation =
      process.env.NODE_ENV !== 'production' &&
      process.env.SKIP_TWILIO_VALIDATION?.trim() === 'true'

    if (!skipValidation && shouldValidateTwilioWebhook()) {
      const authToken = getTwilioAuthToken('twilio/status')
      if (!authToken) {
        return new Response('', { status: 200 })
      }

      const signature = request.headers.get('X-Twilio-Signature') ?? ''
      const isValid = validateTwilioSignature(
        authToken,
        signature,
        `${getAppUrl(request)}/api/webhook/twilio/status`,
        formParamsToObject(params)
      )

      if (!isValid) {
        console.warn(`[twilio/status] Invalid signature for callSid=${callSid}`)
        return new Response('', { status: 200 })
      }
    }

    console.info(
      `[twilio/status] callSid=${callSid} status=${callStatus} to=${redactPhone(to)} from=${redactPhone(from)} duration=${duration}s`
    )

    return new Response('', { status: 200 })
  } catch (error) {
    console.error('[twilio/status] Unhandled error:', error)
    return new Response('', { status: 200 })
  }
}
