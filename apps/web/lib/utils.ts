import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    const num = cleaned.slice(1)
    return `(${num.slice(0, 3)}) ${num.slice(3, 6)}-${num.slice(6)}`
  }
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }
  return phone
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export function formatDuration(seconds: number): string {
  if (!seconds) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export const TRADE_LABELS: Record<string, string> = {
  plumbing: 'Plumbing',
  hvac: 'HVAC',
  electrical: 'Electrical',
  roofing: 'Roofing',
  pest_control: 'Pest Control',
  landscaping: 'Landscaping',
  general: 'General',
}

export const URGENCY_CONFIG = {
  emergency: { label: 'Emergency', className: 'bg-red-50 text-red-600 border-red-200' },
  urgent: { label: 'Urgent', className: 'bg-zinc-100 text-zinc-700 border-zinc-300' },
  routine: { label: 'Routine', className: 'bg-white text-zinc-500 border-zinc-200' },
  unknown: { label: 'Unknown', className: 'bg-white text-zinc-400 border-zinc-200' },
}

export const LEAD_STATUS_CONFIG = {
  new: { label: 'New', className: 'bg-black text-white border border-black' },
  called_back: { label: 'Called Back', className: 'bg-zinc-100 text-zinc-700 border border-zinc-300' },
  booked: { label: 'Booked', className: 'bg-zinc-900 text-white border border-zinc-900' },
  lost: { label: 'Lost', className: 'bg-white text-zinc-400 border border-zinc-200' },
}
