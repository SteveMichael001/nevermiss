'use client'

import { useState } from 'react'
import { CheckCircle, ArrowRight, Shield } from 'lucide-react'
import { OnboardingSteps } from '@/components/onboarding-steps'
import { Button } from '@/components/ui/button'

interface PaymentViewProps {
  businessId: string
  businessName: string
  trialEndDate: string
}

export function PaymentView({ businessId, businessName, trialEndDate }: PaymentViewProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleCheckout() {
    setLoading(true)
    setError('')

    const res = await fetch('/api/billing/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessId }),
    })

    const data = await res.json()

    if (data.url) {
      window.location.href = data.url
    } else {
      setError(data.error ?? 'Failed to start checkout. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <OnboardingSteps currentStep={5} />

      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Start your free trial</h1>
        <p className="text-gray-500">
          14 days free. Cancel anytime. First charge on{' '}
          <strong>{trialEndDate}</strong>.
        </p>
      </div>

      {/* Plan card */}
      <div className="bg-[#0F172A] rounded-2xl p-8">
        <div className="flex items-baseline gap-1 mb-2">
          <span className="text-4xl font-extrabold text-white">$250</span>
          <span className="text-slate-400">/month</span>
        </div>
        <p className="text-green-400 font-medium text-sm mb-6">
          14-day free trial · First charge {trialEndDate}
        </p>

        <ul className="space-y-3 mb-6">
          {[
            'Unlimited calls — no per-minute fees',
            'Dedicated AI phone number',
            'Instant SMS + email alerts',
            'Full recordings & transcripts',
            'Lead dashboard',
            'Cancel anytime',
          ].map((item) => (
            <li key={item} className="flex items-center gap-3 text-sm text-slate-300">
              <CheckCircle className="w-4 h-4 text-brand flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Trust signals */}
      <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
        <Shield className="w-4 h-4" />
        <span>Secured by Stripe · PCI compliant</span>
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg text-center">
          {error}
        </p>
      )}

      <Button
        onClick={handleCheckout}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-4 text-base"
      >
        {loading ? (
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            Start Free Trial
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </Button>

      <p className="text-center text-xs text-gray-400">
        By starting a trial, you agree to our Terms of Service.
        You won&apos;t be charged until {trialEndDate}.
      </p>
    </div>
  )
}
