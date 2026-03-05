import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Dynamic variables webhook — called by ElevenLabs BEFORE a conversation starts.
 *
 * ElevenLabs POSTs here with the agent_id and caller metadata.
 * We return per-business variables that get injected into the agent's system prompt,
 * enabling one agent to serve all contractors.
 */

interface ElevenLabsVariablesRequest {
  agent_id: string
  caller?: {
    phone_number?: string
  }
  call?: {
    twilio_call_sid?: string
  }
}

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase env vars not configured')
  }

  let body: ElevenLabsVariablesRequest
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const agentId = body.agent_id
  const callerPhone = body.caller?.phone_number ?? null
  const twilioCallSid = body.call?.twilio_call_sid ?? null

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const { data: business } = await supabase
    .from('businesses')
    .select('id, name, trade, owner_name')
    .eq('elevenlabs_agent_id', agentId)
    .single()

  if (!business) {
    console.warn(`[ElevenLabs Variables] No business found for agent_id: ${agentId} — returning defaults`)
    return NextResponse.json({
      dynamic_variables: {
        business_name: 'the business',
        owner_name: 'the owner',
        trade: 'home services',
        business_id: '',
        caller_phone: callerPhone ?? '',
        twilio_call_sid: twilioCallSid ?? '',
      },
    })
  }

  return NextResponse.json({
    dynamic_variables: {
      business_name: business.name,
      owner_name: business.owner_name,
      trade: business.trade,
      business_id: business.id,
      caller_phone: callerPhone ?? '',
      twilio_call_sid: twilioCallSid ?? '',
    },
  })
}
