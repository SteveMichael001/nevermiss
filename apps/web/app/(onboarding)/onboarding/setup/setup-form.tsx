'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Volume2 } from 'lucide-react'
import { OnboardingSteps } from '@/components/onboarding-steps'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'

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
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Customize your greeting
        </h1>
        <p className="text-gray-500">
          This is what callers hear when your AI answers. You can use the default or write your own.
        </p>
      </div>

      {/* Preview */}
      <Card className="border-brand border-2">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-brand/10 rounded-full flex items-center justify-center flex-shrink-0">
              <Volume2 className="w-4 h-4 text-brand" />
            </div>
            <div>
              <p className="text-xs font-semibold text-brand uppercase tracking-wider mb-1">
                AI says:
              </p>
              <p className="text-gray-700 leading-relaxed italic">
                &ldquo;{previewText}&rdquo;
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customization */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setUseCustom(false)}
            className={`flex-1 py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all ${
              !useCustom
                ? 'border-brand bg-green-50 text-brand'
                : 'border-gray-200 text-gray-500 hover:border-gray-300'
            }`}
          >
            Use default greeting
          </button>
          <button
            onClick={() => setUseCustom(true)}
            className={`flex-1 py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all ${
              useCustom
                ? 'border-brand bg-green-50 text-brand'
                : 'border-gray-200 text-gray-500 hover:border-gray-300'
            }`}
          >
            Write my own
          </button>
        </div>

        {useCustom && (
          <div>
            <Label htmlFor="custom_greeting">Your custom greeting</Label>
            <Textarea
              id="custom_greeting"
              value={customGreeting}
              onChange={(e) => setCustomGreeting(e.target.value)}
              placeholder={`Hi, thanks for calling ${businessName}...`}
              rows={4}
              className="mt-1.5"
            />
            <p className="text-xs text-gray-400 mt-1">
              Keep it under 30 seconds when spoken (~75 words max).
            </p>
          </div>
        )}
      </div>

      <Button
        onClick={handleContinue}
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 py-3 text-base"
      >
        {saving ? (
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
