import twilio from 'twilio'
import { formatPhone } from '@/lib/utils'
import { getRequiredEnv } from '@/lib/env'
import { redactPhone } from '@/lib/utils'

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

export interface SendWelcomeSMSParams {
  ownerPhone: string
  ownerName: string
  twilioPhoneNumber: string
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

function getTwilioMessagingConfig() {
  const accountSid = getRequiredEnv('TWILIO_ACCOUNT_SID', 'notifications/sms')
  const authToken = getRequiredEnv('TWILIO_AUTH_TOKEN', 'notifications/sms')
  const defaultPhoneNumber = getRequiredEnv('TWILIO_PHONE_NUMBER', 'notifications/sms')
  const smsPhoneNumber = process.env.TWILIO_SMS_NUMBER?.trim() || defaultPhoneNumber

  if (!accountSid || !authToken || !defaultPhoneNumber || !smsPhoneNumber) {
    throw new Error('[notifications/sms] Twilio env vars not configured')
  }

  return {
    client: twilio(accountSid, authToken),
    fromNumber: smsPhoneNumber,
  }
}

export async function sendLeadSMS(params: SendLeadSMSParams): Promise<SendLeadSMSResult> {
  const { client, fromNumber } = getTwilioMessagingConfig()
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
          from: fromNumber,
          to,
          body: message,
        })
        anySucceeded = true
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error(`[notifications/sms] Failed to send to ${redactPhone(to)}:`, msg)
        errors.push(`${redactPhone(to)}: ${msg}`)
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

export async function sendWelcomeSMS(
  params: SendWelcomeSMSParams
): Promise<SendLeadSMSResult> {
  const { client, fromNumber } = getTwilioMessagingConfig()
  const message = [
    `Welcome to NeverMiss, ${params.ownerName}! 🎉`,
    '',
    `Your AI number is ready: ${formatPhone(params.twilioPhoneNumber)}`,
    '',
    "Book your free 10-min setup call with Steve and you'll be live same day:",
    'https://calendly.com/stevenchranowski3/nevermissonboarding',
    '',
    '- The NeverMiss Team',
  ].join('\n')

  const sentAt = new Date()

  try {
    await client.messages.create({
      from: fromNumber,
      to: params.ownerPhone,
      body: message,
    })

    return {
      success: true,
      sentAt,
      recipients: [params.ownerPhone],
      errors: [],
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(
      `[notifications/sms] Failed to send welcome SMS to ${redactPhone(params.ownerPhone)}:`,
      msg
    )

    return {
      success: false,
      sentAt: null,
      recipients: [params.ownerPhone],
      errors: [`${redactPhone(params.ownerPhone)}: ${msg}`],
    }
  }
}
