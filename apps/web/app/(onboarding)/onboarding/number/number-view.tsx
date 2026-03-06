'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Phone, Copy, Check, ArrowRight } from 'lucide-react'
import { OnboardingSteps } from '@/components/onboarding-steps'
import { Button } from '@/components/ui/button'
import { formatPhone } from '@/lib/utils'

interface NumberViewProps {
  businessId: string
  existingNumber: string | null
  ownerPhone: string
}

export function NumberView({ businessId, existingNumber, ownerPhone }: NumberViewProps) {
  const router = useRouter()
  const [provisioning, setProvisioning] = useState(!existingNumber)
  const [number, setNumber] = useState(existingNumber)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!existingNumber) {
      provisionNumber()
    }
  }, [])

  async function provisionNumber() {
    setProvisioning(true)
    setError('')

    const res = await fetch('/api/onboarding/provision', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ areaCode: ownerPhone.replace(/\D/g, '').slice(0, 3) }),
    })

    const data = await res.json()

    if (res.ok && data.phoneNumber) {
      setNumber(data.phoneNumber)
    } else {
      setError(data.error ?? 'Failed to provision number. Please try again.')
    }

    setProvisioning(false)
  }

  async function copyNumber() {
    if (!number) return
    await navigator.clipboard.writeText(number)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-8">
      <OnboardingSteps currentStep={3} />

      <div className="text-center">
        <h1 className="text-2xl font-extrabold text-[#FAFAFA] mb-2">Your AI phone number</h1>
        <p className="text-[#666666] text-sm">
          Forward your existing number to this number to activate AI answering.
        </p>
      </div>

      {/* Phone number display */}
      <div className="bg-[#111111] border border-[#1A1A1A] p-8 text-center">
        {provisioning ? (
          <div className="space-y-3">
            <div className="w-10 h-10 border-2 border-[#1A1A1A] border-t-[#F59E0B] rounded-full animate-spin mx-auto" />
            <p className="text-[#666666] text-sm">Provisioning your number...</p>
          </div>
        ) : number ? (
          <div className="space-y-3">
            <p className="text-[#666666] text-xs font-semibold uppercase tracking-[0.15em]">
              Your AI answering number
            </p>
            <p className="text-4xl sm:text-5xl font-extrabold text-[#FAFAFA] tabular-nums">
              {formatPhone(number)}
            </p>
            <button
              onClick={copyNumber}
              className="inline-flex items-center gap-2 text-[#F59E0B] text-sm font-medium hover:underline"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" /> Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" /> Copy number
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-red-400 text-sm">{error}</p>
            <Button onClick={provisionNumber} variant="outline" size="sm">
              Try again
            </Button>
          </div>
        )}
      </div>

      {/* Instructions */}
      {number && (
        <div className="space-y-4">
          <h3 className="font-semibold text-[#FAFAFA] text-sm">Set up call forwarding</h3>
          <p className="text-sm text-[#666666]">
            When your business number goes unanswered, calls will forward to your AI number.
          </p>

          <div className="grid sm:grid-cols-2 gap-3">
            <div className="bg-[#111111] border border-[#1A1A1A] p-4">
              <div className="flex items-center gap-2 mb-2">
                <Phone className="w-4 h-4 text-[#666666]" />
                <p className="font-semibold text-[#FAFAFA] text-sm">iPhone</p>
              </div>
              <ol className="text-xs text-[#666666] space-y-1 list-decimal list-inside">
                <li>Open Settings</li>
                <li>Tap Phone</li>
                <li>Tap Call Forwarding</li>
                <li>Enter <strong className="text-[#FAFAFA]">{formatPhone(number)}</strong></li>
              </ol>
            </div>
            <div className="bg-[#111111] border border-[#1A1A1A] p-4">
              <div className="flex items-center gap-2 mb-2">
                <Phone className="w-4 h-4 text-[#666666]" />
                <p className="font-semibold text-[#FAFAFA] text-sm">Android</p>
              </div>
              <ol className="text-xs text-[#666666] space-y-1 list-decimal list-inside">
                <li>Open Phone app</li>
                <li>Tap menu → Settings</li>
                <li>Tap Call Forwarding</li>
                <li>Enter <strong className="text-[#FAFAFA]">{formatPhone(number)}</strong></li>
              </ol>
            </div>
            <div className="bg-[#111111] border border-[#1A1A1A] p-4">
              <div className="flex items-center gap-2 mb-2">
                <Phone className="w-4 h-4 text-[#666666]" />
                <p className="font-semibold text-[#FAFAFA] text-sm">AT&T / T-Mobile</p>
              </div>
              <p className="text-xs text-[#666666]">
                Dial <code className="bg-[#0A0A0A] px-1 font-mono text-[#FAFAFA]">*72{number}</code> to enable.{' '}
                Dial <code className="bg-[#0A0A0A] px-1 font-mono text-[#FAFAFA]">*73</code> to disable.
              </p>
            </div>
            <div className="bg-[#111111] border border-[#1A1A1A] p-4">
              <div className="flex items-center gap-2 mb-2">
                <Phone className="w-4 h-4 text-[#666666]" />
                <p className="font-semibold text-[#FAFAFA] text-sm">Verizon</p>
              </div>
              <p className="text-xs text-[#666666]">
                Dial <code className="bg-[#0A0A0A] px-1 font-mono text-[#FAFAFA]">*72{number}</code> to enable.{' '}
                Dial <code className="bg-[#0A0A0A] px-1 font-mono text-[#FAFAFA]">*73</code> to disable.
              </p>
            </div>
          </div>
        </div>
      )}

      <Button
        onClick={() => router.push('/onboarding/test')}
        disabled={!number}
        className="w-full flex items-center justify-center gap-2 py-3 text-base"
      >
        I&apos;ve set up call forwarding
        <ArrowRight className="w-4 h-4" />
      </Button>
    </div>
  )
}
