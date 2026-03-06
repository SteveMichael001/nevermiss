'use client'

import { useState } from 'react'
import { ArrowRight, Shield } from 'lucide-react'
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

  const FEATURES = [
    'Unlimited calls — no per-minute fees',
    'Dedicated AI phone number',
    'Instant SMS + email alerts',
    'Full recordings and transcripts',
    'Lead dashboard',
    'Cancel anytime',
  ]

  return (
    <div className="space-y-8">
      <OnboardingSteps currentStep={5} />

      <div className="text-center">
        <h1 className="text-2xl font-extrabold text-[#FAFAFA] mb-2">Start your free trial</h1>
        <p className="text-[#666666] text-sm">
          14 days free. First charge on{' '}
          <strong className="text-[#FAFAFA]">{trialEndDate}</strong>.
        </p>
      </div>

      {/* Plan card */}
      <div className="bg-[#111111] border border-[#1A1A1A] p-8">
        <div className="flex items-baseline gap-1 mb-2">
          <span className="text-4xl font-extrabold text-[#FAFAFA] tabular-nums">$250</span>
          <span className="text-[#666666]">/month</span>
        </div>
        <p className="text-[#F59E0B] font-medium text-sm mb-6">
          14-day free trial — first charge {trialEndDate}
        </p>

        <ul className="space-y-3">
          {FEATURES.map((item) => (
            <li key={item} className="flex items-center gap-3 text-sm text-[#FAFAFA]">
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
      </div>

      {/* Trust signals */}
      <div className="flex items-center justify-center gap-2 text-sm text-[#666666]">
        <Shield className="w-4 h-4" />
        <span>Secured by Stripe — PCI compliant</span>
      </div>

      {error && (
        <p className="text-sm text-red-400 border border-red-900/50 bg-red-950/30 px-3 py-2 text-center">
          {error}
        </p>
      )}

      <Button
        onClick={handleCheckout}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-4 text-base bg-[#F59E0B] hover:bg-[#D97706] text-[#0A0A0A] font-bold"
      >
        {loading ? (
          <span className="w-4 h-4 border-2 border-[#0A0A0A]/30 border-t-[#0A0A0A] rounded-full animate-spin" />
        ) : (
          <>
            Start Free Trial
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </Button>

      <p className="text-center text-xs text-[#666666]">
        By starting a trial, you agree to our Terms of Service.
        You won&apos;t be charged until {trialEndDate}.
      </p>
    </div>
  )
}
