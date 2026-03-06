'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowRight } from 'lucide-react'
import { TRADE_LABELS } from '@/lib/utils'

const TRADES = Object.entries(TRADE_LABELS).map(([value, label]) => ({ value, label }))

const inputClass =
  'w-full px-4 py-3 bg-white border border-zinc-200 text-black placeholder-zinc-400 text-sm focus:outline-none focus:border-zinc-400 transition-colors'
const labelClass = 'block text-xs font-medium tracking-widest uppercase text-zinc-500 mb-2'

export const dynamic = 'force-dynamic'

export default function SignupPage() {
  const [formData, setFormData] = useState({
    businessName: '',
    ownerName: '',
    email: '',
    phone: '',
    trade: 'plumbing',
  })
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: formData.email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding/setup`,
        data: {
          business_name: formData.businessName,
          owner_name: formData.ownerName,
          owner_phone: formData.phone,
          trade: formData.trade,
        },
      },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="w-full max-w-md">
        <div className="border border-zinc-200 p-8 md:p-10 text-center">
          <div className="w-10 h-10 border border-zinc-300 flex items-center justify-center mx-auto mb-6">
            <svg className="w-4 h-4 text-zinc-600" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M1 4l7 5 7-5M1 4v8h14V4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="font-serif italic text-2xl text-black mb-3">Check your inbox</h1>
          <p className="text-zinc-500 text-sm mb-2 leading-relaxed">
            Magic link sent to{' '}
            <span className="font-medium text-black">{formData.email}</span>.
          </p>
          <p className="text-zinc-500 text-sm mb-6 leading-relaxed">
            Click it to verify and start setting up{' '}
            <span className="font-medium text-black">{formData.businessName}</span>.
          </p>
          <button
            onClick={() => setSent(false)}
            className="text-sm text-zinc-500 hover:text-black transition-colors underline"
          >
            Go back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md">
      <div className="border border-zinc-200 p-8 md:p-10">
        <div className="mb-8">
          <h1 className="font-serif italic text-3xl text-black mb-2">Create your account</h1>
          <p className="text-zinc-500 text-sm leading-relaxed">
            14-day free trial. No credit card required.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="businessName" className={labelClass}>
              Business name
            </label>
            <input
              id="businessName"
              name="businessName"
              type="text"
              value={formData.businessName}
              onChange={handleChange}
              placeholder="Mike's Plumbing Co."
              required
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="ownerName" className={labelClass}>
              Your name
            </label>
            <input
              id="ownerName"
              name="ownerName"
              type="text"
              value={formData.ownerName}
              onChange={handleChange}
              placeholder="Mike Johnson"
              required
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="email" className={labelClass}>
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="mike@mikesplumbing.com"
              required
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="phone" className={labelClass}>
              Your cell phone
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              placeholder="(619) 555-1234"
              required
              className={inputClass}
            />
            <p className="text-xs text-zinc-400 mt-1.5">
              We&apos;ll text you new leads here
            </p>
          </div>

          <div>
            <label htmlFor="trade" className={labelClass}>
              Trade type
            </label>
            <select
              id="trade"
              name="trade"
              value={formData.trade}
              onChange={handleChange}
              className={`${inputClass} cursor-pointer`}
            >
              {TRADES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <p className="text-sm text-red-600 border border-red-200 bg-red-50 px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black hover:bg-zinc-800 disabled:opacity-40 text-white text-xs font-medium tracking-widest uppercase py-3.5 flex items-center justify-center gap-2 transition-colors"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Continue
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <p className="text-xs text-center text-zinc-400">
            By signing up, you agree to our Terms of Service and Privacy Policy.
          </p>
        </form>

        <p className="text-center text-sm text-zinc-500 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-black font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
