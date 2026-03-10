import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id')
      .eq('owner_id', user.id)
      .maybeSingle()

    if (businessError) {
      console.error('[calls/[id]] Failed to load business:', businessError)
      return NextResponse.json({ error: 'Failed to load business' }, { status: 500 })
    }

    if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

    const { data: callOwnership, error: ownershipError } = await supabase
      .from('calls')
      .select('id, business_id')
      .eq('id', params.id)
      .maybeSingle<{ id: string; business_id: string }>()

    if (ownershipError) {
      console.error('[calls/[id]] Failed to verify call ownership:', ownershipError)
      return NextResponse.json({ error: 'Failed to load call' }, { status: 500 })
    }

    if (!callOwnership) return NextResponse.json({ error: 'Call not found' }, { status: 404 })
    if (callOwnership.business_id !== business.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: call, error } = await supabase
      .from('calls')
      .select('*')
      .eq('id', params.id)
      .maybeSingle()

    if (error) {
      console.error('[calls/[id]] Failed to load call:', error)
      return NextResponse.json({ error: 'Failed to load call' }, { status: 500 })
    }

    if (!call) return NextResponse.json({ error: 'Call not found' }, { status: 404 })

    return NextResponse.json({ call })
  } catch (error) {
    console.error('[calls/[id]] Unhandled GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id')
      .eq('owner_id', user.id)
      .maybeSingle()

    if (businessError) {
      console.error('[calls/[id]] Failed to load business:', businessError)
      return NextResponse.json({ error: 'Failed to load business' }, { status: 500 })
    }

    if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

    const { data: callOwnership, error: ownershipError } = await supabase
      .from('calls')
      .select('id, business_id')
      .eq('id', params.id)
      .maybeSingle<{ id: string; business_id: string }>()

    if (ownershipError) {
      console.error('[calls/[id]] Failed to verify call ownership:', ownershipError)
      return NextResponse.json({ error: 'Failed to load call' }, { status: 500 })
    }

    if (!callOwnership) return NextResponse.json({ error: 'Call not found' }, { status: 404 })
    if (callOwnership.business_id !== business.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const allowedFields = ['lead_status']
    const updates: Record<string, unknown> = {}

    for (const field of allowedFields) {
      if (field in body) {
        updates[field] = body[field]
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const { data: call, error } = await supabase
      .from('calls')
      .update(updates)
      .eq('id', params.id)
      .select()
      .maybeSingle()

    if (error) {
      console.error('[calls/[id]] Failed to update call:', error)
      return NextResponse.json({ error: 'Failed to update call' }, { status: 500 })
    }

    return NextResponse.json({ call })
  } catch (error) {
    console.error('[calls/[id]] Unhandled PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
