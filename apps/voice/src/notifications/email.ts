/**
 * Email notification delivery via Resend for NeverMiss AI.
 *
 * Sends a lead summary email to the business owner (and additional recipients)
 * after each call completes. Includes:
 *   - Lead summary (same data as SMS)
 *   - Full call transcript
 *   - Link to audio recording (when available)
 *   - Link to dashboard
 */

import { Resend } from 'resend';
import type { NotificationPayload } from '../types.js';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
if (!RESEND_API_KEY) {
  console.warn('[Email] RESEND_API_KEY not set — email notifications disabled');
}

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

// From address — must be a verified domain in Resend
const FROM_EMAIL = process.env.FROM_EMAIL ?? 'NeverMiss AI <notifications@nevermiss.ai>';

// Dashboard base URL for links
const DASHBOARD_URL = process.env.DASHBOARD_URL ?? 'https://app.nevermiss.ai';

export interface EmailNotificationResult {
  success: boolean;
  emailId?: string;
  error?: string;
}

/**
 * Send a lead notification email via Resend.
 */
export async function sendLeadNotificationEmail(
  payload: NotificationPayload
): Promise<EmailNotificationResult> {
  if (!resend) {
    console.log('[Email] Email notifications disabled (no RESEND_API_KEY)');
    return { success: false, error: 'Email notifications not configured' };
  }

  const { business, callerName, callerPhone, serviceNeeded, urgency, preferredCallback, isEmergency, transcriptText, recordingUrl, callId } = payload;

  // Build recipient list
  const recipients = [business.owner_email];
  if (business.notification_emails && business.notification_emails.length > 0) {
    for (const email of business.notification_emails) {
      if (email && !recipients.includes(email)) {
        recipients.push(email);
      }
    }
  }

  const subject = buildSubject(callerName, serviceNeeded, isEmergency || urgency === 'emergency');
  const html = buildEmailHTML(payload, callId, recordingUrl);

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: recipients,
      subject,
      html,
    });

    if (error) {
      console.error(`[Email] Resend error for call ${payload.callSid}:`, error);
      return { success: false, error: error.message };
    }

    console.log(`[Email] Sent for call ${payload.callSid} — ID: ${data?.id}`);
    return { success: true, emailId: data?.id };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[Email] Unexpected error for call ${payload.callSid}:`, errorMsg);
    return { success: false, error: errorMsg };
  }
}

function buildSubject(
  callerName: string | null,
  serviceNeeded: string | null,
  isEmergency: boolean
): string {
  const name = callerName ?? 'New caller';
  const service = serviceNeeded ? serviceNeeded.slice(0, 60) : 'Service request';
  const prefix = isEmergency ? '[EMERGENCY] ' : '';
  return `${prefix}[NeverMiss] New lead: ${name} — ${service}`;
}

function buildEmailHTML(
  payload: NotificationPayload,
  callId?: string,
  recordingUrl?: string
): string {
  const { business, callerName, callerPhone, serviceNeeded, urgency, preferredCallback, isEmergency, transcriptText } = payload;

  const name = callerName ?? 'Unknown caller';
  const phone = callerPhone ?? 'Unknown number';
  const service = serviceNeeded ?? 'Service request';
  const callback = isEmergency ? 'ASAP' : (preferredCallback ?? 'As soon as possible');

  const urgencyColor = urgency === 'emergency' ? '#dc2626' : urgency === 'urgent' ? '#d97706' : '#16a34a';
  const urgencyLabel = urgency === 'emergency' ? '🔴 EMERGENCY' : urgency === 'urgent' ? '🟡 Urgent' : '🟢 Routine';

  const dashboardLink = callId ? `${DASHBOARD_URL}/dashboard?call=${callId}` : `${DASHBOARD_URL}/dashboard`;

  const callbackUrl = `tel:${phone}`;

  const transcriptFormatted = transcriptText
    ? transcriptText
        .split('\n')
        .map((line) => `<p style="margin: 4px 0; font-family: monospace; font-size: 13px;">${escapeHTML(line)}</p>`)
        .join('')
    : '<p style="color: #6b7280; font-style: italic;">No transcript available</p>';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Lead — ${escapeHTML(business.name)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 24px 16px;">

    <!-- Header -->
    <div style="background-color: #111827; color: white; padding: 20px 24px; border-radius: 12px 12px 0 0;">
      <p style="margin: 0; font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px;">NeverMiss AI</p>
      <h1 style="margin: 4px 0 0; font-size: 20px; font-weight: 700;">
        ${isEmergency ? '🚨 Emergency Lead' : '🔔 New Lead'}
      </h1>
      <p style="margin: 4px 0 0; font-size: 14px; color: #d1d5db;">${escapeHTML(business.name)}</p>
    </div>

    <!-- Lead Card -->
    <div style="background: white; padding: 24px; border: 1px solid #e5e7eb; border-top: 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 13px; width: 120px;">Caller</td>
          <td style="padding: 8px 0; font-weight: 600; font-size: 15px;">👤 ${escapeHTML(name)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 13px;">Phone</td>
          <td style="padding: 8px 0;">
            <a href="${callbackUrl}" style="color: #2563eb; font-weight: 600; font-size: 15px; text-decoration: none;">📞 ${escapeHTML(phone)}</a>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 13px;">Service</td>
          <td style="padding: 8px 0; font-size: 15px;">🔧 ${escapeHTML(service)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 13px;">Callback</td>
          <td style="padding: 8px 0; font-size: 15px;">⏰ ${escapeHTML(callback)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 13px;">Urgency</td>
          <td style="padding: 8px 0;">
            <span style="background-color: ${urgencyColor}22; color: ${urgencyColor}; padding: 2px 10px; border-radius: 12px; font-size: 13px; font-weight: 600;">${urgencyLabel}</span>
          </td>
        </tr>
      </table>
    </div>

    <!-- CTA Buttons -->
    <div style="background: white; padding: 16px 24px; border: 1px solid #e5e7eb; border-top: 0; display: flex; gap: 12px;">
      <a href="${callbackUrl}" style="display: inline-block; background-color: #16a34a; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin-right: 12px;">
        📞 Call Back Now
      </a>
      <a href="${dashboardLink}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
        View in Dashboard
      </a>
    </div>

    ${recordingUrl ? `
    <!-- Recording -->
    <div style="background: white; padding: 16px 24px; border: 1px solid #e5e7eb; border-top: 0;">
      <p style="margin: 0 0 8px; font-weight: 600; font-size: 13px; color: #374151;">🎙 Call Recording</p>
      <a href="${recordingUrl}" style="color: #2563eb; font-size: 13px;">Listen to recording →</a>
    </div>
    ` : ''}

    <!-- Transcript -->
    <div style="background: white; padding: 20px 24px; border: 1px solid #e5e7eb; border-top: 0; border-radius: 0 0 12px 12px;">
      <p style="margin: 0 0 12px; font-weight: 600; font-size: 13px; color: #374151;">📝 Call Transcript</p>
      <div style="background: #f9fafb; border-radius: 8px; padding: 16px;">
        ${transcriptFormatted}
      </div>
    </div>

    <!-- Footer -->
    <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 16px;">
      NeverMiss AI — 24/7 AI phone answering for home service contractors<br>
      <a href="${DASHBOARD_URL}/dashboard/settings" style="color: #6b7280;">Manage notification settings</a>
    </p>

  </div>
</body>
</html>`;
}

function escapeHTML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
