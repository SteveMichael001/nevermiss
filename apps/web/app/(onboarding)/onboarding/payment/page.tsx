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

  const { data: business, error } = await supabase
    .from('businesses')
    .select('id, name, subscription_status, stripe_subscription_id')
    .eq('owner_id', user.id)
    .maybeSingle()

  if (error) {
    console.error('[onboarding/payment/page] Failed to load business:', error)
    redirect('/onboarding/setup')
  }

  if (!business) redirect('/onboarding/setup')

  // Already active, go straight to complete
  if (
    business.subscription_status === 'active' ||
    (business.subscription_status === 'trialing' && business.stripe_subscription_id)
  ) {
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
