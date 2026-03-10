import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getRecordingObjectPath } from '@/lib/recordings'

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
      console.error('[calls/[id]/audio] Failed to load business:', businessError)
      return NextResponse.json({ error: 'Failed to load business' }, { status: 500 })
    }

    if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

    const { data: callOwnership, error: ownershipError } = await supabase
      .from('calls')
      .select('id, business_id, recording_url')
      .eq('id', params.id)
      .maybeSingle<{ id: string; business_id: string; recording_url: string | null }>()

    if (ownershipError) {
      console.error('[calls/[id]/audio] Failed to verify call ownership:', ownershipError)
      return NextResponse.json({ error: 'Failed to load recording' }, { status: 500 })
    }

    if (!callOwnership) {
      return NextResponse.json({ error: 'Recording not found' }, { status: 404 })
    }

    if (callOwnership.business_id !== business.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!callOwnership.recording_url) {
      return NextResponse.json({ error: 'Recording not found' }, { status: 404 })
    }

    const adminClient = createAdminClient()
    const { data: signedUrl, error } = await adminClient.storage
      .from('recordings')
      .createSignedUrl(getRecordingObjectPath(callOwnership.recording_url), 3600)

    if (error || !signedUrl?.signedUrl) {
      console.error('[calls/[id]/audio] Failed to generate signed URL:', error)
      return NextResponse.json({ error: 'Failed to generate signed URL' }, { status: 500 })
    }

    return NextResponse.json({ url: signedUrl.signedUrl })
  } catch (error) {
    console.error('[calls/[id]/audio] Unhandled error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
