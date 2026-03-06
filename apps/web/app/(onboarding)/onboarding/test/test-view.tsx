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

  const statusMessages: Record<TestStatus, { title: string; description: string; color: string }> = {
    waiting: {
      title: 'Waiting for your test call...',
      description: 'Call the number below from your phone right now.',
      color: 'text-[#666666]',
    },
    received: {
      title: 'Call received.',
      description: 'Your AI is answering...',
      color: 'text-blue-400',
    },
    captured: {
      title: 'Lead captured.',
      description: 'Your AI successfully captured the caller\'s information.',
      color: 'text-[#F59E0B]',
    },
    done: {
      title: 'It works.',
      description: 'Your AI is ready to answer calls.',
      color: 'text-[#F59E0B]',
    },
  }

  const currentStatus = statusMessages[status]

  return (
    <div className="space-y-8">
      <OnboardingSteps currentStep={4} />

      <div className="text-center">
        <h1 className="text-2xl font-extrabold text-[#FAFAFA] mb-2">Test your AI number</h1>
        <p className="text-[#666666] text-sm">Call your AI number from your phone to hear it in action.</p>
      </div>

      {/* Call prompt */}
      <div className="bg-[#111111] border border-[#1A1A1A] p-8 text-center space-y-4">
        <p className="text-[#666666] text-xs font-semibold uppercase tracking-[0.15em]">
          Call this number now
        </p>
        <p className="text-4xl sm:text-5xl font-extrabold text-[#FAFAFA] tabular-nums">
          {formatPhone(aiPhone)}
        </p>
        <a
          href={`tel:${aiPhone}`}
          className="inline-flex items-center gap-2 bg-[#F59E0B] hover:bg-[#D97706] text-[#0A0A0A] font-bold px-6 py-3 transition-colors text-sm"
        >
          <Phone className="w-4 h-4" />
          Tap to call
        </a>
      </div>

      {/* Status indicator */}
      <div className="bg-[#111111] border border-[#1A1A1A] p-6 text-center space-y-3">
        <p className={`font-bold text-lg ${currentStatus.color}`}>
          {currentStatus.title}
        </p>
        <p className="text-sm text-[#666666]">{currentStatus.description}</p>

        {status === 'waiting' && (
          <div className="flex justify-center gap-1 mt-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 bg-[#1A1A1A] rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        )}

        {status === 'captured' && latestCall && (
          <div className="mt-4 bg-[#0A0A0A] border border-[#1A1A1A] p-4 text-left space-y-2">
            {latestCall.caller_name && (
              <div className="flex gap-2 text-sm">
                <span className="text-[#666666] w-20">Caller:</span>
                <span className="font-medium text-[#FAFAFA]">{latestCall.caller_name}</span>
              </div>
            )}
            {latestCall.service_needed && (
              <div className="flex gap-2 text-sm">
                <span className="text-[#666666] w-20">Needs:</span>
                <span className="font-medium text-[#FAFAFA]">{latestCall.service_needed}</span>
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
              <CheckCircle className="w-5 h-5" /> It works. Continue
              <ArrowRight className="w-4 h-4" />
            </>
          ) : (
            <>
              Skip test for now
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
        {status === 'waiting' && (
          <p className="text-center text-xs text-[#666666]">
            You can always test from your dashboard later.
          </p>
        )}
      </div>
    </div>
  )
}
