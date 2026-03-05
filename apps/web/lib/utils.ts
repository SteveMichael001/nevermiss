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
  emergency: { label: 'Emergency', emoji: '🔴', className: 'bg-red-100 text-red-700 border-red-200' },
  urgent: { label: 'Urgent', emoji: '🟡', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  routine: { label: 'Routine', emoji: '🟢', className: 'bg-green-100 text-green-700 border-green-200' },
  unknown: { label: 'Unknown', emoji: '⚪', className: 'bg-gray-100 text-gray-600 border-gray-200' },
}

export const LEAD_STATUS_CONFIG = {
  new: { label: 'New', className: 'bg-blue-100 text-blue-700' },
  called_back: { label: 'Called Back', className: 'bg-purple-100 text-purple-700' },
  booked: { label: 'Booked', className: 'bg-green-100 text-green-700' },
  lost: { label: 'Lost', className: 'bg-gray-100 text-gray-500' },
}
