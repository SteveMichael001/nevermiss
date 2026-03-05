/**
 * NeverMiss AI — Voice Server Entry Point
 *
 * Express + WebSocket server running on Railway.
 * Handles all Twilio voice integration:
 *   - POST /webhook/twilio/voice    — incoming call handler (TwiML response)
 *   - POST /webhook/twilio/status   — call status callback
 *   - POST /webhook/twilio/recording — recording ready callback
 *   - WS   /media-stream            — bidirectional audio stream
 *
 * Architecture:
 *   Twilio call → webhook (TwiML) → WebSocket media stream
 *              → Deepgram STT → ConversationEngine → Deepgram TTS
 *              → post-call: Claude Haiku extraction + SMS/email notifications
 */

import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import { URL } from 'url';
import twilio from 'twilio';
import webhookRouter from './twilio/webhook.js';
import { attachMediaStreamHandler } from './twilio/media-stream.js';
import { supabase } from './db/supabase.js';

// ─────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT ?? '3001', 10);
const NODE_ENV = process.env.NODE_ENV ?? 'development';

// Twilio client — shared across routes (same pattern as twilio/sms.ts)
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const VOICE_SERVER_URL = process.env.VOICE_SERVER_URL ?? '';

if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
  throw new Error('Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN environment variables');
}

const twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

// ─────────────────────────────────────────────────────────────────
// Express app
// ─────────────────────────────────────────────────────────────────

const app = express();

// Parse URL-encoded bodies (Twilio sends POST bodies as application/x-www-form-urlencoded)
app.use(express.urlencoded({ extended: false }));
// Also parse JSON for any internal requests
app.use(express.json());

// Trust proxy headers (Railway runs behind a load balancer)
app.set('trust proxy', 1);

// Request logging
app.use((req, _res, next) => {
  const start = Date.now();
  _res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[HTTP] ${req.method} ${req.path} ${_res.statusCode} ${duration}ms`);
  });
  next();
});

// ─────────────────────────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────────────────────────

// Health check — Railway uses this to verify the server is running
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'nevermiss-voice-server',
    env: NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// Twilio webhooks
app.use('/webhook/twilio', webhookRouter);

// Provision a Twilio phone number to a business — called by the web dashboard during onboarding
app.post('/provision', async (req: express.Request, res: express.Response) => {
  const { businessId, areaCode } = req.body as { businessId?: string; areaCode?: string };

  if (!businessId || !areaCode) {
    res.status(400).json({ error: 'Missing required fields: businessId, areaCode' });
    return;
  }

  // 1. Search for an available local number in the given area code
  let available: { phoneNumber: string }[];
  try {
    available = await twilioClient.availablePhoneNumbers('US').local.list({ areaCode: parseInt(areaCode, 10), limit: 1 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[Provision] Twilio search failed for area code ${areaCode}:`, msg);
    res.status(500).json({ error: `Twilio number search failed: ${msg}` });
    return;
  }

  if (!available || available.length === 0) {
    console.warn(`[Provision] No numbers available in area code ${areaCode}`);
    res.status(404).json({ error: `No phone numbers available in area code ${areaCode}` });
    return;
  }

  // 2. Purchase the first available number and configure the voice webhook
  let purchasedNumber: string;
  try {
    const purchased = await twilioClient.incomingPhoneNumbers.create({
      phoneNumber: available[0].phoneNumber,
      voiceUrl: `${VOICE_SERVER_URL}/twilio/voice`,
      voiceMethod: 'POST',
    });
    purchasedNumber = purchased.phoneNumber;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[Provision] Twilio purchase failed for ${available[0].phoneNumber}:`, msg);
    res.status(500).json({ error: `Twilio number purchase failed: ${msg}` });
    return;
  }

  // 3. Store the purchased number in Supabase
  const { error: dbError } = await supabase
    .from('businesses')
    .update({ twilio_phone_number: purchasedNumber })
    .eq('id', businessId);

  if (dbError) {
    console.error('[Provision] Failed to save phone number to DB:', dbError);
    res.status(500).json({ error: 'Number purchased from Twilio but failed to save to database' });
    return;
  }

  console.log(`[Provision] Purchased ${purchasedNumber} (area code ${areaCode}) for business ${businessId}`);
  res.json({ success: true, phoneNumber: purchasedNumber });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Global error handler — voice calls can't crash silently
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Express] Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ─────────────────────────────────────────────────────────────────
// HTTP server + WebSocket server
// ─────────────────────────────────────────────────────────────────

const server = http.createServer(app);

/**
 * WebSocket server for Twilio Media Streams.
 *
 * We use a path-based routing approach:
 *   - /media-stream → Twilio bidirectional audio stream
 *
 * The WebSocketServer is attached to the HTTP server so it shares port 3001.
 * Twilio connects to wss://your-server.railway.app/media-stream
 */
const wss = new WebSocketServer({
  server,
  // Only accept connections on /media-stream path
  verifyClient: (info: { req: http.IncomingMessage }) => {
    try {
      const url = new URL(info.req.url ?? '/', `http://localhost:${PORT}`);
      if (url.pathname !== '/media-stream') {
        console.warn(`[WSS] Rejected connection to unknown path: ${url.pathname}`);
        return false;
      }
      return true;
    } catch {
      return false;
    }
  },
});

// Attach the Twilio media stream handler
attachMediaStreamHandler(wss);

console.log('[WSS] WebSocket server attached to /media-stream');

// ─────────────────────────────────────────────────────────────────
// Start server
// ─────────────────────────────────────────────────────────────────

server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║          NeverMiss AI — Voice Server                   ║
╠═══════════════════════════════════════════════════════╣
║  Port:     ${String(PORT).padEnd(44)}║
║  Env:      ${NODE_ENV.padEnd(44)}║
║  Routes:                                              ║
║    GET  /health                                       ║
║    POST /webhook/twilio/voice                         ║
║    POST /webhook/twilio/status                        ║
║    POST /webhook/twilio/recording                     ║
║    WS   /media-stream                                 ║
╚═══════════════════════════════════════════════════════╝
  `);
});

// ─────────────────────────────────────────────────────────────────
// Graceful shutdown
// ─────────────────────────────────────────────────────────────────

/**
 * Handle graceful shutdown signals (SIGTERM from Railway/Docker, SIGINT from Ctrl+C).
 * We give active calls up to 5 seconds to finish before forcing a shutdown.
 */
function shutdown(signal: string): void {
  console.log(`\n[Server] Received ${signal} — starting graceful shutdown...`);

  // Stop accepting new WebSocket connections
  wss.close(() => {
    console.log('[Server] WebSocket server closed');
  });

  // Stop accepting new HTTP requests
  server.close(() => {
    console.log('[Server] HTTP server closed');
    process.exit(0);
  });

  // Force exit after 5 seconds if graceful shutdown hangs
  setTimeout(() => {
    console.error('[Server] Graceful shutdown timed out — forcing exit');
    process.exit(1);
  }, 5000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Catch unhandled promise rejections — log but don't crash
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Process] Unhandled rejection at:', promise, 'reason:', reason);
  // Don't exit — a call-level error shouldn't crash the entire server
});

process.on('uncaughtException', (err) => {
  console.error('[Process] Uncaught exception:', err);
  // Exit on uncaught exceptions — Railway will restart the process
  process.exit(1);
});

export { app, server, wss };
