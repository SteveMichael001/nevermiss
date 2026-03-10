import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import twilio from 'twilio'
import { getRequiredEnv } from '@/lib/env'

interface Business {
  id: string
  twilio_phone_number: string | null
}

function createAdminClient() {
  const url = getRequiredEnv('NEXT_PUBLIC_SUPABASE_URL', 'test/trigger-call')
  const key = getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY', 'test/trigger-call')

  if (!url || !key) {
    throw new Error('[test/trigger-call] Missing Supabase env vars')
  }

  return createClient(url, key)
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function canTriggerInThisEnvironment(request: Request) {
  if (process.env.NODE_ENV !== 'production') return true

  const expectedSecret = process.env.TEST_API_SECRET?.trim()
  if (!expectedSecret) return false

  const providedSecret =
    request.headers.get('TEST_API_SECRET')?.trim() ??
    request.headers.get('x-test-api-secret')?.trim() ??
    ''

  return providedSecret === expectedSecret
}

function buildTestCallTwiml() {
  const script = escapeXml(
    "Hi, I found your number on Google. I'm hoping you can help - I've got a pipe leaking under my kitchen sink and it's getting worse. My name is Alex Johnson and you can reach me back at this number. I'd love to get someone out today or tomorrow if possible. Thanks."
  )

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>${script}</Say>
  <Hangup/>
</Response>`
}

export async function POST(request: Request) {
  try {
    if (!canTriggerInThisEnvironment(request)) {
      return NextResponse.json(
        { error: 'Forbidden. In production, send the TEST_API_SECRET header.' },
        { status: 403 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const businessId = typeof body.businessId === 'string' ? body.businessId : undefined

    const supabase = createAdminClient()

    let query = supabase
      .from('businesses')
      .select('id, twilio_phone_number')
      .eq('is_active', true)

    if (businessId) {
      query = query.eq('id', businessId)
    } else {
      query = query.order('created_at', { ascending: true }).limit(1)
    }

    const { data, error } = await query

    if (error) {
      console.error('[test/trigger-call] Failed to load business:', error)
      return NextResponse.json({ error: 'Failed to load business' }, { status: 500 })
    }

    const business = (Array.isArray(data) ? data[0] : data) as Business | undefined

    if (!business?.twilio_phone_number) {
      return NextResponse.json({ error: 'Active business with AI number not found' }, { status: 404 })
    }

    const twilioAccountSid = getRequiredEnv('TWILIO_ACCOUNT_SID', 'test/trigger-call')
    const twilioAuthToken = getRequiredEnv('TWILIO_AUTH_TOKEN', 'test/trigger-call')
    const fromPhoneNumber = getRequiredEnv('TWILIO_PHONE_NUMBER', 'test/trigger-call')

    if (!twilioAccountSid || !twilioAuthToken || !fromPhoneNumber) {
      return NextResponse.json({ error: 'Twilio is not configured' }, { status: 500 })
    }

    const client = twilio(twilioAccountSid, twilioAuthToken)
    const call = await client.calls.create({
      from: fromPhoneNumber,
      to: business.twilio_phone_number,
      twiml: buildTestCallTwiml(),
    })

    return NextResponse.json({ success: true, callSid: call.sid })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to trigger test call'
    console.error('[test/trigger-call] Unhandled error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
