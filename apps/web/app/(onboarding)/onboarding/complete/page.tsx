import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Settings, LayoutDashboard, CheckCircle } from 'lucide-react'
import { formatPhone } from '@/lib/utils'
import { OnboardingSteps } from '@/components/onboarding-steps'

export const dynamic = 'force-dynamic'

export default async function CompletePage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: business } = await supabase
    .from('businesses')
    .select('name, twilio_phone_number')
    .eq('owner_id', user.id)
    .single()

  if (!business) redirect('/onboarding/setup')

  return (
    <div className="space-y-8">
      <OnboardingSteps currentStep={6} />

      {/* Success */}
      <div className="text-center space-y-4">
        <div className="w-16 h-16 border border-[#F59E0B] flex items-center justify-center mx-auto">
          <CheckCircle className="w-8 h-8 text-[#F59E0B]" />
        </div>
        <h1 className="text-3xl font-extrabold text-[#FAFAFA]">You&apos;re live.</h1>
        <p className="text-[#666666] max-w-md mx-auto text-sm leading-relaxed">
          <strong className="text-[#FAFAFA]">{business.name}</strong> is now powered by AI.
          Every call you miss will be captured and texted to you instantly.
        </p>
      </div>

      {/* Number */}
      {business.twilio_phone_number && (
        <div className="bg-[#111111] border border-[#1A1A1A] p-6 text-center">
          <p className="text-[#666666] text-xs font-semibold uppercase tracking-[0.15em] mb-3">
            Your AI number
          </p>
          <p className="text-3xl font-extrabold text-[#FAFAFA] mb-1 tabular-nums">
            {formatPhone(business.twilio_phone_number)}
          </p>
          <p className="text-[#666666] text-sm">Missed calls forward here automatically.</p>
        </div>
      )}

      {/* What happens next */}
      <div className="space-y-3">
        <h3 className="font-semibold text-[#FAFAFA] text-sm uppercase tracking-wider text-[#666666]">
          What happens next
        </h3>
        <div className="space-y-px border border-[#1A1A1A]">
          {[
            'A customer calls your number.',
            'If you miss it, your AI picks up.',
            'AI has a natural conversation and captures their info.',
            'You get a text within 60 seconds: name, phone, issue.',
            'You call back and win the job.',
          ].map((text, i) => (
            <div key={text} className="flex items-start gap-4 bg-[#111111] px-4 py-3 border-b border-[#1A1A1A] last:border-0">
              <span className="text-xs font-bold text-[#666666] tabular-nums mt-0.5 w-4 flex-shrink-0">
                {String(i + 1).padStart(2, '0')}
              </span>
              <p className="text-sm text-[#FAFAFA]">{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTAs */}
      <div className="space-y-3">
        <Link
          href="/dashboard"
          className="flex items-center justify-center gap-2 w-full bg-[#F59E0B] hover:bg-[#D97706] text-[#0A0A0A] font-bold py-3 transition-colors text-sm"
        >
          <LayoutDashboard className="w-4 h-4" />
          Go to Dashboard
          <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          href="/dashboard/settings"
          className="flex items-center justify-center gap-2 w-full border border-[#1A1A1A] hover:border-[#333] text-[#666666] hover:text-[#FAFAFA] font-medium py-3 transition-colors text-sm"
        >
          <Settings className="w-4 h-4" />
          Manage Settings
        </Link>
      </div>
    </div>
  )
}
