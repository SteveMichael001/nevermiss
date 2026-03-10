import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { getRequiredEnv } from '@/lib/env'
import { redactPhone } from '@/lib/utils'

interface ElevenLabsVariablesRequest {
  caller_id: string
  agent_id: string
  called_number: string
  call_sid: string
}

interface DynamicVariables {
  business_name: string
  owner_name: string
  trade: string
  business_id: string
  caller_phone: string
  twilio_call_sid: string
}

interface VariablesResponse {
  type: 'conversation_initiation_client_data'
  dynamic_variables: DynamicVariables
}

interface BusinessRecord {
  id: string
  name: string
  owner_name: string
  trade: string
}

function getSupabaseAdmin() {
  const url = getRequiredEnv('NEXT_PUBLIC_SUPABASE_URL', 'elevenlabs/variables')
  const key = getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY', 'elevenlabs/variables')

  if (!url || !key) {
    throw new Error('[elevenlabs/variables] Missing Supabase env vars')
  }

  return createClient(url, key)
}

function defaultVariables(callerPhone: string, twilioCallSid: string): DynamicVariables {
  return {
    business_name: 'the business',
    owner_name: 'the owner',
    trade: 'general',
    business_id: '',
    caller_phone: callerPhone,
    twilio_call_sid: twilioCallSid,
  }
}

function variablesResponse(variables: DynamicVariables): NextResponse<VariablesResponse> {
  return NextResponse.json(
    {
      type: 'conversation_initiation_client_data',
      dynamic_variables: variables,
    },
    { status: 200 }
  )
}

export async function POST(request: Request): Promise<NextResponse<VariablesResponse>> {
  let callerPhone = ''
  let twilioCallSid = ''

  try {
    const rawBody = await request.text()
    const body = JSON.parse(rawBody) as ElevenLabsVariablesRequest

    callerPhone = body.caller_id ?? ''
    twilioCallSid = body.call_sid ?? ''
    const calledNumber = body.called_number ?? ''

    if (!calledNumber) {
      console.warn(
        `[elevenlabs/variables] Missing called_number for caller=${redactPhone(callerPhone)}`
      )
      return variablesResponse(defaultVariables(callerPhone, twilioCallSid))
    }

    const supabase = getSupabaseAdmin()
    const { data: business, error } = await supabase
      .from('businesses')
      .select('id, name, owner_name, trade')
      .eq('twilio_phone_number', calledNumber)
      .eq('is_active', true)
      .maybeSingle<BusinessRecord>()

    if (error) {
      console.error('[elevenlabs/variables] Failed to load business:', error)
      return variablesResponse(defaultVariables(callerPhone, twilioCallSid))
    }

    if (!business) {
      console.warn(
        `[elevenlabs/variables] Business not found for number=${redactPhone(calledNumber)}`
      )
      return variablesResponse(defaultVariables(callerPhone, twilioCallSid))
    }

    return variablesResponse({
      business_name: business.name,
      owner_name: business.owner_name,
      trade: business.trade,
      business_id: business.id,
      caller_phone: callerPhone,
      twilio_call_sid: twilioCallSid,
    })
  } catch (error) {
    console.error('[elevenlabs/variables] Unhandled error:', error)
    return variablesResponse(defaultVariables(callerPhone, twilioCallSid))
  }
}
