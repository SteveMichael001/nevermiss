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
    <aside className="fixed top-0 left-0 h-full w-64 bg-white flex flex-col z-40 hidden lg:flex border-r border-zinc-200">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-zinc-200">
        <div className="min-w-0 flex items-center gap-2">
          <span className="font-sans font-medium text-sm tracking-widest uppercase text-black">NeverMiss</span>
          {/* Live indicator — AI aesthetic from grid/signal pattern */}
          <span className="flex items-center gap-1">
            <span className="live-dot w-1.5 h-1.5 bg-black rounded-full inline-block" />
          </span>
        </div>
      </div>
      {businessName && (
        <div className="px-6 py-2 border-b border-zinc-100">
          <p className="text-zinc-500 text-xs truncate">{businessName}</p>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all',
                isActive
                  ? 'bg-zinc-100 text-black'
                  : 'text-zinc-500 hover:bg-zinc-50 hover:text-black'
              )}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Sign out */}
      <div className="p-3 border-t border-zinc-200">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-zinc-500 hover:bg-zinc-50 hover:text-black transition-all"
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
      <div className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-zinc-200 flex items-center justify-between px-4 z-40">
        <span className="font-sans font-medium text-xs tracking-widest uppercase text-black">NeverMiss</span>
        <button
          onClick={handleSignOut}
          className="text-zinc-400 hover:text-black p-1 transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-200 z-40">
        <div className="flex">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex-1 flex flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors',
                  isActive ? 'text-black' : 'text-zinc-400'
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
