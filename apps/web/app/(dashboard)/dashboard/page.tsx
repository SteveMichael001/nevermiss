import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CallLogView } from './call-log-view'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: business } = await supabase
    .from('businesses')
    .select('id, name, subscription_status, twilio_phone_number')
    .eq('owner_id', user.id)
    .single()

  if (!business) {
    redirect('/onboarding/setup')
  }

  const { data: calls, count } = await supabase
    .from('calls')
    .select('*', { count: 'exact' })
    .eq('business_id', business.id)
    .order('created_at', { ascending: false })
    .range(0, 24)

  return (
    <CallLogView
      initialCalls={calls ?? []}
      totalCount={count ?? 0}
      businessId={business.id}
      businessPhone={business.twilio_phone_number}
      subscriptionStatus={business.subscription_status}
    />
  )
}
