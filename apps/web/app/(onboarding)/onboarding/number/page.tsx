import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NumberView } from './number-view'

export const dynamic = 'force-dynamic'

export default async function NumberPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: business } = await supabase
    .from('businesses')
    .select('id, name, twilio_phone_number, owner_phone')
    .eq('owner_id', user.id)
    .single()

  if (!business) redirect('/onboarding/setup')

  return (
    <NumberView
      businessId={business.id}
      existingNumber={business.twilio_phone_number}
      ownerPhone={business.owner_phone}
    />
  )
}
