'use client'

import { useState } from 'react'
import { CreditCard, BarChart3, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
  trialing: { label: 'Free Trial', className: 'text-blue-700 bg-blue-50 border-blue-200' },
  active: { label: 'Active', className: 'text-green-700 bg-green-50 border-green-200' },
  past_due: { label: 'Past Due', className: 'text-amber-700 bg-amber-50 border-amber-200' },
  canceled: { label: 'Canceled', className: 'text-red-700 bg-red-50 border-red-200' },
}

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
    <div className="min-h-screen">
      <div className="bg-white border-b border-gray-100 px-4 sm:px-8 py-6">
        <h1 className="text-xl font-bold text-gray-900">Billing</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your subscription and billing info</p>
      </div>

      <div className="px-4 sm:px-8 py-6 max-w-2xl space-y-6">
        {/* Plan card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>NeverMiss AI</CardTitle>
                <CardDescription className="mt-1">AI phone answering for contractors</CardDescription>
              </div>
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${statusConfig.className}`}
              >
                {statusConfig.label}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-gray-900">$250</span>
              <span className="text-gray-400">/month</span>
            </div>

            {business.subscription_status === 'trialing' && business.trial_ends_at && (
              <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-sm">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                Free trial ends{' '}
                <strong>{formatDate(business.trial_ends_at)}</strong>. No charge until then.
              </div>
            )}

            {business.subscription_status === 'past_due' && (
              <div className="flex items-center gap-2 bg-amber-50 text-amber-700 px-3 py-2 rounded-lg text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                Payment failed. Update your card to restore service.
              </div>
            )}

            {business.subscription_status === 'canceled' && (
              <div className="flex items-center gap-2 bg-red-50 text-red-700 px-3 py-2 rounded-lg text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                Your subscription is canceled. AI answering is paused.
              </div>
            )}

            <ul className="space-y-2 text-sm text-gray-600">
              {[
                'Unlimited calls — no per-minute charges',
                'Dedicated AI phone number',
                'Instant SMS + email notifications',
                'Full call recordings & transcripts',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-brand flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>

            {business.stripe_customer_id && (
              <Button
                onClick={openBillingPortal}
                disabled={loadingPortal}
                variant="outline"
                className="flex items-center gap-2"
              >
                {loadingPortal ? (
                  <span className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                ) : (
                  <CreditCard className="w-4 h-4" />
                )}
                Manage billing
                <ExternalLink className="w-3 h-3" />
              </Button>
            )}

            {!business.stripe_customer_id && business.subscription_status !== 'active' && (
              <Button asChild>
                <a href="/onboarding/payment">Activate subscription →</a>
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Usage stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-brand" />
              Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <p className="text-3xl font-extrabold text-gray-900">{todayCallCount}</p>
                <p className="text-sm text-gray-500 mt-1">Calls today</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <p className="text-3xl font-extrabold text-gray-900">{monthCallCount}</p>
                <p className="text-sm text-gray-500 mt-1">Calls this month</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
