import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!business) {
    return NextResponse.json({ error: 'Business not found' }, { status: 404 })
  }

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') ?? '0')
  const limit = 25
  const urgency = searchParams.get('urgency')
  const status = searchParams.get('status')

  let query = supabase
    .from('calls')
    .select('*', { count: 'exact' })
    .eq('business_id', business.id)
    .order('created_at', { ascending: false })
    .range(page * limit, (page + 1) * limit - 1)

  if (urgency) query = query.eq('urgency', urgency)
  if (status) query = query.eq('lead_status', status)

  const { data: calls, count, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ calls, count, page, limit })
}
