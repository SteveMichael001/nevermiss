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
      <OnboardingSteps currentStep={2} />

      <div>
        <p className="text-xs tracking-widest uppercase text-zinc-500 mb-3 font-sans">Step 2</p>
        <h1 className="font-serif italic text-3xl text-black mb-2">Your AI phone number</h1>
        <p className="text-zinc-500 text-sm leading-relaxed">
          Forward your existing number to this number to activate AI answering.
        </p>
      </div>

      {/* Phone number display */}
      <div className="border border-zinc-200 p-8 md:p-10 text-center">
        {provisioning ? (
          <div className="space-y-3">
            <div className="w-8 h-8 border-2 border-zinc-200 border-t-black rounded-full animate-spin mx-auto" />
            <p className="text-zinc-500 text-sm">Provisioning your number...</p>
          </div>
        ) : number ? (
          <div className="space-y-3">
            <p className="text-zinc-500 text-xs font-medium tracking-widest uppercase">
              Your AI answering number
            </p>
            <p className="text-4xl sm:text-5xl font-serif text-black tabular-nums">
              {formatPhone(number)}
            </p>
            <button
              onClick={copyNumber}
              className="inline-flex items-center gap-2 text-zinc-500 text-sm font-medium hover:text-black transition-colors"
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
            <p className="text-red-600 text-sm">{error}</p>
            <Button onClick={provisionNumber} variant="outline" size="sm">
              Try again
            </Button>
          </div>
        )}
      </div>

      {/* Instructions */}
      {number && (
        <div className="space-y-4">
          <h3 className="text-xs font-medium tracking-widest uppercase text-zinc-500">Set up call forwarding</h3>
          <p className="text-sm text-zinc-500 leading-relaxed">
            When your business number goes unanswered, calls will forward to your AI number.
          </p>

          <div className="grid sm:grid-cols-2 gap-px border border-zinc-200 bg-zinc-200">
            <div className="bg-white p-4">
              <div className="flex items-center gap-2 mb-2">
                <Phone className="w-3.5 h-3.5 text-zinc-400" />
                <p className="font-medium text-black text-sm">iPhone</p>
              </div>
              <ol className="text-xs text-zinc-500 space-y-1 list-decimal list-inside">
                <li>Open Settings</li>
                <li>Tap Phone</li>
                <li>Tap Call Forwarding</li>
                <li>Enter <strong className="text-black">{formatPhone(number)}</strong></li>
              </ol>
            </div>
            <div className="bg-white p-4">
              <div className="flex items-center gap-2 mb-2">
                <Phone className="w-3.5 h-3.5 text-zinc-400" />
                <p className="font-medium text-black text-sm">Android</p>
              </div>
              <ol className="text-xs text-zinc-500 space-y-1 list-decimal list-inside">
                <li>Open Phone app</li>
                <li>Tap menu → Settings</li>
                <li>Tap Call Forwarding</li>
                <li>Enter <strong className="text-black">{formatPhone(number)}</strong></li>
              </ol>
            </div>
            <div className="bg-white p-4">
              <div className="flex items-center gap-2 mb-2">
                <Phone className="w-3.5 h-3.5 text-zinc-400" />
                <p className="font-medium text-black text-sm">AT&T / T-Mobile</p>
              </div>
              <p className="text-xs text-zinc-500">
                Dial <code className="bg-zinc-100 px-1 font-mono text-black">*72{number}</code> to enable.{' '}
                Dial <code className="bg-zinc-100 px-1 font-mono text-black">*73</code> to disable.
              </p>
            </div>
            <div className="bg-white p-4">
              <div className="flex items-center gap-2 mb-2">
                <Phone className="w-3.5 h-3.5 text-zinc-400" />
                <p className="font-medium text-black text-sm">Verizon</p>
              </div>
              <p className="text-xs text-zinc-500">
                Dial <code className="bg-zinc-100 px-1 font-mono text-black">*72{number}</code> to enable.{' '}
                Dial <code className="bg-zinc-100 px-1 font-mono text-black">*73</code> to disable.
              </p>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => router.push('/onboarding/payment')}
        disabled={!number}
        className="w-full bg-black hover:bg-zinc-800 disabled:opacity-40 text-white text-xs font-medium tracking-widest uppercase py-4 flex items-center justify-center gap-2 transition-colors"
      >
        Continue
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  )
}
