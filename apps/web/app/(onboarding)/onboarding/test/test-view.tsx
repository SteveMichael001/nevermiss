'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Phone, ArrowRight, CheckCircle } from 'lucide-react'
import { OnboardingSteps } from '@/components/onboarding-steps'
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

  const statusMessages: Record<TestStatus, { title: string; description: string }> = {
    waiting: {
      title: 'Waiting for your test call...',
      description: 'Call the number below from your phone right now.',
    },
    received: {
      title: 'Call received.',
      description: 'Your AI is answering...',
    },
    captured: {
      title: 'Lead captured.',
      description: 'Your AI successfully captured the caller\'s information.',
    },
    done: {
      title: 'It works.',
      description: 'Your AI is ready to answer calls.',
    },
  }

  const currentStatus = statusMessages[status]

  return (
    <div className="space-y-8">
      <OnboardingSteps currentStep={3} />

      <div>
        <p className="text-xs tracking-widest uppercase text-zinc-500 mb-3 font-sans">Step 3</p>
        <h1 className="font-serif italic text-3xl text-black mb-2">Test your AI number</h1>
        <p className="text-zinc-500 text-sm leading-relaxed">
          Call your AI number from your phone to hear it in action.
        </p>
      </div>

      {/* Call prompt */}
      <div className="border border-zinc-200 p-8 md:p-10 text-center space-y-4">
        <p className="text-zinc-500 text-xs font-medium tracking-widest uppercase">
          Call this number now
        </p>
        <p className="text-4xl sm:text-5xl font-serif text-black tabular-nums">
          {formatPhone(aiPhone)}
        </p>
        <a
          href={`tel:${aiPhone}`}
          className="inline-flex items-center gap-2 bg-black hover:bg-zinc-800 text-white text-xs font-medium tracking-widest uppercase px-6 py-3 transition-colors"
        >
          <Phone className="w-4 h-4" />
          Tap to call
        </a>
      </div>

      {/* Status indicator */}
      <div className="border border-zinc-200 p-6 text-center space-y-3">
        <p className={`font-medium text-base ${status === 'captured' || status === 'done' ? 'text-black' : 'text-zinc-600'}`}>
          {currentStatus.title}
        </p>
        <p className="text-sm text-zinc-500">{currentStatus.description}</p>

        {status === 'waiting' && (
          <div className="flex justify-center gap-1 mt-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 bg-zinc-300 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        )}

        {status === 'captured' && latestCall && (
          <div className="mt-4 bg-zinc-50 border border-zinc-200 p-4 text-left space-y-2">
            {latestCall.caller_name && (
              <div className="flex gap-2 text-sm">
                <span className="text-zinc-500 w-20">Caller:</span>
                <span className="font-medium text-black">{latestCall.caller_name}</span>
              </div>
            )}
            {latestCall.service_needed && (
              <div className="flex gap-2 text-sm">
                <span className="text-zinc-500 w-20">Needs:</span>
                <span className="font-medium text-black">{latestCall.service_needed}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <button
          onClick={() => router.push('/onboarding/payment')}
          disabled={false}
          className="w-full bg-black hover:bg-zinc-800 text-white text-xs font-medium tracking-widest uppercase py-4 flex items-center justify-center gap-2 transition-colors"
        >
          {status === 'captured' ? (
            <>
              <CheckCircle className="w-4 h-4" /> It works. Continue
              <ArrowRight className="w-4 h-4" />
            </>
          ) : (
            <>
              Skip test for now
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
        {status === 'waiting' && (
          <p className="text-center text-xs text-zinc-400">
            You can always test from your dashboard later.
          </p>
        )}
      </div>
    </div>
  )
}
