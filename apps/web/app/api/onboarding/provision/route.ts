import { NextResponse } from 'next/server'
import twilio from 'twilio'
import { createClient } from '@/lib/supabase/server'
import { getAppUrl } from '@/lib/env'

const FALLBACK_AREA_CODES = ['415', '212']
const TOLL_FREE_AREA_CODE = '800'

async function findAvailableNumber(
  client: ReturnType<typeof twilio>,
  areaCodes: string[]
) {
  for (const areaCode of areaCodes) {
    const available = await client.availablePhoneNumbers('US').local.list({
      areaCode: parseInt(areaCode, 10),
      limit: 1,
      voiceEnabled: true,
      smsEnabled: true,
    })

    if (available.length > 0) {
      return available[0]
    }
  }

  const tollFree = await client.availablePhoneNumbers('US').tollFree.list({
    areaCode: parseInt(TOLL_FREE_AREA_CODE, 10),
    limit: 1,
    voiceEnabled: true,
    smsEnabled: true,
  })

  return tollFree[0] ?? null
}

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const areaCode: string = body.areaCode ?? '619'

    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, twilio_phone_number, twilio_phone_sid')
      .eq('owner_id', user.id)
      .maybeSingle()

    if (businessError) {
      console.error('[onboarding/provision] Failed to load business:', businessError)
      return NextResponse.json({ error: 'Failed to load business' }, { status: 500 })
    }

    if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

    if (business.twilio_phone_number) {
      return NextResponse.json({
        phoneNumber: business.twilio_phone_number,
        phoneSid: business.twilio_phone_sid,
      })
    }

    const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID?.trim()
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN?.trim()
    if (!twilioAccountSid || !twilioAuthToken) {
      console.error('[onboarding/provision] Twilio credentials are not configured')
      return NextResponse.json({ error: 'Phone provisioning is not configured' }, { status: 500 })
    }

    const client = twilio(twilioAccountSid, twilioAuthToken)
    const areaCodePriority = [areaCode, ...FALLBACK_AREA_CODES].filter(
      (code, index, codes) => /^\d{3}$/.test(code) && codes.indexOf(code) === index
    )

    const available = await findAvailableNumber(client, areaCodePriority)

    if (!available) {
      return NextResponse.json(
        { error: 'No available phone numbers right now. Please try again in a few minutes.' },
        { status: 422 }
      )
    }

    const appUrl = getAppUrl(request)
    let purchased

    try {
      purchased = await client.incomingPhoneNumbers.create({
        phoneNumber: available.phoneNumber,
        friendlyName: `NeverMiss — Business ${business.id}`,
        voiceUrl: `${appUrl}/api/webhook/twilio/voice`,
        voiceMethod: 'POST',
        statusCallback: `${appUrl}/api/webhook/twilio/status`,
        statusCallbackMethod: 'POST',
      })
    } catch (error) {
      console.error('[onboarding/provision] Failed to provision Twilio number:', error)
      return NextResponse.json({ error: 'Failed to provision phone number' }, { status: 502 })
    }

    const { error: updateError } = await supabase
      .from('businesses')
      .update({
        twilio_phone_number: purchased.phoneNumber,
        twilio_phone_sid: purchased.sid,
      })
      .eq('id', business.id)

    if (updateError) {
      console.error('[onboarding/provision] Failed to save provisioned number:', updateError)
      return NextResponse.json({ error: 'Failed to save phone number' }, { status: 500 })
    }

    return NextResponse.json({
      phoneNumber: purchased.phoneNumber,
      phoneSid: purchased.sid,
    })
  } catch (error) {
    console.error('[onboarding/provision] Unhandled error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
