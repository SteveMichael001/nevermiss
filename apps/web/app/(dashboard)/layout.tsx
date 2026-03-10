import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar, MobileTopBar } from '@/components/sidebar'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get business info
  const { data: business, error } = await supabase
    .from('businesses')
    .select('name')
    .eq('owner_id', user.id)
    .maybeSingle()

  if (error) {
    console.error('[dashboard/layout] Failed to load business:', error)
  }

  return (
    <div className="min-h-screen bg-white">
      <Sidebar businessName={business?.name} />
      <MobileTopBar businessName={business?.name} />

      {/* Main content */}
      <main className="lg:pl-64 pt-14 lg:pt-0 pb-20 lg:pb-0">
        {children}
      </main>
    </div>
  )
}
