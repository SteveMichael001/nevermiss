/**
 * Twilio Voice Webhook Handler — POST /webhook/twilio/voice
 *
 * Twilio calls this endpoint when an inbound call arrives on any
 * NeverMiss-provisioned phone number.
 *
 * Flow:
 *   1. Look up the business by the called number (To field)
 *   2. Check if the business is active (subscription not canceled/lapsed)
 *   3. Return TwiML that connects the call to our WebSocket media stream
 *   4. Pass businessId + callerPhone as stream parameters so the
 *      WebSocket handler knows which business to route to
 *
 * If the business is inactive or not found, we return a polite fallback message.
 */

import { Router, Request, Response } from 'express';
import twilio from 'twilio';
import { getBusinessByPhone } from '../db/supabase.js';

const router = Router();

const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const VOICE_SERVER_URL = process.env.VOICE_SERVER_URL ?? `http://localhost:${process.env.PORT ?? 3001}`;

/**
 * POST /webhook/twilio/voice
 * Twilio incoming call webhook.
 */
router.post('/voice', validateTwilioRequest, async (req: Request, res: Response) => {
  const twiml = new twilio.twiml.VoiceResponse();

  try {
    // Extract call details from Twilio POST body
    const calledNumber: string = req.body.To ?? req.body.Called ?? '';
    const callerPhone: string = req.body.From ?? req.body.Caller ?? '';
    const callSid: string = req.body.CallSid ?? '';

    console.log(`[Webhook] Incoming call — To: ${calledNumber}, From: ${callerPhone}, SID: ${callSid}`);

    if (!calledNumber) {
      console.error('[Webhook] Missing "To" number in Twilio request');
      twiml.say({ voice: 'Polly.Joanna' }, 'Thank you for calling. We\'re experiencing technical difficulties. Please try again later.');
      return res.type('text/xml').send(twiml.toString());
    }

    // Look up the business by the Twilio number that was called
    const business = await getBusinessByPhone(calledNumber);

    if (!business) {
      console.warn(`[Webhook] No active business found for number: ${calledNumber}`);
      twiml.say(
        { voice: 'Polly.Joanna' },
        'Thank you for calling. This number is not currently active. Please contact the business directly.'
      );
      return res.type('text/xml').send(twiml.toString());
    }

    if (!business.is_active) {
      console.warn(`[Webhook] Business ${business.id} is inactive`);
      twiml.say(
        { voice: 'Polly.Joanna' },
        `Thank you for calling ${business.name}. This service is currently unavailable. Please try calling the business directly.`
      );
      return res.type('text/xml').send(twiml.toString());
    }

    // Build WebSocket URL for the media stream
    // Convert HTTP(S) → WS(S) scheme
    const wsUrl = VOICE_SERVER_URL.replace(/^https?:\/\//, (match) =>
      match.startsWith('https') ? 'wss://' : 'ws://'
    ) + '/media-stream';

    console.log(`[Webhook] Connecting call ${callSid} to stream: ${wsUrl} (business: ${business.name})`);

    // Return TwiML to connect the call to our WebSocket media stream
    // The <Connect><Stream> verb keeps the call alive and streams bidirectional audio
    const connect = twiml.connect();
    const stream = connect.stream({ url: wsUrl });

    // Pass parameters to the WebSocket handler
    // These are included in the 'start' event from Twilio
    stream.parameter({ name: 'businessId', value: business.id });
    stream.parameter({ name: 'callerPhone', value: callerPhone });
    stream.parameter({ name: 'callSid', value: callSid });

    res.type('text/xml').send(twiml.toString());

  } catch (err) {
    console.error('[Webhook] Unexpected error handling incoming call:', err);
    twiml.say({ voice: 'Polly.Joanna' }, 'Thank you for calling. We\'re experiencing technical difficulties. Please try again shortly.');
    res.type('text/xml').send(twiml.toString());
  }
});

/**
 * POST /webhook/twilio/status
 * Twilio call status callback — called when a call ends, fails, etc.
 * Used for logging and cleanup.
 */
router.post('/status', validateTwilioRequest, (req: Request, res: Response) => {
  const callSid: string = req.body.CallSid ?? '';
  const callStatus: string = req.body.CallStatus ?? '';
  const duration: string = req.body.CallDuration ?? '0';

  console.log(`[Webhook] Call status update — SID: ${callSid}, Status: ${callStatus}, Duration: ${duration}s`);

  // Call duration is stored here if not already captured by the media stream handler
  // The media-stream handler does its own post-call processing, so this is just logging

  res.status(204).send();
});

/**
 * POST /webhook/twilio/recording
 * Twilio recording ready callback — called when a recording is available.
 * Note: We use Deepgram for real-time transcription, but Twilio can also
 * provide a recording URL via this callback.
 */
router.post('/recording', validateTwilioRequest, (req: Request, res: Response) => {
  const callSid: string = req.body.CallSid ?? '';
  const recordingUrl: string = req.body.RecordingUrl ?? '';
  const recordingSid: string = req.body.RecordingSid ?? '';
  const recordingDuration: string = req.body.RecordingDuration ?? '0';

  console.log(`[Webhook] Recording ready — Call: ${callSid}, URL: ${recordingUrl}, Duration: ${recordingDuration}s`);

  // TODO: Download recording and store in Supabase Storage
  // For now, just log it. The media stream handler stores transcripts.
  void recordingSid;

  res.status(204).send();
});

/**
 * Middleware to validate that requests are actually from Twilio.
 * Uses the Twilio webhook signature validation.
 *
 * In development (localhost), signature validation is skipped.
 */
function validateTwilioRequest(req: Request, res: Response, next: () => void): void {
  // Skip validation in development
  if (process.env.NODE_ENV !== 'production' && VOICE_SERVER_URL?.includes('localhost')) {
    return next();
  }

  if (!TWILIO_AUTH_TOKEN) {
    console.warn('[Webhook] TWILIO_AUTH_TOKEN not set — skipping signature validation');
    return next();
  }

  const twilioSignature = req.headers['x-twilio-signature'] as string;
  const requestUrl = `${VOICE_SERVER_URL}${req.originalUrl}`;

  const isValid = twilio.validateRequest(
    TWILIO_AUTH_TOKEN,
    twilioSignature,
    requestUrl,
    req.body as Record<string, string>
  );

  if (!isValid) {
    console.warn(`[Webhook] Invalid Twilio signature from ${req.ip}`);
    res.status(403).json({ error: 'Forbidden — invalid Twilio signature' });
    return;
  }

  next();
}

export default router;
