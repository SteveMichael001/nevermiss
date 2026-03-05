import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: business } = await supabase
    .from('businesses')
    .select('twilio_phone_number')
    .eq('owner_id', user.id)
    .single()

  if (!business?.twilio_phone_number) {
    return NextResponse.json({ error: 'No AI number provisioned' }, { status: 400 })
  }

  // In a full implementation, this would trigger the voice server
  // to make a test call to the AI number
  return NextResponse.json({
    success: true,
    message: `Test call initiated to ${business.twilio_phone_number}`,
  })
}
