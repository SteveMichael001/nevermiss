import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TestView } from './test-view'

export const dynamic = 'force-dynamic'

export default async function TestPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: business } = await supabase
    .from('businesses')
    .select('id, twilio_phone_number')
    .eq('owner_id', user.id)
    .single()

  if (!business) redirect('/onboarding/setup')
  if (!business.twilio_phone_number) redirect('/onboarding/number')

  return (
    <TestView
      businessId={business.id}
      aiPhone={business.twilio_phone_number}
    />
  )
}
