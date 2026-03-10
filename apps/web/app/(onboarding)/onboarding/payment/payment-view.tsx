'use client'

import { useState } from 'react'
import { ArrowRight, Shield } from 'lucide-react'
import { OnboardingSteps } from '@/components/onboarding-steps'

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
      <OnboardingSteps currentStep={4} />

      <div>
        <p className="text-xs tracking-widest uppercase text-zinc-500 mb-3 font-sans">Step 4</p>
        <h1 className="font-serif italic text-3xl text-black mb-2">Start your free trial</h1>
        <p className="text-zinc-500 text-sm leading-relaxed">
          14 days free. First charge on{' '}
          <strong className="text-black font-medium">{trialEndDate}</strong>.
        </p>
      </div>

      {/* Plan card */}
      <div className="border border-zinc-200 p-8 md:p-10">
        <div className="flex items-baseline gap-2 mb-2">
          <span className="font-serif text-5xl text-black tabular-nums">$250</span>
          <span className="text-zinc-500 text-sm">/month</span>
        </div>
        <p className="text-zinc-500 text-sm mb-8">
          14-day free trial — first charge {trialEndDate}
        </p>

        <ul className="space-y-3">
          {FEATURES.map((item) => (
            <li key={item} className="flex items-start gap-3 text-sm text-zinc-600">
              <span className="text-zinc-300 mt-0.5 flex-shrink-0">—</span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Trust signal */}
      <div className="flex items-center justify-center gap-2 text-sm text-zinc-400">
        <Shield className="w-4 h-4" />
        <span>Secured by Stripe — PCI compliant</span>
      </div>

      {error && (
        <p className="text-sm text-red-600 border border-red-200 bg-red-50 px-3 py-2 text-center">
          {error}
        </p>
      )}

      <button
        onClick={handleCheckout}
        disabled={loading}
        className="w-full bg-black hover:bg-zinc-800 disabled:opacity-40 text-white text-xs font-medium tracking-widest uppercase py-4 flex items-center justify-center gap-2 transition-colors"
      >
        {loading ? (
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            Start Free Trial
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      <p className="text-center text-xs text-zinc-400">
        By starting a trial, you agree to our Terms of Service.
        You won&apos;t be charged until {trialEndDate}.
      </p>
    </div>
  )
}
