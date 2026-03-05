import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

  // Get call to verify ownership
  const { data: call } = await supabase
    .from('calls')
    .select('recording_url')
    .eq('id', params.id)
    .eq('business_id', business.id)
    .single()

  if (!call || !call.recording_url) {
    return NextResponse.json({ error: 'Recording not found' }, { status: 404 })
  }

  // If it's already an external URL, return as-is
  if (call.recording_url.startsWith('http')) {
    return NextResponse.json({ url: call.recording_url })
  }

  // Generate signed URL from Supabase storage
  const adminClient = createAdminClient()
  const { data: signedUrl, error } = await adminClient.storage
    .from('recordings')
    .createSignedUrl(call.recording_url, 3600) // 1 hour expiry

  if (error) return NextResponse.json({ error: 'Failed to generate signed URL' }, { status: 500 })

  return NextResponse.json({ url: signedUrl.signedUrl })
}
