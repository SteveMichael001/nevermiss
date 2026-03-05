import twilio from 'twilio'

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER

export interface SendLeadSMSParams {
  ownerPhone: string
  additionalPhones?: string[]
  businessName: string
  callerName: string
  callerPhone: string
  serviceNeeded: string
  urgency: 'emergency' | 'urgent' | 'routine'
  preferredCallback: string
}

export interface SendLeadSMSResult {
  success: boolean
  sentAt: Date | null
  recipients: string[]
  errors: string[]
}

function formatMessage(params: SendLeadSMSParams): string {
  const { businessName, callerName, callerPhone, serviceNeeded, urgency, preferredCallback } = params

  if (urgency === 'emergency') {
    return [
      `🚨 EMERGENCY — ${businessName}`,
      '',
      `👤 ${callerName}`,
      `📞 ${callerPhone}`,
      `🔧 ${serviceNeeded} [URGENT]`,
      `⏰ Callback: ASAP`,
      '',
      `Tap to call back:`,
      `tel:${callerPhone}`,
    ].join('\n')
  }

  return [
    `🔔 New Lead — ${businessName}`,
    '',
    `👤 ${callerName}`,
    `📞 ${callerPhone}`,
    `🔧 ${serviceNeeded}`,
    `⏰ Callback: ${preferredCallback}`,
    '',
    `Tap to call back:`,
    `tel:${callerPhone}`,
  ].join('\n')
}

export async function sendLeadSMS(params: SendLeadSMSParams): Promise<SendLeadSMSResult> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    throw new Error('Twilio env vars not configured (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER)')
  }

  const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
  const message = formatMessage(params)

  const recipients = [params.ownerPhone]
  if (params.additionalPhones) {
    for (const phone of params.additionalPhones) {
      if (phone && !recipients.includes(phone)) {
        recipients.push(phone)
      }
    }
  }

  const errors: string[] = []
  let anySucceeded = false
  const sentAt = new Date()

  await Promise.all(
    recipients.map(async (to) => {
      try {
        await client.messages.create({
          from: TWILIO_PHONE_NUMBER!,
          to,
          body: message,
        })
        anySucceeded = true
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error(`[SMS] Failed to send to ${to}:`, msg)
        errors.push(`${to}: ${msg}`)
      }
    })
  )

  return {
    success: anySucceeded,
    sentAt: anySucceeded ? sentAt : null,
    recipients,
    errors,
  }
}
