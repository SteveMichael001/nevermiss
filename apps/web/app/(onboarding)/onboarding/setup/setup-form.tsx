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

      <div>
        <p className="text-xs tracking-widest uppercase text-zinc-500 mb-3 font-sans">Step 2</p>
        <h1 className="font-serif italic text-3xl text-black mb-2">
          Customize your greeting
        </h1>
        <p className="text-zinc-500 text-sm leading-relaxed">
          This is what callers hear when your AI answers. Use the default or write your own.
        </p>
      </div>

      {/* Preview */}
      <div className="border border-zinc-200 p-6">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 border border-zinc-200 flex items-center justify-center flex-shrink-0">
            <Volume2 className="w-4 h-4 text-zinc-500" />
          </div>
          <div>
            <p className="text-xs font-medium tracking-widest uppercase text-zinc-500 mb-2">
              AI says:
            </p>
            <p className="text-black leading-relaxed italic text-sm">
              &ldquo;{previewText}&rdquo;
            </p>
          </div>
        </div>
      </div>

      {/* Customization */}
      <div className="space-y-4">
        <div className="flex items-center gap-0">
          <button
            onClick={() => setUseCustom(false)}
            className={`flex-1 py-3 px-4 border text-xs font-medium tracking-widest uppercase transition-all ${
              !useCustom
                ? 'border-black bg-black text-white'
                : 'border-zinc-200 text-zinc-500 hover:border-zinc-400'
            }`}
          >
            Use default
          </button>
          <button
            onClick={() => setUseCustom(true)}
            className={`flex-1 py-3 px-4 border text-xs font-medium tracking-widest uppercase transition-all ${
              useCustom
                ? 'border-black bg-black text-white'
                : 'border-zinc-200 text-zinc-500 hover:border-zinc-400'
            }`}
            style={{ marginLeft: '-1px' }}
          >
            Write my own
          </button>
        </div>

        {useCustom && (
          <div>
            <Label htmlFor="custom_greeting" className="text-xs font-medium tracking-widest uppercase text-zinc-500 mb-2 block">
              Your custom greeting
            </Label>
            <Textarea
              id="custom_greeting"
              value={customGreeting}
              onChange={(e) => setCustomGreeting(e.target.value)}
              placeholder={`Hi, thanks for calling ${businessName}...`}
              rows={4}
              className="mt-1.5 bg-white border-zinc-200 text-black placeholder-zinc-400 focus:border-zinc-400 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <p className="text-xs text-zinc-400 mt-1">
              Keep it under 30 seconds when spoken (~75 words max).
            </p>
          </div>
        )}
      </div>

      <button
        onClick={handleContinue}
        disabled={saving}
        className="w-full bg-black hover:bg-zinc-800 disabled:opacity-40 text-white text-xs font-medium tracking-widest uppercase py-4 flex items-center justify-center gap-2 transition-colors"
      >
        {saving ? (
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            Continue
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </div>
  )
}
