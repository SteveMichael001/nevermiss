import { cn, URGENCY_CONFIG } from '@/lib/utils'

interface UrgencyBadgeProps {
  urgency: string
  className?: string
}

export function UrgencyBadge({ urgency, className }: UrgencyBadgeProps) {
  const config = URGENCY_CONFIG[urgency as keyof typeof URGENCY_CONFIG] ?? URGENCY_CONFIG.unknown

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 text-xs font-medium border',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  )
}
