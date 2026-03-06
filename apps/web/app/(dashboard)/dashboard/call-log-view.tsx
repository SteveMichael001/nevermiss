'use client'

import { useState, useCallback } from 'react'
import { CallLogTable } from '@/components/call-log-table'
import { AlertCircle, Filter } from 'lucide-react'
import { formatPhone } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Call {
  id: string
  created_at: string
  caller_name: string | null
  caller_phone: string | null
  service_needed: string | null
  urgency: string
  lead_status: string
  full_transcript: string | null
  duration_seconds: number | null
  recording_url: string | null
}

interface CallLogViewProps {
  initialCalls: Call[]
  totalCount: number
  businessId: string
  businessPhone?: string | null
  subscriptionStatus?: string
}

export function CallLogView({
  initialCalls,
  totalCount,
  businessId,
  businessPhone,
  subscriptionStatus,
}: CallLogViewProps) {
  const [calls, setCalls] = useState<Call[]>(initialCalls)
  const [urgencyFilter, setUrgencyFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const filteredCalls = calls.filter((call) => {
    if (urgencyFilter !== 'all' && call.urgency !== urgencyFilter) return false
    if (statusFilter !== 'all' && call.lead_status !== statusFilter) return false
    return true
  })

  const handleStatusChange = useCallback(async (callId: string, status: string) => {
    const res = await fetch(`/api/calls/${callId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lead_status: status }),
    })

    if (res.ok) {
      setCalls((prev) =>
        prev.map((c) => (c.id === callId ? { ...c, lead_status: status } : c))
      )
    }
  }, [])

  const todayCount = calls.filter((c) => {
    const d = new Date(c.created_at)
    const today = new Date()
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    )
  }).length

  const newLeads = calls.filter((c) => c.lead_status === 'new').length
  const emergencies = calls.filter((c) => c.urgency === 'emergency' && c.lead_status === 'new').length

  return (
    <div className="min-h-screen bg-white">
      {/* Header — with subtle grid texture (AI aesthetic carried from landing) */}
      <div className="relative border-b border-zinc-200 px-6 sm:px-8 py-8 overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
        <div className="relative flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <p className="text-xs tracking-widest uppercase text-zinc-500 mb-2 font-sans">Call Log</p>
            <h1 className="font-serif italic text-3xl text-black leading-none">
              {totalCount} total calls
            </h1>
            {businessPhone && (
              <p className="text-sm text-zinc-500 mt-2">
                AI number:{' '}
                <a href={`tel:${businessPhone}`} className="text-black font-medium hover:underline">
                  {formatPhone(businessPhone)}
                </a>
              </p>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-px border border-zinc-200">
            <div className="text-center px-5 py-3 bg-white">
              <p className="text-2xl font-serif text-black tabular-nums">{todayCount}</p>
              <p className="text-xs text-zinc-500 mt-0.5">Today</p>
            </div>
            <div className="text-center px-5 py-3 bg-zinc-50 border-l border-zinc-200">
              <p className="text-2xl font-serif text-black tabular-nums">{newLeads}</p>
              <p className="text-xs text-zinc-500 mt-0.5">New</p>
            </div>
            {emergencies > 0 && (
              <div className="text-center px-5 py-3 bg-zinc-50 border-l border-zinc-200">
                <p className="text-2xl font-serif text-red-600 tabular-nums">{emergencies}</p>
                <p className="text-xs text-zinc-500 mt-0.5">Emergency</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Subscription warning */}
      {subscriptionStatus === 'past_due' && (
        <div className="mx-6 sm:mx-8 mt-4 flex items-center gap-3 bg-zinc-50 border border-zinc-300 px-4 py-3">
          <AlertCircle className="w-4 h-4 text-zinc-600 flex-shrink-0" />
          <p className="text-sm text-zinc-700">
            Your payment is past due. Please update your billing info to keep your service active.{' '}
            <a href="/dashboard/billing" className="font-medium underline text-black">
              Update billing
            </a>
          </p>
        </div>
      )}

      {subscriptionStatus === 'canceled' && (
        <div className="mx-6 sm:mx-8 mt-4 flex items-center gap-3 bg-zinc-50 border border-zinc-300 px-4 py-3">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-zinc-700">
            Your subscription is canceled. AI answering is paused.{' '}
            <a href="/dashboard/billing" className="font-medium underline text-black">
              Reactivate
            </a>
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="px-6 sm:px-8 py-4 border-b border-zinc-100">
        <div className="flex items-center gap-3">
          <Filter className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-xs tracking-widest uppercase text-zinc-400 font-medium">Filter</span>
          <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
            <SelectTrigger className="h-8 w-[130px] text-xs bg-white border-zinc-200 text-zinc-700">
              <SelectValue placeholder="Urgency" />
            </SelectTrigger>
            <SelectContent className="bg-white border-zinc-200">
              <SelectItem value="all">All urgencies</SelectItem>
              <SelectItem value="emergency">Emergency</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="routine">Routine</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 w-[130px] text-xs bg-white border-zinc-200 text-zinc-700">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-white border-zinc-200">
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="called_back">Called Back</SelectItem>
              <SelectItem value="booked">Booked</SelectItem>
              <SelectItem value="lost">Lost</SelectItem>
            </SelectContent>
          </Select>
          {(urgencyFilter !== 'all' || statusFilter !== 'all') && (
            <button
              onClick={() => { setUrgencyFilter('all'); setStatusFilter('all') }}
              className="text-xs text-zinc-400 hover:text-black underline transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="px-6 sm:px-8 py-6">
        <div className="border border-zinc-200">
          <CallLogTable calls={filteredCalls} onStatusChange={handleStatusChange} />
        </div>
      </div>
    </div>
  )
}
