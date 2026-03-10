import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, Phone } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { AudioPlayer } from '@/components/audio-player'
import { LeadStatusSelect } from '@/components/lead-status-select'
import { TranscriptView } from '@/components/transcript-view'
import { UrgencyBadge } from '@/components/urgency-badge'
import { formatDateTime, formatPhone } from '@/lib/utils'

export const dynamic = 'force-dynamic'

interface CallDetail {
  id: string
  created_at: string
  caller_name: string | null
  caller_phone: string | null
  service_needed: string | null
  urgency: string
  preferred_callback: string | null
  full_transcript: string | null
  duration_seconds: number | null
  recording_url: string | null
  lead_status: string
}

export default async function CallDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: business, error: businessError } = await supabase
    .from('businesses')
    .select('id, name')
    .eq('owner_id', user.id)
    .maybeSingle()

  if (businessError) {
    console.error('[dashboard/calls/[id]/page] Failed to load business:', businessError)
    redirect('/onboarding/setup')
  }

  if (!business) redirect('/onboarding/setup')

  const { data: call, error: callError } = await supabase
    .from('calls')
    .select(
      'id, created_at, caller_name, caller_phone, service_needed, urgency, preferred_callback, full_transcript, duration_seconds, recording_url, lead_status'
    )
    .eq('id', params.id)
    .eq('business_id', business.id)
    .maybeSingle<CallDetail>()

  if (callError) {
    console.error('[dashboard/calls/[id]/page] Failed to load call:', callError)
  }

  if (!call) notFound()

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-zinc-200 px-6 sm:px-8 py-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-medium tracking-widest uppercase text-zinc-500 hover:text-black transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to call log
        </Link>
        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs tracking-widest uppercase text-zinc-500 mb-2 font-sans">Call Detail</p>
            <h1 className="text-3xl font-serif italic text-black">
              {call.caller_name ?? 'Unknown caller'}
            </h1>
            <p className="mt-2 text-sm text-zinc-500">
              Received {formatDateTime(call.created_at)}
            </p>
          </div>
          <LeadStatusSelect callId={call.id} status={call.lead_status} />
        </div>
      </div>

      <div className="px-6 sm:px-8 py-8 space-y-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr),360px]">
          <section className="border border-zinc-200 p-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium tracking-widest uppercase text-zinc-400">Caller Name</p>
                <p className="mt-2 text-base font-medium text-black">
                  {call.caller_name ?? 'Unknown caller'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium tracking-widest uppercase text-zinc-400">Phone</p>
                <div className="mt-2 flex items-center gap-2 text-base text-black">
                  <Phone className="h-4 w-4 text-zinc-400" />
                  <span>{call.caller_phone ? formatPhone(call.caller_phone) : 'No phone captured'}</span>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium tracking-widest uppercase text-zinc-400">Service Needed</p>
                <p className="mt-2 text-base text-black">
                  {call.service_needed ?? 'Service need not captured'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium tracking-widest uppercase text-zinc-400">Urgency</p>
                <div className="mt-2">
                  <UrgencyBadge urgency={call.urgency} />
                </div>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs font-medium tracking-widest uppercase text-zinc-400">
                  Preferred Callback Time
                </p>
                <p className="mt-2 text-base text-black">
                  {call.preferred_callback ?? 'Not provided'}
                </p>
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            {call.recording_url && (
              <section className="border border-zinc-200 p-6">
                <p className="text-xs font-medium tracking-widest uppercase text-zinc-400">Audio</p>
                <AudioPlayer callId={call.id} duration={call.duration_seconds ?? 0} className="mt-4" />
              </section>
            )}

            <section className="border border-zinc-200 p-6">
              <p className="text-xs font-medium tracking-widest uppercase text-zinc-400">Business</p>
              <p className="mt-2 text-base text-black">{business.name}</p>
            </section>
          </aside>
        </div>

        <section className="border border-zinc-200 p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium tracking-widest uppercase text-zinc-400">Transcript</p>
              <p className="mt-2 text-sm text-zinc-500">
                Caller and AI turns are shown in the order they happened.
              </p>
            </div>
          </div>
          <div className="mt-6">
            <TranscriptView transcript={call.full_transcript} />
          </div>
        </section>
      </div>
    </div>
  )
}
