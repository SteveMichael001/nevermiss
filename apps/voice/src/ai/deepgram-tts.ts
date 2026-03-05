/**
 * Deepgram Aura Text-to-Speech for sending audio back to callers via Twilio.
 *
 * Output format matches Twilio Media Streams inbound format:
 *   - Encoding: PCMU (mulaw)
 *   - Sample rate: 8000 Hz
 *   - Container: none (raw audio bytes, no WAV/OGG wrapper)
 *
 * Deepgram Aura models:
 *   - aura-asteria-en: Female, conversational (default)
 *   - aura-luna-en: Female, friendly
 *   - aura-stella-en: Female, professional
 *   - aura-orion-en: Male, professional
 *   - aura-arcas-en: Male, conversational
 */

import { createClient } from '@deepgram/sdk';

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;
if (!DEEPGRAM_API_KEY) {
  throw new Error('Missing DEEPGRAM_API_KEY environment variable');
}

const deepgramClient = createClient(DEEPGRAM_API_KEY);

// Default TTS model — Asteria is warm and conversational, good for home services
const TTS_MODEL = process.env.DEEPGRAM_TTS_MODEL ?? 'aura-asteria-en';

/**
 * Convert text to speech using Deepgram Aura.
 * Returns a Buffer of raw mulaw audio at 8kHz, ready to send to Twilio.
 *
 * @param text - The text for the AI to speak
 * @returns Buffer of raw mulaw audio bytes
 */
export async function textToSpeech(text: string): Promise<Buffer> {
  if (!text || text.trim() === '') {
    return Buffer.alloc(0);
  }

  // Deepgram has a max character limit per request; chunk if needed
  const cleanText = text.trim().slice(0, 2000);

  try {
    const response = await deepgramClient.speak.request(
      { text: cleanText },
      {
        model: TTS_MODEL,
        encoding: 'mulaw',
        sample_rate: 8000,
        container: 'none', // Raw audio bytes, no container headers
      }
    );

    const stream = await response.getStream();

    if (!stream) {
      throw new Error('Deepgram TTS returned no stream');
    }

    // Convert ReadableStream to Buffer
    return streamToBuffer(stream);
  } catch (err) {
    console.error('[TTS] Deepgram TTS error:', err);
    throw err;
  }
}

/**
 * Convert a ReadableStream (Web Streams API) to a Node.js Buffer.
 * Deepgram SDK returns Web Streams API streams.
 */
async function streamToBuffer(stream: ReadableStream<Uint8Array>): Promise<Buffer> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
    }
  }

  // Concatenate all chunks into a single Buffer
  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = Buffer.allocUnsafe(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

/**
 * Split a Buffer into chunks suitable for streaming to Twilio.
 * Twilio recommends sending 20ms chunks.
 * At 8kHz mulaw, 20ms = 160 bytes.
 *
 * @param audioBuffer - Full audio buffer
 * @param chunkSizeBytes - Bytes per chunk (default 160 = 20ms at 8kHz mulaw)
 * @returns Array of base64-encoded audio chunks
 */
export function bufferToTwilioChunks(
  audioBuffer: Buffer,
  chunkSizeBytes = 160
): string[] {
  const chunks: string[] = [];

  for (let offset = 0; offset < audioBuffer.length; offset += chunkSizeBytes) {
    const chunk = audioBuffer.subarray(offset, offset + chunkSizeBytes);
    chunks.push(chunk.toString('base64'));
  }

  return chunks;
}

/**
 * Convert text to speech and immediately return as base64 chunks
 * ready to send to Twilio Media Streams.
 */
export async function textToTwilioAudio(text: string): Promise<string[]> {
  const audioBuffer = await textToSpeech(text);
  return bufferToTwilioChunks(audioBuffer);
}
