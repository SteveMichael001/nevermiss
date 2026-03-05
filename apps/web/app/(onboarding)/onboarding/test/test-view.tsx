'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Phone, ArrowRight, CheckCircle } from 'lucide-react'
import { OnboardingSteps } from '@/components/onboarding-steps'
import { Button } from '@/components/ui/button'
import { formatPhone } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

type TestStatus = 'waiting' | 'received' | 'captured' | 'done'

interface TestViewProps {
  businessId: string
  aiPhone: string
}

export function TestView({ businessId, aiPhone }: TestViewProps) {
  const router = useRouter()
  const [status, setStatus] = useState<TestStatus>('waiting')
  const [latestCall, setLatestCall] = useState<{ caller_name?: string; service_needed?: string } | null>(null)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<string>(new Date().toISOString())

  useEffect(() => {
    // Poll for new calls
    const supabase = createClient()

    pollingRef.current = setInterval(async () => {
      const { data: calls } = await supabase
        .from('calls')
        .select('id, caller_name, service_needed, created_at')
        .eq('business_id', businessId)
        .gte('created_at', startTimeRef.current)
        .order('created_at', { ascending: false })
        .limit(1)

      if (calls && calls.length > 0) {
        const call = calls[0]
        setLatestCall(call)

        if (call.caller_name || call.service_needed) {
          setStatus('captured')
        } else {
          setStatus('received')
        }

        if (pollingRef.current) {
          clearInterval(pollingRef.current)
        }
      }
    }, 3000)

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [businessId])

  const statusMessages = {
    waiting: {
      emoji: '📞',
      title: 'Waiting for your test call...',
      description: 'Call the number below from your phone right now.',
      color: 'text-gray-500',
    },
    received: {
      emoji: '🎉',
      title: 'Call received!',
      description: 'Your AI is answering the call...',
      color: 'text-blue-600',
    },
    captured: {
      emoji: '✅',
      title: 'Lead captured!',
      description: 'Your AI successfully captured the caller\'s information.',
      color: 'text-brand',
    },
    done: {
      emoji: '✅',
      title: 'It works!',
      description: 'Your AI is ready to answer calls.',
      color: 'text-brand',
    },
  }

  const currentStatus = statusMessages[status]

  return (
    <div className="space-y-8">
      <OnboardingSteps currentStep={4} />

      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Test your AI number</h1>
        <p className="text-gray-500">Call your AI number from your phone to hear it in action.</p>
      </div>

      {/* Call prompt */}
      <div className="bg-[#0F172A] rounded-2xl p-8 text-center space-y-4">
        <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">
          Call this number now
        </p>
        <p className="text-4xl sm:text-5xl font-extrabold text-white">
          {formatPhone(aiPhone)}
        </p>
        <a
          href={`tel:${aiPhone}`}
          className="inline-flex items-center gap-2 bg-brand hover:bg-brand-dark text-white font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          <Phone className="w-5 h-5" />
          Tap to call
        </a>
      </div>

      {/* Status indicator */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center space-y-3">
        <div className="text-4xl">{currentStatus.emoji}</div>
        <p className={`font-semibold text-lg ${currentStatus.color}`}>
          {currentStatus.title}
        </p>
        <p className="text-sm text-gray-500">{currentStatus.description}</p>

        {status === 'waiting' && (
          <div className="flex justify-center gap-1 mt-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        )}

        {status === 'captured' && latestCall && (
          <div className="mt-4 bg-green-50 rounded-xl p-4 text-left space-y-2">
            {latestCall.caller_name && (
              <div className="flex gap-2 text-sm">
                <span className="text-gray-500 w-20">Caller:</span>
                <span className="font-medium text-gray-900">{latestCall.caller_name}</span>
              </div>
            )}
            {latestCall.service_needed && (
              <div className="flex gap-2 text-sm">
                <span className="text-gray-500 w-20">Needs:</span>
                <span className="font-medium text-gray-900">{latestCall.service_needed}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <Button
          onClick={() => router.push('/onboarding/payment')}
          className="w-full flex items-center justify-center gap-2 py-3 text-base"
        >
          {status === 'captured' ? (
            <>
              <CheckCircle className="w-5 h-5" /> It works! Continue →
            </>
          ) : (
            <>
              Skip test for now
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
        {status === 'waiting' && (
          <p className="text-center text-xs text-gray-400">
            You can always test from your dashboard later.
          </p>
        )}
      </div>
    </div>
  )
}
