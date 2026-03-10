import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Settings, LayoutDashboard, Calendar } from 'lucide-react'
import { formatPhone } from '@/lib/utils'
import { OnboardingSteps } from '@/components/onboarding-steps'

export const dynamic = 'force-dynamic'

export default async function CompletePage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: business, error } = await supabase
    .from('businesses')
    .select('name, twilio_phone_number')
    .eq('owner_id', user.id)
    .maybeSingle()

  if (error) {
    console.error('[onboarding/complete/page] Failed to load business:', error)
    redirect('/onboarding/setup')
  }

  if (!business) redirect('/onboarding/setup')

  return (
    <div className="space-y-8">
      <OnboardingSteps currentStep={5} />

      {/* Success */}
      <div className="space-y-4">
        <div className="w-12 h-12 border border-zinc-200 flex items-center justify-center">
          <svg className="w-5 h-5 text-black" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M2.5 8L6.5 12L13.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="font-serif italic text-4xl text-black">You&apos;re live.</h1>
        <p className="text-zinc-500 max-w-md text-sm leading-relaxed">
          <strong className="text-black font-medium">{business.name}</strong> is now powered by AI.
          Every call you miss will be captured and texted to you instantly.
        </p>
      </div>

      {/* Number */}
      {business.twilio_phone_number && (
        <div className="border border-zinc-200 p-6 md:p-8">
          <p className="text-zinc-500 text-xs font-medium tracking-widest uppercase mb-3">
            Your AI number
          </p>
          <p className="font-serif text-3xl text-black mb-1 tabular-nums">
            {formatPhone(business.twilio_phone_number)}
          </p>
          <p className="text-zinc-500 text-sm">Missed calls forward here automatically.</p>
        </div>
      )}

      {/* What happens next */}
      <div className="space-y-3">
        <p className="text-xs font-medium tracking-widest uppercase text-zinc-500">
          What happens next
        </p>
        <div className="border border-zinc-200">
          {[
            'A customer calls your number.',
            'If you miss it, your AI picks up.',
            'AI has a natural conversation and captures their info.',
            'You get a text within 60 seconds: name, phone, issue.',
            'You call back and win the job.',
          ].map((text, i) => (
            <div key={text} className="flex items-start gap-4 px-5 py-3.5 border-b border-zinc-200 last:border-0">
              <span className="text-xs font-medium text-zinc-400 tabular-nums mt-0.5 w-4 flex-shrink-0">
                {String(i + 1).padStart(2, '0')}
              </span>
              <p className="text-sm text-black">{text}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="border border-zinc-200 p-6 md:p-8 space-y-4">
        <div className="space-y-2">
          <h2 className="font-serif italic text-2xl text-black">
            One last step - book your setup call
          </h2>
          <p className="text-zinc-500 max-w-lg text-sm leading-relaxed">
            Steve will walk you through the 2-minute forwarding setup. You&apos;ll be live same day.
          </p>
        </div>
        <Link
          href="https://calendly.com/stevenchranowski3/nevermissonboarding"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-3 w-full bg-black hover:bg-zinc-800 text-white text-xs font-medium tracking-widest uppercase py-4 transition-colors"
        >
          <Calendar className="w-4 h-4" />
          Book Your Setup Call
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* CTAs */}
      <div className="space-y-3">
        <Link
          href="/dashboard"
          className="flex items-center justify-center gap-3 w-full bg-black hover:bg-zinc-800 text-white text-xs font-medium tracking-widest uppercase py-4 transition-colors"
        >
          <LayoutDashboard className="w-4 h-4" />
          Go to Dashboard
          <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          href="/dashboard/settings"
          className="flex items-center justify-center gap-3 w-full border border-zinc-200 hover:border-zinc-400 text-zinc-500 hover:text-black text-xs font-medium tracking-widest uppercase py-4 transition-colors"
        >
          <Settings className="w-4 h-4" />
          Manage Settings
        </Link>
      </div>
    </div>
  )
}
