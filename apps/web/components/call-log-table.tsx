'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Phone } from 'lucide-react'
import { UrgencyBadge } from './urgency-badge'
import { AudioPlayer } from './audio-player'
import { formatDateTime, formatPhone, LEAD_STATUS_CONFIG } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'

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

interface CallLogTableProps {
  calls: Call[]
  onStatusChange?: (callId: string, status: string) => Promise<void>
}

const STATUS_OPTIONS = Object.entries(LEAD_STATUS_CONFIG).map(([value, config]) => ({
  value,
  label: config.label,
}))

export function CallLogTable({ calls, onStatusChange }: CallLogTableProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)

  async function handleStatusChange(callId: string, status: string) {
    if (!onStatusChange) return
    setUpdatingStatus(callId)
    await onStatusChange(callId, status)
    setUpdatingStatus(null)
  }

  if (calls.length === 0) {
    return (
      <div className="text-center py-20">
        <Phone className="w-10 h-10 text-zinc-200 mx-auto mb-4" />
        <p className="text-zinc-500 font-medium">No calls yet</p>
        <p className="text-sm text-zinc-400 mt-1">
          Calls will appear here once your AI starts answering.
        </p>
      </div>
    )
  }

  return (
    <div className="table-scroll">
      <table className="min-w-full">
        <thead>
          <tr className="border-b border-zinc-200">
            <th className="text-left text-xs font-medium text-zinc-400 uppercase tracking-widest py-3 pr-4 whitespace-nowrap">
              Date/Time
            </th>
            <th className="text-left text-xs font-medium text-zinc-400 uppercase tracking-widest py-3 pr-4 whitespace-nowrap">
              Caller
            </th>
            <th className="text-left text-xs font-medium text-zinc-400 uppercase tracking-widest py-3 pr-4 hidden sm:table-cell whitespace-nowrap">
              Phone
            </th>
            <th className="text-left text-xs font-medium text-zinc-400 uppercase tracking-widest py-3 pr-4 hidden md:table-cell">
              Issue
            </th>
            <th className="text-left text-xs font-medium text-zinc-400 uppercase tracking-widest py-3 pr-4 whitespace-nowrap">
              Urgency
            </th>
            <th className="text-left text-xs font-medium text-zinc-400 uppercase tracking-widest py-3 pr-4 whitespace-nowrap">
              Status
            </th>
            <th className="text-left text-xs font-medium text-zinc-400 uppercase tracking-widest py-3 hidden lg:table-cell whitespace-nowrap">
              Audio
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {calls.map((call) => (
            <>
              <tr
                key={call.id}
                className="hover:bg-zinc-50 cursor-pointer transition-colors"
                onClick={() => setExpandedRow(expandedRow === call.id ? null : call.id)}
              >
                <td className="py-4 pr-4 text-sm text-zinc-500 whitespace-nowrap">
                  {formatDateTime(call.created_at)}
                </td>
                <td className="py-4 pr-4">
                  <div className="flex items-center gap-2">
                    {expandedRow === call.id ? (
                      <ChevronUp className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                    )}
                    <span className="text-sm font-medium text-black">
                      {call.caller_name ?? 'Unknown'}
                    </span>
                  </div>
                </td>
                <td className="py-4 pr-4 text-sm text-zinc-500 hidden sm:table-cell whitespace-nowrap">
                  {call.caller_phone ? (
                    <a
                      href={`tel:${call.caller_phone}`}
                      className="flex items-center gap-1 hover:text-black transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Phone className="w-3 h-3" />
                      {formatPhone(call.caller_phone)}
                    </a>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="py-4 pr-4 text-sm text-zinc-500 hidden md:table-cell max-w-[200px] truncate">
                  {call.service_needed ?? '—'}
                </td>
                <td className="py-4 pr-4">
                  <UrgencyBadge urgency={call.urgency} />
                </td>
                <td className="py-4 pr-4" onClick={(e) => e.stopPropagation()}>
                  <Select
                    value={call.lead_status}
                    onValueChange={(val) => handleStatusChange(call.id, val)}
                    disabled={updatingStatus === call.id}
                  >
                    <SelectTrigger className="h-8 text-xs w-[120px] border-0 bg-transparent shadow-none focus:ring-0 px-0 text-black">
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
                </td>
                <td className="py-4 hidden lg:table-cell" onClick={(e) => e.stopPropagation()}>
                  {call.recording_url && (
                    <AudioPlayer callId={call.id} duration={call.duration_seconds ?? 0} />
                  )}
                </td>
              </tr>
              {expandedRow === call.id && (
                <tr key={`${call.id}-expanded`} className="bg-zinc-50">
                  <td colSpan={7} className="px-4 py-5">
                    <div className="space-y-4">
                      {/* Mobile: show hidden fields */}
                      <div className="grid grid-cols-2 gap-3 sm:hidden">
                        {call.caller_phone && (
                          <div>
                            <p className="text-xs font-medium text-zinc-400 uppercase tracking-widest mb-1">Phone</p>
                            <a
                              href={`tel:${call.caller_phone}`}
                              className="text-sm text-black font-medium hover:underline"
                            >
                              {formatPhone(call.caller_phone)}
                            </a>
                          </div>
                        )}
                        {call.service_needed && (
                          <div>
                            <p className="text-xs font-medium text-zinc-400 uppercase tracking-widest mb-1">Issue</p>
                            <p className="text-sm text-black">{call.service_needed}</p>
                          </div>
                        )}
                      </div>

                      {/* Audio on mobile */}
                      {call.recording_url && (
                        <div className="lg:hidden">
                          <p className="text-xs font-medium text-zinc-400 uppercase tracking-widest mb-2">
                            Recording
                          </p>
                          <AudioPlayer
                            callId={call.id}
                            duration={call.duration_seconds ?? 0}
                            className="max-w-sm"
                          />
                        </div>
                      )}

                      {/* Transcript */}
                      {call.full_transcript && (
                        <div>
                          <p className="text-xs font-medium text-zinc-400 uppercase tracking-widest mb-2">
                            Transcript
                          </p>
                          <div className="bg-white border border-zinc-200 p-4 max-h-48 overflow-y-auto">
                            <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap">
                              {call.full_transcript}
                            </p>
                          </div>
                        </div>
                      )}

                      {!call.full_transcript && (
                        <p className="text-sm text-zinc-400 italic">No transcript available</p>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  )
}
