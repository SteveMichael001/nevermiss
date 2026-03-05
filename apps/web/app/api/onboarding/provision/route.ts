import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const areaCode = body.areaCode ?? '619'

  const { data: business } = await supabase
    .from('businesses')
    .select('id, twilio_phone_number')
    .eq('owner_id', user.id)
    .single()

  if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

  // Return existing number if already provisioned
  if (business.twilio_phone_number) {
    return NextResponse.json({ phoneNumber: business.twilio_phone_number })
  }

  // Provision a Twilio number via the voice server
  // In the full implementation, this calls the Railway voice server
  // which handles Twilio API calls
  const voiceServerUrl = process.env.VOICE_SERVER_URL
  if (!voiceServerUrl) {
    // Dev fallback: generate a mock number
    const mockNumber = `+1${areaCode}555${Math.floor(Math.random() * 9000 + 1000)}`
    await supabase
      .from('businesses')
      .update({ twilio_phone_number: mockNumber })
      .eq('id', business.id)

    return NextResponse.json({ phoneNumber: mockNumber })
  }

  try {
    const res = await fetch(`${voiceServerUrl}/provision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessId: business.id, areaCode }),
    })

    const data = await res.json()

    if (!res.ok || !data.phoneNumber) {
      return NextResponse.json({ error: data.error ?? 'Provisioning failed' }, { status: 500 })
    }

    // Update business record
    await supabase
      .from('businesses')
      .update({
        twilio_phone_number: data.phoneNumber,
        twilio_phone_sid: data.phoneSid,
      })
      .eq('id', business.id)

    return NextResponse.json({ phoneNumber: data.phoneNumber })
  } catch (err) {
    console.error('Provision error:', err)
    return NextResponse.json({ error: 'Failed to reach voice server' }, { status: 500 })
  }
}
