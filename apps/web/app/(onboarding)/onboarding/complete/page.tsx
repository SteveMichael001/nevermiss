import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, ArrowRight, Settings, LayoutDashboard } from 'lucide-react'
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
        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-10 h-10 text-brand" />
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900">You&apos;re live! 🎉</h1>
        <p className="text-gray-500 max-w-md mx-auto">
          <strong>{business.name}</strong> is now powered by AI. Every call you can&apos;t answer
          will be captured and texted to you instantly.
        </p>
      </div>

      {/* Number */}
      {business.twilio_phone_number && (
        <div className="bg-[#0F172A] rounded-2xl p-6 text-center">
          <p className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-2">
            Your AI number
          </p>
          <p className="text-3xl font-extrabold text-white mb-1">
            {formatPhone(business.twilio_phone_number)}
          </p>
          <p className="text-slate-500 text-sm">Calls that go unanswered will be picked up by your AI</p>
        </div>
      )}

      {/* What happens next */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-900">What happens next:</h3>
        <div className="space-y-2">
          {[
            { emoji: '📞', text: 'A customer calls your number' },
            { emoji: '🤖', text: 'If you don\'t answer, your AI picks up' },
            { emoji: '💬', text: 'AI has a natural conversation and captures their info' },
            { emoji: '📱', text: 'You get an instant text with name, phone, and issue' },
            { emoji: '🏆', text: 'You call back, win the job' },
          ].map((item) => (
            <div key={item.text} className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 px-4 py-3">
              <span className="text-xl">{item.emoji}</span>
              <p className="text-sm text-gray-700">{item.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTAs */}
      <div className="space-y-3">
        <Link
          href="/dashboard"
          className="flex items-center justify-center gap-2 w-full bg-brand hover:bg-brand-dark text-white font-semibold py-3 rounded-xl transition-colors"
        >
          <LayoutDashboard className="w-4 h-4" />
          Go to Dashboard
          <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          href="/dashboard/settings"
          className="flex items-center justify-center gap-2 w-full bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium py-3 rounded-xl transition-colors text-sm"
        >
          <Settings className="w-4 h-4" />
          Manage Settings
        </Link>
      </div>
    </div>
  )
}
