import { createHmac } from 'crypto'
import { getRequiredEnv } from '@/lib/env'

export function validateTwilioSignature(
  authToken: string,
  signature: string,
  url: string,
  params: Record<string, string>
): boolean {
  const sortedKeys = Object.keys(params).sort()
  const dataToSign = url + sortedKeys.map((key) => key + params[key]).join('')
  const expected = createHmac('sha1', authToken).update(dataToSign).digest('base64')

  return expected === signature
}

export function shouldValidateTwilioWebhook(): boolean {
  return process.env.NODE_ENV === 'production'
}

export function getTwilioAuthToken(logPrefix: string): string | null {
  return getRequiredEnv('TWILIO_AUTH_TOKEN', logPrefix)
}

export function formParamsToObject(params: URLSearchParams): Record<string, string> {
  const values: Record<string, string> = {}

  params.forEach((value, key) => {
    values[key] = value
  })

  return values
}
