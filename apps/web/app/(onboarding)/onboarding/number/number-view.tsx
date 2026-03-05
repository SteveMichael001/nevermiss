'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Phone, Copy, CheckCircle, ArrowRight } from 'lucide-react'
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
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Your AI phone number</h1>
        <p className="text-gray-500">
          Forward your existing number to this number to activate AI answering.
        </p>
      </div>

      {/* Phone number display */}
      <div className="bg-[#0F172A] rounded-2xl p-8 text-center">
        {provisioning ? (
          <div className="space-y-3">
            <div className="w-12 h-12 border-4 border-brand/30 border-t-brand rounded-full animate-spin mx-auto" />
            <p className="text-gray-400 text-sm">Provisioning your number...</p>
          </div>
        ) : number ? (
          <div className="space-y-3">
            <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">
              Your AI answering number
            </p>
            <p className="text-4xl sm:text-5xl font-extrabold text-white">
              {formatPhone(number)}
            </p>
            <button
              onClick={copyNumber}
              className="inline-flex items-center gap-2 text-brand text-sm font-medium hover:underline"
            >
              {copied ? (
                <>
                  <CheckCircle className="w-4 h-4" /> Copied!
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
          <h3 className="font-semibold text-gray-900">Set up call forwarding</h3>
          <p className="text-sm text-gray-500">
            When your business number doesn&apos;t get answered, calls will forward to your AI number.
            Here&apos;s how to set it up:
          </p>

          <div className="grid sm:grid-cols-2 gap-3">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">📱</span>
                <p className="font-medium text-gray-800 text-sm">iPhone</p>
              </div>
              <ol className="text-xs text-gray-500 space-y-1 list-decimal list-inside">
                <li>Open Settings</li>
                <li>Tap Phone</li>
                <li>Tap Call Forwarding</li>
                <li>Enter <strong>{formatPhone(number)}</strong></li>
              </ol>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🤖</span>
                <p className="font-medium text-gray-800 text-sm">Android</p>
              </div>
              <ol className="text-xs text-gray-500 space-y-1 list-decimal list-inside">
                <li>Open Phone app</li>
                <li>Tap ⋮ Menu → Settings</li>
                <li>Tap Call Forwarding</li>
                <li>Enter <strong>{formatPhone(number)}</strong></li>
              </ol>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Phone className="w-4 h-4 text-gray-500" />
                <p className="font-medium text-gray-800 text-sm">AT&T / T-Mobile</p>
              </div>
              <p className="text-xs text-gray-500">
                Dial <code className="bg-gray-100 px-1 rounded font-mono">*72{number}</code> from your phone to enable.
                Dial <code className="bg-gray-100 px-1 rounded font-mono">*73</code> to disable.
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Phone className="w-4 h-4 text-gray-500" />
                <p className="font-medium text-gray-800 text-sm">Verizon</p>
              </div>
              <p className="text-xs text-gray-500">
                Dial <code className="bg-gray-100 px-1 rounded font-mono">*72{number}</code> from your phone to enable.
                Dial <code className="bg-gray-100 px-1 rounded font-mono">*73</code> to disable.
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
