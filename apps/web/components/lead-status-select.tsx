'use client'

import { useState } from 'react'
import { LEAD_STATUS_CONFIG, cn } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'

interface LeadStatusSelectProps {
  callId: string
  status: string
  className?: string
  triggerClassName?: string
  onSaved?: (status: string) => void
}

const STATUS_OPTIONS = Object.entries(LEAD_STATUS_CONFIG).map(([value, config]) => ({
  value,
  label: config.label,
}))

export function LeadStatusSelect({
  callId,
  status,
  className,
  triggerClassName,
  onSaved,
}: LeadStatusSelectProps) {
  const [value, setValue] = useState(status)
  const [saving, setSaving] = useState(false)

  async function handleChange(nextStatus: string) {
    setSaving(true)

    const res = await fetch(`/api/calls/${callId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead_status: nextStatus }),
    })

    if (res.ok) {
      setValue(nextStatus)
      onSaved?.(nextStatus)
    }

    setSaving(false)
  }

  return (
    <div className={className}>
      <Select value={value} onValueChange={handleChange} disabled={saving}>
        <SelectTrigger
          className={cn(
            'h-8 text-xs w-[132px] border-zinc-200 bg-white text-black shadow-none focus:ring-0',
            triggerClassName
          )}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-white border-zinc-200">
          {STATUS_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
