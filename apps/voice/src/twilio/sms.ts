/**
 * Twilio SMS sender for NeverMiss AI.
 * Low-level SMS send via Twilio REST API.
 * See notifications/sms.ts for the formatted message builder.
 */

import twilio from 'twilio';

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
  throw new Error('Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN environment variables');
}

const twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

export interface SMSSendResult {
  success: boolean;
  messageSid?: string;
  error?: string;
}

/**
 * Send an SMS message via Twilio.
 *
 * @param to - Recipient phone number (E.164 format, e.g. +16195551234)
 * @param body - Message body text
 * @param from - Sender number (defaults to TWILIO_PHONE_NUMBER env var)
 */
export async function sendSMS(
  to: string,
  body: string,
  from?: string
): Promise<SMSSendResult> {
  const fromNumber = from ?? TWILIO_PHONE_NUMBER;

  if (!fromNumber) {
    return {
      success: false,
      error: 'No sender phone number configured (TWILIO_PHONE_NUMBER)',
    };
  }

  try {
    const message = await twilioClient.messages.create({
      to,
      from: fromNumber,
      body,
    });

    console.log(`[SMS] Sent to ${to} — SID: ${message.sid}`);

    return {
      success: true,
      messageSid: message.sid,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[SMS] Failed to send to ${to}:`, errorMsg);

    return {
      success: false,
      error: errorMsg,
    };
  }
}

/**
 * Send the same SMS to multiple recipients.
 * Fires all sends in parallel and returns results for each.
 */
export async function sendSMSToMultiple(
  recipients: string[],
  body: string,
  from?: string
): Promise<SMSSendResult[]> {
  if (recipients.length === 0) return [];

  const results = await Promise.allSettled(
    recipients.map((recipient) => sendSMS(recipient, body, from))
  );

  return results.map((result) => {
    if (result.status === 'fulfilled') return result.value;
    return {
      success: false,
      error: result.reason instanceof Error ? result.reason.message : String(result.reason),
    };
  });
}

/**
 * End a call via Twilio API.
 * Used to hang up after the goodbye message is spoken.
 */
export async function endTwilioCall(callSid: string): Promise<void> {
  try {
    await twilioClient.calls(callSid).update({ status: 'completed' });
    console.log(`[Twilio] Call ${callSid} ended`);
  } catch (err) {
    console.error(`[Twilio] Failed to end call ${callSid}:`, err);
  }
}
