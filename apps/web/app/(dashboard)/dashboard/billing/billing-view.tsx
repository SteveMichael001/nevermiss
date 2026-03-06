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
  trialing: { label: 'Free Trial', className: 'text-blue-400 bg-blue-950/30 border-blue-900' },
  active: { label: 'Active', className: 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30' },
  past_due: { label: 'Past Due', className: 'text-yellow-400 bg-yellow-950/30 border-yellow-900' },
  canceled: { label: 'Canceled', className: 'text-red-400 bg-red-950/30 border-red-900' },
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
    <div className="min-h-screen bg-[#0A0A0A]">
      <div className="border-b border-[#1A1A1A] px-4 sm:px-8 py-6">
        <h1 className="text-xl font-extrabold text-[#FAFAFA]">Billing</h1>
        <p className="text-sm text-[#666666] mt-0.5">Manage your subscription and billing info</p>
      </div>

      <div className="px-4 sm:px-8 py-6 max-w-2xl space-y-4">
        {/* Plan card */}
        <div className="bg-[#111111] border border-[#1A1A1A] p-6 space-y-5">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-base font-bold text-[#FAFAFA]">NeverMiss AI</h2>
              <p className="text-sm text-[#666666] mt-0.5">AI phone answering for contractors</p>
            </div>
            <span
              className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold border ${statusConfig.className}`}
            >
              {statusConfig.label}
            </span>
          </div>

          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-extrabold text-[#FAFAFA] tabular-nums">$250</span>
            <span className="text-[#666666]">/month</span>
          </div>

          {business.subscription_status === 'trialing' && business.trial_ends_at && (
            <div className="flex items-center gap-2 bg-blue-950/30 border border-blue-900 px-3 py-2 text-sm text-blue-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              Free trial ends{' '}
              <strong className="text-blue-300">{formatDate(business.trial_ends_at)}</strong>. No charge until then.
            </div>
          )}

          {business.subscription_status === 'past_due' && (
            <div className="flex items-center gap-2 bg-yellow-950/30 border border-yellow-900 px-3 py-2 text-sm text-yellow-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              Payment failed. Update your card to restore service.
            </div>
          )}

          {business.subscription_status === 'canceled' && (
            <div className="flex items-center gap-2 bg-red-950/30 border border-red-900 px-3 py-2 text-sm text-red-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              Subscription canceled. AI answering is paused.
            </div>
          )}

          <ul className="space-y-2 pt-1">
            {FEATURES.map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm text-[#666666]">
                <svg
                  className="w-4 h-4 text-[#F59E0B] flex-shrink-0"
                  viewBox="0 0 16 16"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M2.5 8L6.5 12L13.5 4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {item}
              </li>
            ))}
          </ul>

          {business.stripe_customer_id && (
            <Button
              onClick={openBillingPortal}
              disabled={loadingPortal}
              variant="outline"
              className="flex items-center gap-2 border-[#1A1A1A] text-[#666666] hover:text-[#FAFAFA] hover:border-[#333] bg-transparent"
            >
              {loadingPortal ? (
                <span className="w-4 h-4 border-2 border-[#666666] border-t-[#FAFAFA] rounded-full animate-spin" />
              ) : (
                <CreditCard className="w-4 h-4" />
              )}
              Manage billing
              <ExternalLink className="w-3 h-3" />
            </Button>
          )}

          {!business.stripe_customer_id && business.subscription_status !== 'active' && (
            <Button
              asChild
              className="bg-[#F59E0B] hover:bg-[#D97706] text-[#0A0A0A] font-bold"
            >
              <a href="/onboarding/payment">Activate subscription</a>
            </Button>
          )}
        </div>

        {/* Usage stats */}
        <div className="bg-[#111111] border border-[#1A1A1A] p-6 space-y-4">
          <h3 className="font-bold text-[#FAFAFA] flex items-center gap-2 text-base">
            <BarChart3 className="w-5 h-5 text-[#F59E0B]" />
            Usage
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-[#0A0A0A] border border-[#1A1A1A]">
              <p className="text-3xl font-extrabold text-[#FAFAFA] tabular-nums">{todayCallCount}</p>
              <p className="text-sm text-[#666666] mt-1">Calls today</p>
            </div>
            <div className="text-center p-4 bg-[#0A0A0A] border border-[#1A1A1A]">
              <p className="text-3xl font-extrabold text-[#FAFAFA] tabular-nums">{monthCallCount}</p>
              <p className="text-sm text-[#666666] mt-1">Calls this month</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
