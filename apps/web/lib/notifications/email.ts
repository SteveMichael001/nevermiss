import { Resend } from 'resend'

const RESEND_API_KEY = process.env.RESEND_API_KEY
if (!RESEND_API_KEY) {
  console.warn('[Email] RESEND_API_KEY not set — email notifications will fail at runtime')
}

const FROM_EMAIL = process.env.FROM_EMAIL ?? 'NeverMiss AI <notifications@nevermiss.ai>'
const DASHBOARD_URL = process.env.DASHBOARD_URL ?? 'https://app.nevermiss.ai'

export interface SendLeadEmailParams {
  ownerEmail: string
  additionalEmails?: string[]
  businessName: string
  ownerName: string
  callerName: string
  callerPhone: string
  serviceNeeded: string
  urgency: 'emergency' | 'urgent' | 'routine'
  preferredCallback: string
  fullTranscript: string
  callId?: string
  recordingUrl?: string
}

export interface SendLeadEmailResult {
  success: boolean
  emailId?: string
  error?: string
}

export async function sendLeadEmail(params: SendLeadEmailParams): Promise<SendLeadEmailResult> {
  if (!RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY env var is not set')
  }

  const resend = new Resend(RESEND_API_KEY)

  const recipients = [params.ownerEmail]
  if (params.additionalEmails) {
    for (const email of params.additionalEmails) {
      if (email && !recipients.includes(email)) {
        recipients.push(email)
      }
    }
  }

  const isEmergency = params.urgency === 'emergency'
  const subject = `${isEmergency ? '[EMERGENCY] ' : ''}[NeverMiss] New lead: ${params.callerName} — ${params.serviceNeeded}`

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: recipients,
      subject,
      html: buildEmailHTML(params),
    })

    if (error) {
      console.error('[Email] Resend error:', error)
      return { success: false, error: error.message }
    }

    return { success: true, emailId: data?.id }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[Email] Unexpected error:', msg)
    return { success: false, error: msg }
  }
}

function buildEmailHTML(params: SendLeadEmailParams): string {
  const {
    businessName,
    callerName,
    callerPhone,
    serviceNeeded,
    urgency,
    preferredCallback,
    fullTranscript,
    callId,
    recordingUrl,
  } = params

  const isEmergency = urgency === 'emergency'
  const callbackDisplay = isEmergency ? 'ASAP' : preferredCallback
  const dashboardLink = callId
    ? `${DASHBOARD_URL}/dashboard?call=${callId}`
    : `${DASHBOARD_URL}/dashboard`

  const urgencyColor =
    urgency === 'emergency' ? '#dc2626' : urgency === 'urgent' ? '#d97706' : '#16a34a'
  const urgencyLabel =
    urgency === 'emergency' ? '🔴 EMERGENCY' : urgency === 'urgent' ? '🟡 Urgent' : '🟢 Routine'

  const transcriptHTML = fullTranscript
    ? fullTranscript
        .split('\n')
        .map(
          (line) =>
            `<p style="margin:4px 0;font-family:monospace;font-size:13px;">${escapeHTML(line)}</p>`
        )
        .join('')
    : '<p style="color:#6b7280;font-style:italic;">No transcript available</p>'

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>New Lead — ${escapeHTML(businessName)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:24px 16px;">

    <div style="background-color:#111827;color:white;padding:20px 24px;border-radius:12px 12px 0 0;">
      <p style="margin:0;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;">NeverMiss AI</p>
      <h1 style="margin:4px 0 0;font-size:20px;font-weight:700;">${isEmergency ? '🚨 Emergency Lead' : '🔔 New Lead'}</h1>
      <p style="margin:4px 0 0;font-size:14px;color:#d1d5db;">${escapeHTML(businessName)}</p>
    </div>

    <div style="background:white;padding:24px;border:1px solid #e5e7eb;border-top:0;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:8px 0;color:#6b7280;font-size:13px;width:120px;">Caller</td>
          <td style="padding:8px 0;font-weight:600;font-size:15px;">👤 ${escapeHTML(callerName)}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#6b7280;font-size:13px;">Phone</td>
          <td style="padding:8px 0;">
            <a href="tel:${escapeHTML(callerPhone)}" style="color:#2563eb;font-weight:600;font-size:15px;text-decoration:none;">📞 ${escapeHTML(callerPhone)}</a>
          </td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#6b7280;font-size:13px;">Service</td>
          <td style="padding:8px 0;font-size:15px;">🔧 ${escapeHTML(serviceNeeded)}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#6b7280;font-size:13px;">Callback</td>
          <td style="padding:8px 0;font-size:15px;">⏰ ${escapeHTML(callbackDisplay)}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#6b7280;font-size:13px;">Urgency</td>
          <td style="padding:8px 0;">
            <span style="background-color:${urgencyColor}22;color:${urgencyColor};padding:2px 10px;border-radius:12px;font-size:13px;font-weight:600;">${urgencyLabel}</span>
          </td>
        </tr>
      </table>
    </div>

    <div style="background:white;padding:16px 24px;border:1px solid #e5e7eb;border-top:0;">
      <a href="tel:${escapeHTML(callerPhone)}" style="display:inline-block;background-color:#16a34a;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;margin-right:12px;">
        📞 Call Back Now
      </a>
      <a href="${dashboardLink}" style="display:inline-block;background-color:#2563eb;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
        View in Dashboard
      </a>
    </div>

    ${
      recordingUrl
        ? `<div style="background:white;padding:16px 24px;border:1px solid #e5e7eb;border-top:0;">
      <p style="margin:0 0 8px;font-weight:600;font-size:13px;color:#374151;">🎙 Call Recording</p>
      <a href="${escapeHTML(recordingUrl)}" style="color:#2563eb;font-size:13px;">Listen to recording →</a>
    </div>`
        : ''
    }

    <div style="background:white;padding:20px 24px;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 12px 12px;">
      <p style="margin:0 0 12px;font-weight:600;font-size:13px;color:#374151;">📝 Call Transcript</p>
      <div style="background:#f9fafb;border-radius:8px;padding:16px;">
        ${transcriptHTML}
      </div>
    </div>

    <p style="text-align:center;color:#9ca3af;font-size:12px;margin-top:16px;">
      NeverMiss AI — 24/7 AI phone answering for home service contractors<br>
      <a href="${DASHBOARD_URL}/dashboard/settings" style="color:#6b7280;">Manage notification settings</a>
    </p>

  </div>
</body>
</html>`
}

function escapeHTML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
