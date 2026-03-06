import { cn, LEAD_STATUS_CONFIG } from '@/lib/utils'

interface LeadStatusBadgeProps {
  status: string
  className?: string
}

export function LeadStatusBadge({ status, className }: LeadStatusBadgeProps) {
  const config = LEAD_STATUS_CONFIG[status as keyof typeof LEAD_STATUS_CONFIG] ?? {
    label: status,
    className: 'bg-[#1A1A1A] text-[#666666] border border-[#1A1A1A]',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 text-xs font-medium',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  )
}
