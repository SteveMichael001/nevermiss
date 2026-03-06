'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Mail, ArrowRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }

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
          <p className="text-[#666666] text-sm mb-6">
            Magic link sent to{' '}
            <span className="font-semibold text-[#FAFAFA]">{email}</span>.
          </p>
          <button
            onClick={() => setSent(false)}
            className="text-sm text-[#666666] hover:text-[#FAFAFA] transition-colors underline"
          >
            Resend
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-[#111111] border border-[#1A1A1A] p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-[#FAFAFA] mb-2">Welcome back</h1>
          <p className="text-[#666666] text-sm">
            Enter your email to receive a magic sign-in link.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-[#FAFAFA] mb-2">
              Email address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Mail className="w-4 h-4 text-[#666666]" />
              </div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@yourbusiness.com"
                required
                className="w-full pl-10 pr-4 py-3 bg-[#0A0A0A] border border-[#1A1A1A] text-[#FAFAFA] placeholder-[#666666] text-sm focus:outline-none focus:border-[#F59E0B] transition-colors"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-400 border border-red-900/50 bg-red-950/30 px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !email}
            className="w-full bg-[#F59E0B] hover:bg-[#D97706] disabled:opacity-40 text-[#0A0A0A] font-bold py-3 flex items-center justify-center gap-2 transition-colors text-sm"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-[#0A0A0A]/30 border-t-[#0A0A0A] rounded-full animate-spin" />
            ) : (
              <>
                Send magic link
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-sm text-[#666666] mt-6">
          No account?{' '}
          <Link href="/signup" className="text-[#F59E0B] font-semibold hover:underline">
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  )
}
