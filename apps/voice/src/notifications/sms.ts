/**
 * SMS notification formatting and delivery for NeverMiss AI.
 *
 * Format (standard lead):
 * ─────────────────────
 * 🔔 New Lead — {business_name}
 *
 * 👤 {caller_name}
 * 📞 {caller_phone}
 * 🔧 {service_needed}
 * ⏰ Callback: {preferred_callback}
 *
 * Tap to call back:
 * tel:{caller_phone}
 *
 * Format (emergency):
 * ─────────────────────
 * 🚨 EMERGENCY — {business_name}
 *
 * 👤 {caller_name}
 * 📞 {caller_phone}
 * 🔧 {service_needed} [URGENT]
 * ⏰ Callback: ASAP
 *
 * Tap to call back:
 * tel:{caller_phone}
 */

import { sendSMS, sendSMSToMultiple } from '../twilio/sms.js';
import type { NotificationPayload } from '../types.js';

export interface SMSNotificationResult {
  success: boolean;
  sentAt: Date | null;
  recipients: string[];
  errors: string[];
}

/**
 * Format an SMS notification message for a captured lead.
 */
export function formatLeadSMS(payload: NotificationPayload): string {
  const {
    business,
    callerName,
    callerPhone,
    serviceNeeded,
    urgency,
    preferredCallback,
    isEmergency,
  } = payload;

  const name = callerName ?? 'Unknown caller';
  const phone = callerPhone ?? 'Unknown number';
  const service = serviceNeeded ?? 'Service request';
  const callback = isEmergency ? 'ASAP' : (preferredCallback ?? 'As soon as possible');

  if (isEmergency || urgency === 'emergency') {
    return [
      `🚨 EMERGENCY — ${business.name}`,
      '',
      `👤 ${name}`,
      `📞 ${phone}`,
      `🔧 ${service} [URGENT]`,
      `⏰ Callback: ASAP`,
      '',
      `Tap to call back:`,
      `tel:${phone}`,
    ].join('\n');
  }

  return [
    `🔔 New Lead — ${business.name}`,
    '',
    `👤 ${name}`,
    `📞 ${phone}`,
    `🔧 ${service}`,
    `⏰ Callback: ${callback}`,
    '',
    `Tap to call back:`,
    `tel:${phone}`,
  ].join('\n');
}

/**
 * Send lead notification SMS to the business owner and any additional
 * notification recipients configured in their settings.
 */
export async function sendLeadNotificationSMS(
  payload: NotificationPayload
): Promise<SMSNotificationResult> {
  const { business } = payload;

  // Build recipient list: owner + any additional notification phones
  const recipients = [business.owner_phone];

  if (business.notification_phones && business.notification_phones.length > 0) {
    for (const phone of business.notification_phones) {
      if (phone && !recipients.includes(phone)) {
        recipients.push(phone);
      }
    }
  }

  const message = formatLeadSMS(payload);
  const sentAt = new Date();

  try {
    const results = await sendSMSToMultiple(recipients, message);

    const errors: string[] = [];
    let allFailed = true;

    for (const result of results) {
      if (result.success) {
        allFailed = false;
      } else if (result.error) {
        errors.push(result.error);
      }
    }

    if (allFailed && recipients.length > 0) {
      console.error(`[SMS Notification] All sends failed for call ${payload.callSid}`);
    }

    return {
      success: !allFailed,
      sentAt: allFailed ? null : sentAt,
      recipients,
      errors,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[SMS Notification] Unexpected error for call ${payload.callSid}:`, errorMsg);

    return {
      success: false,
      sentAt: null,
      recipients,
      errors: [errorMsg],
    };
  }
}
