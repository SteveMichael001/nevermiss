'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowRight, Mail } from 'lucide-react'
import { TRADE_LABELS } from '@/lib/utils'

const TRADES = Object.entries(TRADE_LABELS).map(([value, label]) => ({ value, label }))

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
        <div className="bg-[#111111] border border-[#1A1A1A] p-8 text-center">
          <div className="w-12 h-12 border border-[#F59E0B] flex items-center justify-center mx-auto mb-6">
            <Mail className="w-5 h-5 text-[#F59E0B]" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#FAFAFA] mb-3">Check your inbox</h1>
          <p className="text-[#666666] text-sm mb-2">
            Magic link sent to{' '}
            <span className="font-semibold text-[#FAFAFA]">{formData.email}</span>.
          </p>
          <p className="text-[#666666] text-sm mb-6">
            Click it to verify and start setting up{' '}
            <span className="font-semibold text-[#FAFAFA]">{formData.businessName}</span>.
          </p>
          <button
            onClick={() => setSent(false)}
            className="text-sm text-[#666666] hover:text-[#FAFAFA] transition-colors underline"
          >
            Go back
          </button>
        </div>
      </div>
    )
  }

  const inputClass =
    'w-full px-4 py-3 bg-[#0A0A0A] border border-[#1A1A1A] text-[#FAFAFA] placeholder-[#666666] text-sm focus:outline-none focus:border-[#F59E0B] transition-colors'
  const labelClass = 'block text-sm font-semibold text-[#FAFAFA] mb-2'

  return (
    <div className="w-full max-w-md">
      <div className="bg-[#111111] border border-[#1A1A1A] p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-[#FAFAFA] mb-2">Create your account</h1>
          <p className="text-[#666666] text-sm">
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
            <p className="text-xs text-[#666666] mt-1.5">
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
                <option key={t.value} value={t.value} className="bg-[#111111]">
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <p className="text-sm text-red-400 border border-red-900/50 bg-red-950/30 px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#F59E0B] hover:bg-[#D97706] disabled:opacity-40 text-[#0A0A0A] font-bold py-3 flex items-center justify-center gap-2 transition-colors text-sm"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-[#0A0A0A]/30 border-t-[#0A0A0A] rounded-full animate-spin" />
            ) : (
              <>
                Continue
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <p className="text-xs text-center text-[#666666]">
            By signing up, you agree to our Terms of Service and Privacy Policy.
          </p>
        </form>

        <p className="text-center text-sm text-[#666666] mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-[#F59E0B] font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
