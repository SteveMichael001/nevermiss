/**
 * Deepgram Nova-3 streaming Speech-to-Text for Twilio Media Streams.
 *
 * Audio format from Twilio:
 *   - Encoding: PCMU (G.711 mulaw)
 *   - Sample rate: 8000 Hz
 *   - Channels: 1 (mono)
 *   - Delivery: base64-encoded chunks in WebSocket messages
 *
 * We use Deepgram's live streaming API to get real-time transcripts.
 * Interim results are enabled so we can detect emergency keywords early,
 * but only final results drive state transitions.
 */

import { createClient, LiveTranscriptionEvents } from '@deepgram/sdk';
import type { ListenLiveClient } from '@deepgram/sdk';
import { EventEmitter } from 'events';

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;
if (!DEEPGRAM_API_KEY) {
  throw new Error('Missing DEEPGRAM_API_KEY environment variable');
}

const deepgramClient = createClient(DEEPGRAM_API_KEY);

export interface STTEvents {
  on(event: 'transcript', listener: (text: string, isFinal: boolean) => void): this;
  on(event: 'error', listener: (err: Error) => void): this;
  on(event: 'close', listener: () => void): this;
}

/**
 * DeepgramSTT wraps a Deepgram live connection for a single call.
 * Create one instance per call, call destroy() when the call ends.
 */
export class DeepgramSTT extends EventEmitter implements STTEvents {
  private connection: ListenLiveClient | null = null;
  private callSid: string;
  private isConnected = false;
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 3;

  constructor(callSid: string) {
    super();
    this.callSid = callSid;
  }

  /**
   * Open the Deepgram streaming connection.
   * Must be called before sending audio.
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.connection = deepgramClient.listen.live({
          model: 'nova-3',
          encoding: 'mulaw',
          sample_rate: 8000,
          channels: 1,
          language: 'en-US',
          punctuate: true,
          interim_results: true,
          // Endpointing: wait 300ms of silence before marking utterance end
          endpointing: 300,
          // Consider the utterance complete after 1000ms of silence
          utterance_end_ms: 1000,
          // Reduce false positives on short utterances
          no_delay: false,
        });

        // Connection opened successfully
        this.connection.on(LiveTranscriptionEvents.Open, () => {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          console.log(`[STT][${this.callSid}] Deepgram connection opened`);
          resolve();
        });

        // Transcription received
        this.connection.on(LiveTranscriptionEvents.Transcript, (data) => {
          try {
            const alt = data?.channel?.alternatives?.[0];
            const text = alt?.transcript;

            if (!text || text.trim() === '') return;

            const isFinal = data.is_final === true;
            this.emit('transcript', text.trim(), isFinal);
          } catch (err) {
            console.error(`[STT][${this.callSid}] Error processing transcript:`, err);
          }
        });

        // Deepgram signaled end of utterance (all pending transcripts flushed)
        this.connection.on(LiveTranscriptionEvents.UtteranceEnd, () => {
          console.log(`[STT][${this.callSid}] Utterance end detected`);
        });

        // Connection closed
        this.connection.on(LiveTranscriptionEvents.Close, () => {
          this.isConnected = false;
          console.log(`[STT][${this.callSid}] Deepgram connection closed`);
          this.emit('close');
        });

        // Error from Deepgram
        this.connection.on(LiveTranscriptionEvents.Error, (err) => {
          console.error(`[STT][${this.callSid}] Deepgram error:`, err);
          this.isConnected = false;
          this.emit('error', err instanceof Error ? err : new Error(String(err)));
          // Reject the connect() promise if still pending
          reject(err);
        });

        // Metadata event (informational)
        this.connection.on(LiveTranscriptionEvents.Metadata, (meta) => {
          console.log(`[STT][${this.callSid}] Deepgram metadata:`, meta?.request_id);
        });

      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Send a base64-encoded mulaw audio chunk to Deepgram.
   * Called for each Twilio 'media' event.
   *
   * @param base64Payload - base64-encoded mulaw audio from Twilio
   */
  sendAudio(base64Payload: string): void {
    if (!this.connection || !this.isConnected) {
      return; // Drop audio if not connected — call may be ending
    }

    try {
      const audioBuffer = Buffer.from(base64Payload, 'base64');
      // Deepgram SDK send() expects ArrayBuffer — convert from Node Buffer
      this.connection.send(audioBuffer.buffer.slice(audioBuffer.byteOffset, audioBuffer.byteOffset + audioBuffer.byteLength));
    } catch (err) {
      console.error(`[STT][${this.callSid}] Error sending audio:`, err);
    }
  }

  /**
   * Gracefully close the Deepgram connection.
   * Call this when the Twilio call ends.
   */
  destroy(): void {
    if (this.connection) {
      try {
        this.connection.requestClose();
      } catch {
        // Ignore errors on close
      }
      this.connection = null;
    }
    this.isConnected = false;
    this.removeAllListeners();
  }

  get connected(): boolean {
    return this.isConnected;
  }
}
