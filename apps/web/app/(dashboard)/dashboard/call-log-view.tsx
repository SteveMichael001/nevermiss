'use client'

import { useState, useCallback } from 'react'
import { CallLogTable } from '@/components/call-log-table'
import { Phone, AlertCircle, Filter } from 'lucide-react'
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
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 sm:px-8 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Call Log</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {totalCount} total calls
              {businessPhone && (
                <span className="ml-2">
                  · AI number:{' '}
                  <a href={`tel:${businessPhone}`} className="text-brand font-medium">
                    {formatPhone(businessPhone)}
                  </a>
                </span>
              )}
            </p>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3">
            <div className="text-center px-3 py-1.5 bg-blue-50 rounded-lg">
              <p className="text-lg font-bold text-blue-700">{todayCount}</p>
              <p className="text-xs text-blue-500">Today</p>
            </div>
            <div className="text-center px-3 py-1.5 bg-amber-50 rounded-lg">
              <p className="text-lg font-bold text-amber-700">{newLeads}</p>
              <p className="text-xs text-amber-500">New</p>
            </div>
            {emergencies > 0 && (
              <div className="text-center px-3 py-1.5 bg-red-50 rounded-lg">
                <p className="text-lg font-bold text-red-700">{emergencies}</p>
                <p className="text-xs text-red-500">🔴 Emergency</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Subscription warning */}
      {subscriptionStatus === 'past_due' && (
        <div className="mx-4 sm:mx-8 mt-4 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <p className="text-sm text-amber-700">
            Your payment is past due. Please update your billing info to keep your service active.{' '}
            <a href="/dashboard/billing" className="font-medium underline">
              Update billing →
            </a>
          </p>
        </div>
      )}

      {subscriptionStatus === 'canceled' && (
        <div className="mx-4 sm:mx-8 mt-4 flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">
            Your subscription is canceled. AI answering is paused.{' '}
            <a href="/dashboard/billing" className="font-medium underline">
              Reactivate →
            </a>
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="px-4 sm:px-8 py-4 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-500 font-medium">Filter:</span>
          <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
            <SelectTrigger className="h-8 w-[130px] text-xs">
              <SelectValue placeholder="Urgency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All urgencies</SelectItem>
              <SelectItem value="emergency">🔴 Emergency</SelectItem>
              <SelectItem value="urgent">🟡 Urgent</SelectItem>
              <SelectItem value="routine">🟢 Routine</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 w-[130px] text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
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
              className="text-xs text-gray-400 hover:text-gray-600 underline"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="px-4 sm:px-8 py-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6">
          <CallLogTable calls={filteredCalls} onStatusChange={handleStatusChange} />
        </div>
      </div>
    </div>
  )
}
