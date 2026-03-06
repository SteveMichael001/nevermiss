'use client'

import { useState } from 'react'
import { CreditCard, BarChart3, AlertCircle, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'

interface Business {
  id: string
  name: string
  subscription_status: string
  trial_ends_at: string | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
}

interface BillingViewProps {
  business: Business
  monthCallCount: number
  todayCallCount: number
}

const STATUS_CONFIG = {
  trialing: { label: 'Free Trial', className: 'text-zinc-600 bg-zinc-100 border-zinc-300' },
  active: { label: 'Active', className: 'text-black bg-zinc-100 border-zinc-300' },
  past_due: { label: 'Past Due', className: 'text-zinc-700 bg-zinc-100 border-zinc-400' },
  canceled: { label: 'Canceled', className: 'text-red-600 bg-red-50 border-red-200' },
}

const FEATURES = [
  'Unlimited calls — no per-minute charges',
  'Dedicated AI phone number',
  'Instant SMS + email notifications',
  'Full call recordings and transcripts',
]

export function BillingView({ business, monthCallCount, todayCallCount }: BillingViewProps) {
  const [loadingPortal, setLoadingPortal] = useState(false)

  const statusConfig =
    STATUS_CONFIG[business.subscription_status as keyof typeof STATUS_CONFIG] ??
    STATUS_CONFIG.active

  async function openBillingPortal() {
    setLoadingPortal(true)
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingPortal(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-zinc-200 px-6 sm:px-8 py-8">
        <p className="text-xs tracking-widest uppercase text-zinc-500 mb-2 font-sans">Billing</p>
        <h1 className="font-serif italic text-3xl text-black">Subscription & usage</h1>
      </div>

      <div className="px-6 sm:px-8 py-8 max-w-2xl space-y-4">
        {/* Plan card */}
        <div className="border border-zinc-200 p-6 md:p-8 space-y-5">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-base font-medium text-black">NeverMiss AI</h2>
              <p className="text-sm text-zinc-500 mt-0.5">AI phone answering for contractors</p>
            </div>
            <span
              className={`inline-flex items-center px-2.5 py-1 text-xs font-medium border ${statusConfig.className}`}
            >
              {statusConfig.label}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="font-serif text-4xl text-black tabular-nums">$250</span>
            <span className="text-zinc-500 text-sm">/month</span>
          </div>

          {business.subscription_status === 'trialing' && business.trial_ends_at && (
            <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 px-3 py-2.5 text-sm text-zinc-600">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-zinc-400" />
              Free trial ends{' '}
              <strong className="text-black font-medium">{formatDate(business.trial_ends_at)}</strong>. No charge until then.
            </div>
          )}

          {business.subscription_status === 'past_due' && (
            <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-300 px-3 py-2.5 text-sm text-zinc-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              Payment failed. Update your card to restore service.
            </div>
          )}

          {business.subscription_status === 'canceled' && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-600">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              Subscription canceled. AI answering is paused.
            </div>
          )}

          <ul className="space-y-3 pt-1">
            {FEATURES.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-zinc-600">
                <span className="text-zinc-300 mt-0.5 flex-shrink-0">—</span>
                {item}
              </li>
            ))}
          </ul>

          {business.stripe_customer_id && (
            <button
              onClick={openBillingPortal}
              disabled={loadingPortal}
              className="inline-flex items-center gap-2 border border-zinc-200 hover:border-zinc-400 text-zinc-500 hover:text-black text-xs font-medium tracking-widest uppercase px-5 py-2.5 transition-colors disabled:opacity-40"
            >
              {loadingPortal ? (
                <span className="w-4 h-4 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin" />
              ) : (
                <CreditCard className="w-4 h-4" />
              )}
              Manage billing
              <ExternalLink className="w-3 h-3" />
            </button>
          )}

          {!business.stripe_customer_id && business.subscription_status !== 'active' && (
            <a
              href="/onboarding/payment"
              className="inline-flex items-center gap-2 bg-black hover:bg-zinc-800 text-white text-xs font-medium tracking-widest uppercase px-6 py-3 transition-colors"
            >
              Activate subscription
            </a>
          )}
        </div>

        {/* Usage stats */}
        <div className="border border-zinc-200 p-6 md:p-8 space-y-4">
          <h3 className="font-medium text-black flex items-center gap-2 text-sm">
            <BarChart3 className="w-4 h-4 text-zinc-400" />
            Usage
          </h3>
          <div className="grid grid-cols-2 gap-px border border-zinc-200 bg-zinc-200">
            <div className="text-center p-5 bg-white">
              <p className="font-serif text-4xl text-black tabular-nums">{todayCallCount}</p>
              <p className="text-sm text-zinc-500 mt-1">Calls today</p>
            </div>
            <div className="text-center p-5 bg-zinc-50">
              <p className="font-serif text-4xl text-black tabular-nums">{monthCallCount}</p>
              <p className="text-sm text-zinc-500 mt-1">Calls this month</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
