import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

const STEPS = [
  { id: 1, label: 'Sign Up' },
  { id: 2, label: 'Setup' },
  { id: 3, label: 'Your Number' },
  { id: 4, label: 'Test Call' },
  { id: 5, label: 'Payment' },
  { id: 6, label: 'Live' },
]

interface OnboardingStepsProps {
  currentStep: number
}

export function OnboardingSteps({ currentStep }: OnboardingStepsProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between relative">
        {/* Progress line */}
        <div className="absolute top-4 left-0 right-0 h-px bg-[#1A1A1A] -z-0">
          <div
            className="h-full bg-[#F59E0B] transition-all duration-500"
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
                  'w-8 h-8 border flex items-center justify-center text-xs font-bold transition-all',
                  isCompleted
                    ? 'bg-[#F59E0B] border-[#F59E0B] text-[#0A0A0A]'
                    : isCurrent
                    ? 'bg-[#0A0A0A] border-[#F59E0B] text-[#F59E0B]'
                    : 'bg-[#0A0A0A] border-[#1A1A1A] text-[#666666]'
                )}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : step.id}
              </div>
              <span
                className={cn(
                  'text-xs font-medium hidden sm:block',
                  isCurrent ? 'text-[#FAFAFA]' : 'text-[#666666]'
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
