import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SettingsForm } from './settings-form'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: business } = await supabase
    .from('businesses')
    .select('*')
    .eq('owner_id', user.id)
    .single()

  if (!business) redirect('/onboarding/setup')

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <div className="border-b border-[#1A1A1A] px-4 sm:px-8 py-6">
        <h1 className="text-xl font-extrabold text-[#FAFAFA]">Settings</h1>
        <p className="text-sm text-[#666666] mt-0.5">
          Manage your AI answering service settings
        </p>
      </div>
      <div className="px-4 sm:px-8 py-6">
        <SettingsForm business={business} />
      </div>
    </div>
  )
}
