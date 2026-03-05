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
 * Flow:
 *   1. Parse ElevenLabs POST body (JSON)
 *   2. Look up business in Supabase by elevenlabs_agent_id = agent_id
 *      Note: The `businesses` table needs an `elevenlabs_agent_id TEXT` column.
 *      For V1 with one shared agent, all businesses share the same agent_id
 *      (ELEVENLABS_AGENT_ID env var). Lookup falls through to defaults gracefully.
 *   3. Return { dynamic_variables: { ... } }
 *   4. Always return 200 — never crash. ElevenLabs will proceed regardless.
 */

import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Request body ElevenLabs sends to this endpoint before each conversation */
interface ElevenLabsVariablesRequest {
  agent_id: string
  caller: {
    phone_number: string
  }
  call: {
    twilio_call_sid: string
  }
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

interface VariablesResponse {
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

/** Build a 200 JSON response with dynamic_variables */
function variablesResponse(variables: DynamicVariables): NextResponse<VariablesResponse> {
  return NextResponse.json<VariablesResponse>(
    { dynamic_variables: variables },
    { status: 200 }
  )
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(req: Request): Promise<NextResponse<VariablesResponse>> {
  let callerPhone = ''
  let twilioCallSid = ''

  try {
    // 1. Parse JSON body from ElevenLabs
    const body = (await req.json()) as ElevenLabsVariablesRequest

    callerPhone = body?.caller?.phone_number ?? ''
    twilioCallSid = body?.call?.twilio_call_sid ?? ''
    const agentId = body?.agent_id ?? ''

    console.log(
      `[elevenlabs/variables] agentId=${agentId} callerPhone=${callerPhone} callSid=${twilioCallSid}`
    )

    if (!agentId) {
      // No agent_id to look up — return defaults
      console.warn('[elevenlabs/variables] No agent_id in request — returning defaults')
      return variablesResponse(defaultVariables(callerPhone, twilioCallSid))
    }

    // 2. Look up business by elevenlabs_agent_id
    const supabase = getSupabaseAdmin()
    const { data: business, error } = await supabase
      .from('businesses')
      .select('id, name, owner_name, trade')
      .eq('elevenlabs_agent_id', agentId)
      .single<BusinessRecord>()

    if (error || !business) {
      // Business not found — log and return graceful defaults
      // This is normal in V1 if all businesses share one agent_id and
      // the elevenlabs_agent_id column isn't populated per-business yet.
      console.warn(
        `[elevenlabs/variables] Business not found for agentId=${agentId} — returning defaults`
      )
      return variablesResponse(defaultVariables(callerPhone, twilioCallSid))
    }

    // 3. Found — return personalized variables
    console.log(
      `[elevenlabs/variables] Matched business="${business.name}" id=${business.id} trade=${business.trade}`
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
    // 4. Never crash — always return 200 so ElevenLabs can proceed with defaults
    console.error('[elevenlabs/variables] Unhandled error:', err)
    return variablesResponse(defaultVariables(callerPhone, twilioCallSid))
  }
}
