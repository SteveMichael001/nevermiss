import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { redactPhone } from '@/lib/utils'

export async function POST() {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: business, error } = await supabase
      .from('businesses')
      .select('twilio_phone_number')
      .eq('owner_id', user.id)
      .maybeSingle()

    if (error) {
      console.error('[business/test-call] Failed to load business:', error)
      return NextResponse.json({ error: 'Failed to load business' }, { status: 500 })
    }

    if (!business?.twilio_phone_number) {
      return NextResponse.json({ error: 'No AI number provisioned' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: `Test call initiated to ${redactPhone(business.twilio_phone_number)}`,
    })
  } catch (error) {
    console.error('[business/test-call] Unhandled error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
