/**
 * POST /api/webhook/elevenlabs/variables
 *
 * Pre-call dynamic variables endpoint — ElevenLabs calls this BEFORE starting
 * a conversation to fetch per-business personalization data.
 *
 * This is what makes one shared ElevenLabs agent sound like each contractor's
 * dedicated receptionist: business_name, owner_name, and trade are injected
 * into the system prompt at call start.
 *
 * ElevenLabs Twilio personalization webhook spec:
 *   Request payload (flat JSON):
 *     { caller_id, agent_id, called_number, call_sid }
 *
 *   Response format (MUST include type field):
 *     { type: "conversation_initiation_client_data", dynamic_variables: { ... } }
 *
 * Docs: https://elevenlabs.io/docs/eleven-agents/customization/personalization/twilio-personalization
 *
 * Flow:
 *   1. Log raw request body for debugging
 *   2. Parse ElevenLabs POST body (JSON) — flat fields: caller_id, call_sid, called_number, agent_id
 *   3. Use called_number directly to look up business in Supabase (no Twilio API needed!)
 *   4. Return { type: "conversation_initiation_client_data", dynamic_variables: { ... } }
 *   5. Always return 200 — never crash. ElevenLabs will proceed regardless.
 *
 * BUGS FIXED (2026-03-06):
 *   - Was parsing body.caller.phone_number / body.call.twilio_call_sid (wrong nested structure)
 *   - Should parse body.caller_id / body.call_sid / body.called_number (flat top-level fields)
 *   - Was returning { dynamic_variables: {...} } — missing required "type" field
 *   - Was calling Twilio API to get "To" number — now using called_number directly (faster, no external dep)
 */

import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Request body ElevenLabs sends to this endpoint before each conversation.
 * Fields are flat/top-level — NOT nested under caller.* or call.*
 * Ref: https://elevenlabs.io/docs/eleven-agents/customization/personalization/twilio-personalization
 */
interface ElevenLabsVariablesRequest {
  /** The phone number of the caller (e.g. "+14155551234") */
  caller_id: string
  /** The ID of the agent receiving the call */
  agent_id: string
  /** The Twilio number that was called (e.g. "+16196482491") */
  called_number: string
  /** Unique identifier for the Twilio call (e.g. "CA...") */
  call_sid: string
}

/** Variables returned to ElevenLabs — injected into agent system prompt */
interface DynamicVariables {
  business_name: string
  owner_name: string
  trade: string
  business_id: string
  caller_phone: string
  twilio_call_sid: string
}

/**
 * Response format required by ElevenLabs.
 * MUST include type: "conversation_initiation_client_data"
 */
interface VariablesResponse {
  type: 'conversation_initiation_client_data'
  dynamic_variables: DynamicVariables
}

/** Subset of the businesses table we need for this endpoint */
interface BusinessRecord {
  id: string
  name: string
  owner_name: string
  trade: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Supabase admin client — no cookie auth needed for webhook routes */
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error(
      'Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY'
    )
  }
  return createClient(url, key)
}

/** Graceful default variables — generic greeting, no business context */
function defaultVariables(
  callerPhone: string,
  twilioCallSid: string
): DynamicVariables {
  return {
    business_name: 'the business',
    owner_name: 'the owner',
    trade: 'general',
    business_id: '',
    caller_phone: callerPhone,
    twilio_call_sid: twilioCallSid,
  }
}

/** Build a 200 JSON response with required ElevenLabs format */
function variablesResponse(variables: DynamicVariables): NextResponse<VariablesResponse> {
  return NextResponse.json<VariablesResponse>(
    {
      type: 'conversation_initiation_client_data',
      dynamic_variables: variables,
    },
    { status: 200 }
  )
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(req: Request): Promise<NextResponse<VariablesResponse>> {
  const startMs = Date.now()
  let callerPhone = ''
  let twilioCallSid = ''

  try {
    // 1. Read and log the raw body — essential for debugging field name mismatches
    const rawBody = await req.text()
    console.log('[elevenlabs/variables] RAW REQUEST BODY:', rawBody)
    console.log('[elevenlabs/variables] REQUEST HEADERS:', JSON.stringify({
      'content-type': req.headers.get('content-type'),
      'user-agent': req.headers.get('user-agent'),
      'x-forwarded-for': req.headers.get('x-forwarded-for'),
    }))

    // 2. Parse JSON body from ElevenLabs
    //    ElevenLabs sends FLAT fields: caller_id, agent_id, called_number, call_sid
    //    NOT nested: body.caller.phone_number or body.call.twilio_call_sid
    let body: ElevenLabsVariablesRequest
    try {
      body = JSON.parse(rawBody) as ElevenLabsVariablesRequest
    } catch (parseErr) {
      console.error('[elevenlabs/variables] JSON parse error:', parseErr)
      return variablesResponse(defaultVariables(callerPhone, twilioCallSid))
    }

    // Extract flat top-level fields (per EL spec)
    callerPhone = body?.caller_id ?? ''
    twilioCallSid = body?.call_sid ?? ''
    const calledNumber = body?.called_number ?? ''
    const agentId = body?.agent_id ?? ''

    console.log(
      `[elevenlabs/variables] PARSED: agentId=${agentId} callerPhone=${callerPhone}` +
      ` callSid=${twilioCallSid} calledNumber=${calledNumber}` +
      ` elapsed=${Date.now() - startMs}ms`
    )

    // Warn about missing fields that would cause lookup failure
    if (!calledNumber) {
      console.warn(
        '[elevenlabs/variables] called_number is empty — cannot look up business.' +
        ' Full body was: ' + rawBody
      )
      return variablesResponse(defaultVariables(callerPhone, twilioCallSid))
    }

    // 3. Look up business by the Twilio number that was called
    //    called_number comes directly from EL payload — no Twilio API call needed!
    const supabase = getSupabaseAdmin()
    const { data: business, error } = await supabase
      .from('businesses')
      .select('id, name, owner_name, trade')
      .eq('twilio_phone_number', calledNumber)
      .eq('is_active', true)
      .single<BusinessRecord>()

    const dbElapsed = Date.now() - startMs
    console.log(`[elevenlabs/variables] DB lookup elapsed=${dbElapsed}ms error=${error?.message ?? 'none'}`)

    if (error || !business) {
      console.warn(
        `[elevenlabs/variables] Business not found for calledNumber=${calledNumber} — returning defaults.` +
        ` DB error: ${error?.message ?? 'not found'}`
      )
      return variablesResponse(defaultVariables(callerPhone, twilioCallSid))
    }

    // 4. Found — return personalized variables
    const totalElapsed = Date.now() - startMs
    console.log(
      `[elevenlabs/variables] SUCCESS: business="${business.name}" id=${business.id}` +
      ` trade=${business.trade} totalElapsed=${totalElapsed}ms`
    )

    return variablesResponse({
      business_name: business.name,
      owner_name: business.owner_name,
      trade: business.trade,
      business_id: business.id,
      caller_phone: callerPhone,
      twilio_call_sid: twilioCallSid,
    })
  } catch (err) {
    // 5. Never crash — always return 200 so ElevenLabs can proceed with defaults
    console.error('[elevenlabs/variables] Unhandled error:', err)
    return variablesResponse(defaultVariables(callerPhone, twilioCallSid))
  }
}
