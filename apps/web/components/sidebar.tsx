'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Settings, CreditCard, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Calls', icon: LayoutDashboard },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  { href: '/dashboard/billing', label: 'Billing', icon: CreditCard },
]

interface SidebarProps {
  businessName?: string
}

export function Sidebar({ businessName }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="fixed top-0 left-0 h-full w-64 bg-[#0A0A0A] flex flex-col z-40 hidden lg:flex border-r border-[#1A1A1A]">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-[#1A1A1A]">
        <div className="min-w-0">
          <p className="text-[#FAFAFA] font-extrabold tracking-tight">NeverMiss</p>
          {businessName && (
            <p className="text-[#666666] text-xs truncate mt-0.5">{businessName}</p>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all rounded-md',
                isActive
                  ? 'bg-[#1A1A1A] text-[#F59E0B]'
                  : 'text-[#666666] hover:bg-[#1A1A1A] hover:text-[#FAFAFA]'
              )}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Sign out */}
      <div className="p-3 border-t border-[#1A1A1A]">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-[#666666] hover:bg-[#1A1A1A] hover:text-[#FAFAFA] transition-all rounded-md"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  )
}

// Mobile top bar
export function MobileTopBar({ businessName }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="lg:hidden">
      {/* Top header */}
      <div className="fixed top-0 left-0 right-0 h-14 bg-[#0A0A0A] border-b border-[#1A1A1A] flex items-center justify-between px-4 z-40">
        <span className="text-[#FAFAFA] font-extrabold tracking-tight text-sm">NeverMiss</span>
        <button
          onClick={handleSignOut}
          className="text-[#666666] hover:text-[#FAFAFA] p-1 transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0A0A0A] border-t border-[#1A1A1A] z-40">
        <div className="flex">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex-1 flex flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors',
                  isActive ? 'text-[#F59E0B]' : 'text-[#666666]'
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
