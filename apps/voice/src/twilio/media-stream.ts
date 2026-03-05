/**
 * Twilio Media Stream WebSocket Handler — WS /media-stream
 *
 * This is the core of NeverMiss AI. Each incoming call gets a WebSocket
 * connection here that streams bidirectional audio between Twilio and our AI.
 *
 * Twilio Media Stream message flow:
 *   1. 'connected' — WebSocket connected (before call starts)
 *   2. 'start' — Call started, contains callSid, customParameters
 *   3. 'media' — Audio chunk from caller (base64 mulaw 8kHz)
 *   4. 'stop' — Call ended
 *
 * We send back:
 *   - 'media' events with base64 mulaw audio (Deepgram TTS output)
 *   - 'clear' events to interrupt playback when caller speaks
 *
 * Per-call pipeline:
 *   Twilio audio → Deepgram STT → ConversationEngine → Deepgram TTS → Twilio audio
 *
 * Post-call pipeline (async, after call ends):
 *   Transcript → Claude Haiku extraction → Supabase → SMS notification → Email notification
 */

import WebSocket, { WebSocketServer } from 'ws';
import type { IncomingMessage } from 'http';
import { getBusinessByPhone, getTradePrompt, createCallRecord, updateCallRecord } from '../db/supabase.js';
import { DeepgramSTT } from '../ai/deepgram-stt.js';
import { textToTwilioAudio } from '../ai/deepgram-tts.js';
import { createConversationEngine, ConversationEngine } from '../ai/conversation-engine.js';
import { extractLeadFromTranscript } from '../ai/extraction.js';
import { sendLeadNotificationSMS } from '../notifications/sms.js';
import { sendLeadNotificationEmail } from '../notifications/email.js';
import { getFallbackTradePrompt } from '../prompts/trade-prompts.js';
import { endTwilioCall } from './sms.js';
import type {
  TwilioStreamMessage,
  TwilioMediaOutbound,
  TwilioClearEvent,
  CallSession,
  Business,
  TradePrompt,
  NotificationPayload,
} from '../types.js';

/**
 * Attach the media stream WebSocket handler to a WebSocketServer.
 * Called from index.ts after the HTTP server is created.
 */
export function attachMediaStreamHandler(wss: WebSocketServer): void {
  wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    const remoteIp = req.socket.remoteAddress ?? 'unknown';
    console.log(`[MediaStream] New WebSocket connection from ${remoteIp}`);

    // Create a per-connection handler
    const handler = new MediaStreamHandler(ws);
    handler.attach();
  });
}

/**
 * Handles all WebSocket communication for a single call.
 * Manages the full lifecycle: connect → stream → AI → notifications → cleanup.
 */
class MediaStreamHandler {
  private ws: WebSocket;
  private callSid: string | null = null;
  private streamSid: string | null = null;
  private businessId: string | null = null;
  private callerPhone: string | null = null;

  // AI components (initialized once we have businessId from the 'start' event)
  private stt: DeepgramSTT | null = null;
  private engine: ConversationEngine | null = null;

  // Track if we're currently sending audio (to avoid sending interleaved)
  private isSpeaking = false;
  // Queue of audio chunks waiting to be sent
  private audioQueue: string[][] = [];
  private isSendingAudio = false;

  // Flags
  private callEnded = false;

  constructor(ws: WebSocket) {
    this.ws = ws;
  }

  attach(): void {
    this.ws.on('message', (data: WebSocket.RawData) => {
      this.handleMessage(data);
    });

    this.ws.on('close', () => {
      console.log(`[MediaStream][${this.callSid ?? 'unknown'}] WebSocket closed`);
      this.cleanup();
    });

    this.ws.on('error', (err: Error) => {
      console.error(`[MediaStream][${this.callSid ?? 'unknown'}] WebSocket error:`, err.message);
      this.cleanup();
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // Twilio message routing
  // ─────────────────────────────────────────────────────────────────

  private handleMessage(data: WebSocket.RawData): void {
    let message: TwilioStreamMessage;

    try {
      message = JSON.parse(data.toString()) as TwilioStreamMessage;
    } catch {
      console.error(`[MediaStream] Failed to parse WebSocket message`);
      return;
    }

    switch (message.event) {
      case 'connected':
        console.log(`[MediaStream] Protocol connected`);
        break;

      case 'start':
        this.handleStart(message);
        break;

      case 'media':
        this.handleMedia(message);
        break;

      case 'stop':
        this.handleStop();
        break;

      case 'mark':
        // Mark events tell us when a specific audio chunk finished playing
        console.log(`[MediaStream][${this.callSid}] Mark: ${message.mark?.name}`);
        break;

      default:
        console.log(`[MediaStream] Unknown event: ${(message as { event: string }).event}`);
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // 'start' event — call begins, set up AI pipeline
  // ─────────────────────────────────────────────────────────────────

  private async handleStart(message: TwilioStreamMessage): Promise<void> {
    if (!message.start) return;

    this.streamSid = message.start.streamSid;
    this.callSid = message.start.callSid;
    this.businessId = message.start.customParameters?.businessId ?? null;
    this.callerPhone = message.start.customParameters?.callerPhone ?? null;

    console.log(`[MediaStream][${this.callSid}] Stream started — Business: ${this.businessId}, Caller: ${this.callerPhone}`);

    if (!this.businessId) {
      console.error(`[MediaStream][${this.callSid}] No businessId in stream parameters`);
      this.ws.close();
      return;
    }

    // Initialize AI pipeline asynchronously — don't block the 'start' handler
    this.initializePipeline().catch((err) => {
      console.error(`[MediaStream][${this.callSid}] Failed to initialize pipeline:`, err);
      this.ws.close();
    });
  }

  private async initializePipeline(): Promise<void> {
    const callSid = this.callSid!;
    const businessId = this.businessId!;

    // 1. Load business + trade prompt from DB
    // We search by businessId from the stream params (already resolved in webhook)
    const { business, tradePrompt } = await this.loadBusinessContext(businessId);

    if (!business || !tradePrompt) {
      console.error(`[MediaStream][${callSid}] Failed to load business context for ID: ${businessId}`);
      this.ws.close();
      return;
    }

    // 2. Create call record in DB
    const callDbId = await createCallRecord({
      businessId,
      callSid,
      callerPhone: this.callerPhone,
    });

    console.log(`[MediaStream][${callSid}] Call record created: ${callDbId}`);

    // 3. Set up Deepgram STT
    this.stt = new DeepgramSTT(callSid);
    await this.stt.connect();

    // 4. Set up conversation engine
    this.engine = createConversationEngine(callSid, business, tradePrompt, this.callerPhone);
    if (this.streamSid) this.engine.setStreamSid(this.streamSid);

    // 5. Wire up engine events
    this.engine.on('speak', (text: string) => {
      void this.speakToCallerQueued(text);
    });

    this.engine.on('end', (session: CallSession) => {
      void this.handleCallEnd(session, callDbId);
    });

    this.engine.on('emergency', (session: CallSession) => {
      console.log(`[MediaStream][${callSid}] 🚨 Emergency detected — urgency escalated`);
      void session; // Emergency is handled inside the engine, notify here for logging
    });

    // 6. Wire up STT events
    this.stt.on('transcript', (text: string, isFinal: boolean) => {
      if (this.isSpeaking && !isFinal) return; // Ignore interim while AI is speaking
      console.log(`[STT][${callSid}] ${isFinal ? 'FINAL' : 'interim'}: "${text}"`);
      this.engine?.processTranscript(text, isFinal);
    });

    this.stt.on('error', (err: Error) => {
      console.error(`[STT][${callSid}] STT error:`, err.message);
      // Don't crash the call on STT errors — just log
    });

    // 7. Start the conversation! Send the greeting.
    await this.engine.start();
  }

  /**
   * Load business and trade prompt from Supabase.
   * Includes fallback to in-code prompts if DB is unavailable.
   */
  private async loadBusinessContext(businessId: string): Promise<{
    business: Business | null;
    tradePrompt: TradePrompt | null;
  }> {
    // We need to look up the business by ID, but our DB helper looks up by phone.
    // The business was already validated in the webhook — we just need to re-fetch by ID.
    // Direct Supabase query for business by ID:
    const { supabase } = await import('../db/supabase.js');

    const { data: business, error: bizError } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', businessId)
      .single();

    if (bizError || !business) {
      console.error(`[MediaStream] Failed to load business ${businessId}:`, bizError);
      return { business: null, tradePrompt: null };
    }

    // Load trade prompt from DB, fallback to in-code if not found
    let tradePrompt = await getTradePrompt(business.trade);

    if (!tradePrompt) {
      console.warn(`[MediaStream] Trade prompt for "${business.trade}" not in DB, using fallback`);
      const fallback = getFallbackTradePrompt(business.trade as TradePrompt['trade']);
      tradePrompt = { ...fallback, id: 'fallback' };
    }

    return { business: business as Business, tradePrompt };
  }

  // ─────────────────────────────────────────────────────────────────
  // 'media' event — audio chunk from caller
  // ─────────────────────────────────────────────────────────────────

  private handleMedia(message: TwilioStreamMessage): void {
    if (!message.media?.payload) return;

    // Forward audio to Deepgram STT
    this.stt?.sendAudio(message.media.payload);
  }

  // ─────────────────────────────────────────────────────────────────
  // 'stop' event — call ended (caller hung up or Twilio closed)
  // ─────────────────────────────────────────────────────────────────

  private handleStop(): void {
    console.log(`[MediaStream][${this.callSid}] Stream stopped`);

    // If engine hasn't signaled end yet, trigger post-call processing now
    if (this.engine && !this.callEnded) {
      const session = this.engine.getSession();
      void this.handleCallEnd(session, null);
    }

    this.cleanup();
  }

  // ─────────────────────────────────────────────────────────────────
  // Audio output — send TTS audio to caller
  // ─────────────────────────────────────────────────────────────────

  /**
   * Convert text to TTS audio and queue it for delivery to Twilio.
   * Queuing ensures we don't send interleaved audio chunks from concurrent speaks.
   */
  private async speakToCallerQueued(text: string): Promise<void> {
    try {
      console.log(`[TTS][${this.callSid}] Generating: "${text.slice(0, 80)}..."`);
      const chunks = await textToTwilioAudio(text);
      this.audioQueue.push(chunks);
      void this.flushAudioQueue();
    } catch (err) {
      console.error(`[TTS][${this.callSid}] TTS error:`, err);
    }
  }

  /**
   * Process the audio queue, sending one batch of chunks at a time.
   * This prevents out-of-order audio delivery.
   */
  private async flushAudioQueue(): Promise<void> {
    if (this.isSendingAudio) return; // Already flushing
    this.isSendingAudio = true;

    try {
      while (this.audioQueue.length > 0) {
        const chunks = this.audioQueue.shift()!;
        this.isSpeaking = true;
        await this.sendAudioChunks(chunks);
        this.isSpeaking = false;
      }
    } finally {
      this.isSendingAudio = false;
    }
  }

  /**
   * Send audio chunks to Twilio via the WebSocket.
   * Sends all chunks in sequence with a small delay between them
   * to avoid overwhelming Twilio's buffer.
   */
  private async sendAudioChunks(chunks: string[]): Promise<void> {
    if (!this.streamSid || this.ws.readyState !== WebSocket.OPEN) return;

    const streamSid = this.streamSid;

    for (const payload of chunks) {
      if (this.ws.readyState !== WebSocket.OPEN) break;

      const mediaEvent: TwilioMediaOutbound = {
        event: 'media',
        streamSid,
        media: { payload },
      };

      this.ws.send(JSON.stringify(mediaEvent));

      // Small throttle to avoid flooding Twilio (20ms chunks at 8kHz = 160 bytes per 20ms)
      // This delay matches the audio duration of each chunk
      await sleep(20);
    }
  }

  /**
   * Clear Twilio's audio playback buffer.
   * Call this when the caller starts speaking to interrupt any ongoing AI speech.
   */
  private clearAudio(): void {
    if (!this.streamSid || this.ws.readyState !== WebSocket.OPEN) return;

    const clearEvent: TwilioClearEvent = {
      event: 'clear',
      streamSid: this.streamSid,
    };

    this.ws.send(JSON.stringify(clearEvent));
    this.audioQueue.length = 0; // Clear pending audio queue
  }

  // ─────────────────────────────────────────────────────────────────
  // Post-call pipeline
  // ─────────────────────────────────────────────────────────────────

  /**
   * Run the post-call pipeline after a conversation ends:
   *   1. Build full transcript text
   *   2. Extract structured lead data with Claude Haiku
   *   3. Update call record in Supabase
   *   4. Send SMS notification
   *   5. Send email notification
   *   6. End the Twilio call
   */
  private async handleCallEnd(session: CallSession, callDbId: string | null): Promise<void> {
    if (this.callEnded) return;
    this.callEnded = true;

    const callSid = this.callSid ?? session.callSid;
    const durationMs = Date.now() - session.startTime;
    const durationSeconds = Math.round(durationMs / 1000);

    console.log(`[PostCall][${callSid}] Call ended — duration: ${durationSeconds}s, state: ${session.state}`);
    console.log(`[PostCall][${callSid}] Lead: name="${session.callerName}", service="${session.serviceNeeded}", urgency="${session.urgency}"`);

    // Build readable transcript
    const transcriptText = buildTranscriptText(session);

    // Use session-captured data as primary source (fast, already in memory)
    let callerName = session.callerName;
    let serviceNeeded = session.serviceNeeded;
    let urgency = session.urgency;
    let preferredCallback = session.preferredCallback;
    let isSpam = false;

    // Run Claude Haiku extraction for better structured data
    // This runs async and enriches what we already have
    const callStartMs = Date.now();
    try {
      const extraction = await extractLeadFromTranscript(
        transcriptText,
        session.callerPhone,
        session.business.trade
      );

      isSpam = extraction.is_spam;

      // Prefer extracted data over session-captured (Haiku is more reliable for edge cases)
      if (extraction.caller_name) callerName = extraction.caller_name;
      if (extraction.service_needed) serviceNeeded = extraction.service_needed;
      if (extraction.urgency !== 'unknown') urgency = extraction.urgency;
      if (extraction.preferred_callback) preferredCallback = extraction.preferred_callback;

      // If Haiku says emergency, ensure it's reflected
      if (session.isEmergency) urgency = 'emergency';

      // Update call record with extraction results
      if (callDbId) {
        await updateCallRecord(callSid, {
          callerName,
          serviceNeeded,
          urgency,
          preferredCallback,
          fullTranscript: transcriptText,
          extractionJson: extraction,
          durationSeconds,
        });
      }
    } catch (err) {
      console.error(`[PostCall][${callSid}] Extraction error:`, err);
      // Still proceed with notifications using session data
    }

    // Skip notifications for spam
    if (isSpam) {
      console.log(`[PostCall][${callSid}] Spam call — skipping notifications`);
      void endTwilioCall(callSid);
      return;
    }

    // Build notification payload
    const notificationPayload: NotificationPayload = {
      business: session.business,
      callSid,
      callerName,
      callerPhone: session.callerPhone,
      serviceNeeded,
      urgency,
      preferredCallback,
      isEmergency: urgency === 'emergency' || session.isEmergency,
      transcriptText,
      callId: callDbId ?? undefined,
    };

    // Send SMS notification
    const notificationStartMs = Date.now();
    const smsResult = await sendLeadNotificationSMS(notificationPayload);
    const notificationLatencyMs = Date.now() - notificationStartMs;

    if (smsResult.success && smsResult.sentAt) {
      console.log(`[PostCall][${callSid}] SMS sent in ${notificationLatencyMs}ms to ${smsResult.recipients.join(', ')}`);

      if (callDbId) {
        await updateCallRecord(callSid, {
          smssentAt: smsResult.sentAt.toISOString(),
          notificationLatencyMs: Date.now() - callStartMs,
        });
      }
    } else {
      console.error(`[PostCall][${callSid}] SMS failed:`, smsResult.errors);
    }

    // Send email notification (async, don't block)
    sendLeadNotificationEmail(notificationPayload)
      .then((emailResult) => {
        if (emailResult.success) {
          console.log(`[PostCall][${callSid}] Email sent — ID: ${emailResult.emailId}`);
          if (callDbId) {
            void updateCallRecord(callSid, { emailSentAt: new Date().toISOString() });
          }
        } else {
          console.error(`[PostCall][${callSid}] Email failed:`, emailResult.error);
        }
      })
      .catch((err) => {
        console.error(`[PostCall][${callSid}] Email error:`, err);
      });

    // End the Twilio call after a brief pause for the goodbye audio to finish
    setTimeout(() => {
      void endTwilioCall(callSid);
    }, 3000);
  }

  // ─────────────────────────────────────────────────────────────────
  // Cleanup
  // ─────────────────────────────────────────────────────────────────

  private cleanup(): void {
    this.stt?.destroy();
    this.engine?.destroy();
    this.audioQueue.length = 0;
    this.isSpeaking = false;
    this.isSendingAudio = false;

    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.close();
    }
  }
}

// ─────────────────────────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────────────────────────

/**
 * Format the call session transcript into readable plain text.
 * Format: "AI: ...\nCaller: ...\n"
 */
function buildTranscriptText(session: CallSession): string {
  return session.transcript
    .map((entry) => {
      const speaker = entry.speaker === 'ai' ? 'AI' : 'Caller';
      return `${speaker}: ${entry.text}`;
    })
    .join('\n');
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
