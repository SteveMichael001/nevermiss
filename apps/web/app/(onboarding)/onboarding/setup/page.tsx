import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SetupForm } from './setup-form'

export const dynamic = 'force-dynamic'

const DEFAULT_GREETINGS: Record<string, string> = {
  plumbing: "Hi, thanks for calling {business}. We can't get to the phone right now, but I'd love to help. Can I get your name and what you need help with?",
  hvac: "Hi, thanks for calling {business}. We can't get to the phone right now, but I'd love to help. Can I get your name and what you need help with?",
  electrical: "Hi, thanks for calling {business}. We can't get to the phone right now, but I'd love to help. Can I get your name and what you need help with?",
  roofing: "Hi, thanks for calling {business}. We can't get to the phone right now, but I'd love to help. Can I get your name and what you need help with?",
  pest_control: "Hi, thanks for calling {business}. We can't get to the phone right now, but I'd love to help. Can I get your name and what you need help with?",
  general: "Hi, thanks for calling {business}. We can't get to the phone right now, but I'd love to help. Can I get your name and what you need help with?",
}

export default async function SetupPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Check if business exists
  let { data: business } = await supabase
    .from('businesses')
    .select('*')
    .eq('owner_id', user.id)
    .single()

  // Create business record from user metadata if it doesn't exist
  if (!business) {
    const meta = user.user_metadata ?? {}
    const { data: newBusiness, error } = await supabase
      .from('businesses')
      .insert({
        owner_id: user.id,
        name: meta.business_name ?? 'My Business',
        owner_name: meta.owner_name ?? '',
        owner_phone: meta.owner_phone ?? '',
        owner_email: user.email ?? '',
        trade: meta.trade ?? 'general',
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to create business:', error)
    }
    business = newBusiness
  }

  if (!business) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500">Failed to load business. Please try again.</p>
      </div>
    )
  }

  const defaultGreeting = DEFAULT_GREETINGS[business.trade] ?? DEFAULT_GREETINGS.general
  const previewGreeting = defaultGreeting.replace('{business}', business.name)

  return (
    <SetupForm
      businessId={business.id}
      businessName={business.name}
      currentGreeting={business.greeting_text}
      defaultGreeting={previewGreeting}
    />
  )
}
