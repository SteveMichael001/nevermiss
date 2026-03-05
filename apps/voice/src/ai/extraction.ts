/**
 * Post-call lead extraction using Claude Haiku.
 *
 * After a call ends, we send the full transcript to Claude Haiku
 * to extract structured lead data. This runs asynchronously and does NOT
 * block the call — it fires after the caller hangs up.
 *
 * Claude Haiku is used here because:
 *   1. Sub-penny cost per extraction
 *   2. Fast enough for near-real-time notification
 *   3. Good structured output from a simple prompt
 */

import Anthropic from '@anthropic-ai/sdk';
import type { LeadExtraction, Urgency } from '../types.js';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_API_KEY) {
  throw new Error('Missing ANTHROPIC_API_KEY environment variable');
}

const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

// Use Claude 3.5 Haiku — latest, cheapest, fast
const EXTRACTION_MODEL = 'claude-haiku-4-5';

/**
 * Extract structured lead data from a call transcript.
 * Returns a LeadExtraction object even on partial/failed extraction.
 *
 * @param transcript - Full call transcript as plain text
 * @param callerPhone - Caller's phone number from Twilio (already known)
 * @param trade - The business trade for context
 */
export async function extractLeadFromTranscript(
  transcript: string,
  callerPhone: string | null,
  trade: string
): Promise<LeadExtraction> {
  // Default fallback in case extraction fails
  const fallback: LeadExtraction = {
    caller_name: null,
    caller_phone: callerPhone,
    service_needed: null,
    urgency: 'unknown',
    preferred_callback: null,
    is_spam: false,
    summary: 'Unable to extract lead data from transcript.',
  };

  if (!transcript || transcript.trim().length < 10) {
    return fallback;
  }

  const prompt = buildExtractionPrompt(transcript, callerPhone, trade);

  try {
    const message = await anthropic.messages.create({
      model: EXTRACTION_MODEL,
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const responseText = message.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as { type: 'text'; text: string }).text)
      .join('');

    return parseExtractionResponse(responseText, callerPhone);
  } catch (err) {
    console.error('[Extraction] Claude Haiku error:', err);
    return fallback;
  }
}

/**
 * Build the extraction prompt for Claude Haiku.
 * Simple, clear instructions with JSON output format.
 */
function buildExtractionPrompt(transcript: string, callerPhone: string | null, trade: string): string {
  return `You are extracting structured data from a home service business phone call transcript.

Trade: ${trade}
Caller Phone: ${callerPhone ?? 'unknown'}

TRANSCRIPT:
${transcript}

Extract the following information from the transcript and respond with ONLY a valid JSON object (no markdown, no explanation):

{
  "caller_name": "string or null — the caller's name if mentioned",
  "caller_phone": "${callerPhone ?? 'null'} — use provided phone number",
  "service_needed": "string or null — brief description of what service is needed (1-2 sentences max)",
  "urgency": "emergency|urgent|routine|unknown — emergency if dangerous/flooding/no heat in winter/etc, urgent if needs attention soon, routine if a normal service call, unknown if unclear",
  "preferred_callback": "string or null — when they want to be called back (freeform: 'ASAP', 'tomorrow morning', 'after 3pm', etc.)",
  "is_spam": "boolean — true if this appears to be a robocall, spam call, or sales pitch rather than a genuine service need",
  "summary": "string — 1-2 sentence plain English summary of the lead"
}

Important rules:
- If caller_name is not mentioned, set to null
- urgency = "emergency" only for genuine emergencies (flooding, gas leak, no heat in winter, electrical fire, etc.)
- is_spam = true if the transcript contains obvious spam patterns (press 1, vehicle warranty, etc.)
- Keep service_needed concise and specific
- If transcript is empty or gibberish, set is_spam to true`;
}

/**
 * Parse Claude's JSON response into a LeadExtraction object.
 * Handles malformed JSON gracefully.
 */
function parseExtractionResponse(responseText: string, callerPhone: string | null): LeadExtraction {
  const defaultResult: LeadExtraction = {
    caller_name: null,
    caller_phone: callerPhone,
    service_needed: null,
    urgency: 'unknown',
    preferred_callback: null,
    is_spam: false,
    summary: 'Lead captured.',
  };

  try {
    // Strip markdown code blocks if present
    const cleaned = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const parsed = JSON.parse(cleaned) as Record<string, unknown>;

    return {
      caller_name: typeof parsed.caller_name === 'string' ? parsed.caller_name : null,
      caller_phone: typeof parsed.caller_phone === 'string' ? parsed.caller_phone : callerPhone,
      service_needed: typeof parsed.service_needed === 'string' ? parsed.service_needed : null,
      urgency: validateUrgency(parsed.urgency),
      preferred_callback: typeof parsed.preferred_callback === 'string' ? parsed.preferred_callback : null,
      is_spam: parsed.is_spam === true,
      summary: typeof parsed.summary === 'string' ? parsed.summary : 'Lead captured.',
    };
  } catch (err) {
    console.error('[Extraction] Failed to parse JSON response:', err);
    console.error('[Extraction] Raw response:', responseText);
    return defaultResult;
  }
}

function validateUrgency(value: unknown): Urgency {
  const valid: Urgency[] = ['emergency', 'urgent', 'routine', 'unknown'];
  if (typeof value === 'string' && valid.includes(value as Urgency)) {
    return value as Urgency;
  }
  return 'unknown';
}
