'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Volume2 } from 'lucide-react'
import { OnboardingSteps } from '@/components/onboarding-steps'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface SetupFormProps {
  businessId: string
  businessName: string
  currentGreeting: string | null
  defaultGreeting: string
}

export function SetupForm({ businessId, businessName, currentGreeting, defaultGreeting }: SetupFormProps) {
  const router = useRouter()
  const [customGreeting, setCustomGreeting] = useState(currentGreeting ?? '')
  const [useCustom, setUseCustom] = useState(!!currentGreeting)
  const [saving, setSaving] = useState(false)

  const previewText = useCustom && customGreeting ? customGreeting : defaultGreeting

  async function handleContinue() {
    setSaving(true)

    await fetch('/api/business', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        greeting_text: useCustom ? customGreeting : null,
      }),
    })

    router.push('/onboarding/number')
  }

  return (
    <div className="space-y-8">
      <OnboardingSteps currentStep={2} />

      <div className="text-center">
        <h1 className="text-2xl font-extrabold text-[#FAFAFA] mb-2">
          Customize your greeting
        </h1>
        <p className="text-[#666666] text-sm">
          This is what callers hear when your AI answers. Use the default or write your own.
        </p>
      </div>

      {/* Preview */}
      <div className="bg-[#111111] border border-[#F59E0B]/30 p-6">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 border border-[#F59E0B]/30 flex items-center justify-center flex-shrink-0">
            <Volume2 className="w-4 h-4 text-[#F59E0B]" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[#F59E0B] uppercase tracking-wider mb-2">
              AI says:
            </p>
            <p className="text-[#FAFAFA] leading-relaxed italic text-sm">
              &ldquo;{previewText}&rdquo;
            </p>
          </div>
        </div>
      </div>

      {/* Customization */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setUseCustom(false)}
            className={`flex-1 py-3 px-4 border text-sm font-medium transition-all ${
              !useCustom
                ? 'border-[#F59E0B] bg-[#F59E0B]/10 text-[#F59E0B]'
                : 'border-[#1A1A1A] text-[#666666] hover:border-[#333]'
            }`}
          >
            Use default
          </button>
          <button
            onClick={() => setUseCustom(true)}
            className={`flex-1 py-3 px-4 border text-sm font-medium transition-all ${
              useCustom
                ? 'border-[#F59E0B] bg-[#F59E0B]/10 text-[#F59E0B]'
                : 'border-[#1A1A1A] text-[#666666] hover:border-[#333]'
            }`}
          >
            Write my own
          </button>
        </div>

        {useCustom && (
          <div>
            <Label htmlFor="custom_greeting" className="text-[#FAFAFA] text-sm font-semibold mb-2 block">
              Your custom greeting
            </Label>
            <Textarea
              id="custom_greeting"
              value={customGreeting}
              onChange={(e) => setCustomGreeting(e.target.value)}
              placeholder={`Hi, thanks for calling ${businessName}...`}
              rows={4}
              className="mt-1.5 bg-[#0A0A0A] border-[#1A1A1A] text-[#FAFAFA] placeholder-[#666666] focus:border-[#F59E0B]"
            />
            <p className="text-xs text-[#666666] mt-1">
              Keep it under 30 seconds when spoken (~75 words max).
            </p>
          </div>
        )}
      </div>

      <Button
        onClick={handleContinue}
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 py-3 text-base bg-[#F59E0B] hover:bg-[#D97706] text-[#0A0A0A] font-bold"
      >
        {saving ? (
          <span className="w-4 h-4 border-2 border-[#0A0A0A]/30 border-t-[#0A0A0A] rounded-full animate-spin" />
        ) : (
          <>
            Continue
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </Button>
    </div>
  )
}
