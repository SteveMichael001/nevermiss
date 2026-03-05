import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BillingView } from './billing-view'

export const dynamic = 'force-dynamic'

export default async function BillingPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: business } = await supabase
    .from('businesses')
    .select('id, name, subscription_status, trial_ends_at, stripe_customer_id, stripe_subscription_id')
    .eq('owner_id', user.id)
    .single()

  if (!business) redirect('/onboarding/setup')

  // Get call stats
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()

  const [{ count: monthCount }, { count: todayCount }] = await Promise.all([
    supabase
      .from('calls')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', business.id)
      .gte('created_at', monthStart),
    supabase
      .from('calls')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', business.id)
      .gte('created_at', todayStart),
  ])

  return (
    <BillingView
      business={business}
      monthCallCount={monthCount ?? 0}
      todayCallCount={todayCount ?? 0}
    />
  )
}
