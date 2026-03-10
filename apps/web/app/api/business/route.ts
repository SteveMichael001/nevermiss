import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: business, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('owner_id', user.id)
      .maybeSingle()

    if (error) {
      console.error('[business] Failed to load business:', error)
      return NextResponse.json({ error: 'Failed to load business' }, { status: 500 })
    }

    if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

    return NextResponse.json({ business })
  } catch (error) {
    console.error('[business] Unhandled GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()

    const allowedFields = [
      'name',
      'trade',
      'owner_name',
      'owner_phone',
      'owner_email',
      'greeting_text',
      'dial_timeout_seconds',
      'notification_phones',
      'notification_emails',
      'business_hours',
    ]

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

    for (const field of allowedFields) {
      if (field in body) {
        updates[field] = body[field]
      }
    }

    const { data: existingBusiness, error: existingBusinessError } = await supabase
      .from('businesses')
      .select('id')
      .eq('owner_id', user.id)
      .maybeSingle()

    if (existingBusinessError) {
      console.error('[business] Failed to verify business ownership:', existingBusinessError)
      return NextResponse.json({ error: 'Failed to verify business' }, { status: 500 })
    }

    if (!existingBusiness) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    const { data: business, error } = await supabase
      .from('businesses')
      .update(updates)
      .eq('id', existingBusiness.id)
      .select()
      .single()

    if (error) {
      console.error('[business] Failed to update business:', error)
      return NextResponse.json({ error: 'Failed to update business' }, { status: 500 })
    }

    return NextResponse.json({ business })
  } catch (error) {
    console.error('[business] Unhandled PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
