import { NextResponse } from 'next/server'
import twilio from 'twilio'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/onboarding/provision
 *
 * Provisions a Twilio phone number for the business.
 *
 * V1 note: After purchasing the number, it must be manually imported into ElevenLabs:
 *   ElevenLabs Dashboard → Telephony → Phone Numbers → Import Number → "From Twilio"
 *   Then assign it to the NeverMiss agent for this business.
 *
 * Body params:
 *   areaCode         - desired area code (default: "619")
 *   elevenlabsAgentId - optional: save the ElevenLabs agent ID for this business
 */
export async function POST(request: Request) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const areaCode: string = body.areaCode ?? '619'
  const elevenlabsAgentId: string | null = body.elevenlabsAgentId ?? null

  const { data: business } = await supabase
    .from('businesses')
    .select('id, twilio_phone_number')
    .eq('owner_id', user.id)
    .single()

  if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

  // Save elevenlabs_agent_id if provided (can be set independently of number provisioning)
  if (elevenlabsAgentId) {
    await supabase
      .from('businesses')
      .update({ elevenlabs_agent_id: elevenlabsAgentId })
      .eq('id', business.id)
  }

  // Return existing number if already provisioned
  if (business.twilio_phone_number) {
    return NextResponse.json({
      phoneNumber: business.twilio_phone_number,
      elevenlabsSetupRequired: !elevenlabsAgentId,
      message: 'Number already provisioned. If not yet imported into ElevenLabs, do so via: ElevenLabs Dashboard → Telephony → Phone Numbers → Import Number → From Twilio.',
    })
  }

  const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID
  const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN
  if (!twilioAccountSid || !twilioAuthToken) {
    throw new Error('TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN env vars are not set')
  }

  const client = twilio(twilioAccountSid, twilioAuthToken)

  // Search for an available local number in the desired area code
  const available = await client.availablePhoneNumbers('US').local.list({
    areaCode: parseInt(areaCode, 10),
    limit: 1,
    voiceEnabled: true,
    smsEnabled: true,
  })

  if (!available.length) {
    return NextResponse.json(
      { error: `No available numbers in area code ${areaCode}. Try a different area code.` },
      { status: 422 }
    )
  }

  // Purchase the number and point voiceUrl at OUR routing handler.
  // NeverMiss owns the webhook for business-hours routing; ElevenLabs is called
  // downstream by our handler (out-of-hours path).
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  const purchased = await client.incomingPhoneNumbers.create({
    phoneNumber: available[0].phoneNumber,
    friendlyName: `NeverMiss — Business ${business.id}`,
    voiceUrl: `${appUrl}/api/webhook/twilio/voice`,
    voiceMethod: 'POST',
    statusCallback: `${appUrl}/api/webhook/twilio/status`,
    statusCallbackMethod: 'POST',
  })

  // Persist to DB (include elevenlabs_agent_id if provided in this request)
  await supabase
    .from('businesses')
    .update({
      twilio_phone_number: purchased.phoneNumber,
      twilio_phone_sid: purchased.sid,
      ...(elevenlabsAgentId ? { elevenlabs_agent_id: elevenlabsAgentId } : {}),
    })
    .eq('id', business.id)

  return NextResponse.json({
    phoneNumber: purchased.phoneNumber,
    phoneSid: purchased.sid,
    elevenlabsSetupRequired: true,
    manualStep: 'Import this number in ElevenLabs dashboard: Telephony → Phone Numbers → Import from Twilio',
    nextStep: [
      'Your Twilio number is ready. To activate AI answering:',
      '1. Go to ElevenLabs Dashboard → Telephony → Phone Numbers',
      '2. Click "Import Number" → "From Twilio"',
      '3. Enter your Twilio Account SID and Auth Token',
      `4. Select the number: ${purchased.phoneNumber}`,
      '5. Assign it to your NeverMiss AI agent',
    ].join('\n'),
  })
}
