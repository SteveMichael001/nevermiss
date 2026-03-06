'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowRight } from 'lucide-react'

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
        <div className="border border-zinc-200 p-8 md:p-10 text-center">
          <div className="w-10 h-10 border border-zinc-300 flex items-center justify-center mx-auto mb-6">
            <svg className="w-4 h-4 text-zinc-600" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M1 4l7 5 7-5M1 4v8h14V4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="font-serif italic text-2xl text-black mb-3">Check your inbox</h1>
          <p className="text-zinc-500 text-sm mb-6 leading-relaxed">
            Magic link sent to{' '}
            <span className="font-medium text-black">{email}</span>.
          </p>
          <button
            onClick={() => setSent(false)}
            className="text-sm text-zinc-500 hover:text-black transition-colors underline"
          >
            Resend
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md">
      <div className="border border-zinc-200 p-8 md:p-10">
        <div className="mb-8">
          <h1 className="font-serif italic text-3xl text-black mb-2">Welcome back</h1>
          <p className="text-zinc-500 text-sm leading-relaxed">
            Enter your email to receive a magic sign-in link.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-xs font-medium tracking-widest uppercase text-zinc-500 mb-2">
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@yourbusiness.com"
              required
              className="w-full px-4 py-3 bg-white border border-zinc-200 text-black placeholder-zinc-400 text-sm focus:outline-none focus:border-zinc-400 transition-colors"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 border border-red-200 bg-red-50 px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !email}
            className="w-full bg-black hover:bg-zinc-800 disabled:opacity-40 text-white text-xs font-medium tracking-widest uppercase py-3.5 flex items-center justify-center gap-2 transition-colors"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Send magic link
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-sm text-zinc-500 mt-6">
          No account?{' '}
          <Link href="/signup" className="text-black font-medium hover:underline">
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  )
}
