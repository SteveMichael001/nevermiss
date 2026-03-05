import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PaymentView } from './payment-view'
import { PLAN } from '@/lib/stripe'

export const dynamic = 'force-dynamic'

export default async function PaymentPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: business } = await supabase
    .from('businesses')
    .select('id, name, subscription_status')
    .eq('owner_id', user.id)
    .single()

  if (!business) redirect('/onboarding/setup')

  // Already active, go straight to complete
  if (business.subscription_status === 'active') {
    redirect('/onboarding/complete')
  }

  // Get trial end date (14 days from now)
  const trialEndDate = new Date()
  trialEndDate.setDate(trialEndDate.getDate() + PLAN.trialDays)

  return (
    <PaymentView
      businessId={business.id}
      businessName={business.name}
      trialEndDate={trialEndDate.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })}
    />
  )
}
