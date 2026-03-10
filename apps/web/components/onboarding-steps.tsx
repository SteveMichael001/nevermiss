import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

const STEPS = [
  { id: 1, label: 'Business Setup' },
  { id: 2, label: 'Phone Number' },
  { id: 3, label: 'Test' },
  { id: 4, label: 'Payment' },
  { id: 5, label: 'Complete' },
]

interface OnboardingStepsProps {
  currentStep: number
}

export function OnboardingSteps({ currentStep }: OnboardingStepsProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between relative">
        {/* Progress line */}
        <div className="absolute top-4 left-0 right-0 h-px bg-zinc-200 -z-0">
          <div
            className="h-full bg-black transition-all duration-500"
            style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
          />
        </div>

        {STEPS.map((step) => {
          const isCompleted = step.id < currentStep
          const isCurrent = step.id === currentStep

          return (
            <div key={step.id} className="flex flex-col items-center gap-1.5 z-10">
              <div
                className={cn(
                  'w-8 h-8 border flex items-center justify-center text-xs font-medium transition-all',
                  isCompleted
                    ? 'bg-black border-black text-white'
                    : isCurrent
                    ? 'bg-white border-black text-black'
                    : 'bg-white border-zinc-200 text-zinc-400'
                )}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : step.id}
              </div>
              <span
                className={cn(
                  'text-xs font-medium hidden sm:block',
                  isCurrent ? 'text-black' : 'text-zinc-400'
                )}
              >
                {step.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
