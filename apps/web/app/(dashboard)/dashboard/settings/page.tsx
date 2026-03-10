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

  const { data: business, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('owner_id', user.id)
    .maybeSingle()

  if (error) {
    console.error('[dashboard/settings/page] Failed to load business:', error)
    redirect('/onboarding/setup')
  }

  if (!business) redirect('/onboarding/setup')

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-zinc-200 px-6 sm:px-8 py-8">
        <p className="text-xs tracking-widest uppercase text-zinc-500 mb-2 font-sans">Settings</p>
        <h1 className="font-serif italic text-3xl text-black">Manage your service</h1>
      </div>
      <div className="px-6 sm:px-8 py-8">
        <SettingsForm business={business} />
      </div>
    </div>
  )
}
