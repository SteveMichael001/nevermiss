'use client'

import { useRouter } from 'next/navigation'
import { Phone } from 'lucide-react'
import { UrgencyBadge } from './urgency-badge'
import { formatPhone, formatTimeAgo } from '@/lib/utils'
import { LeadStatusSelect } from './lead-status-select'

interface Call {
  id: string
  created_at: string
  caller_name: string | null
  caller_phone: string | null
  service_needed: string | null
  urgency: string
  lead_status: string
}

interface CallLogTableProps {
  calls: Call[]
  onStatusChange?: (callId: string, status: string) => void
}

export function CallLogTable({ calls, onStatusChange }: CallLogTableProps) {
  const router = useRouter()

  function openCall(callId: string) {
    router.push(`/dashboard/calls/${callId}`)
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
            <th className="text-left text-xs font-medium text-zinc-400 uppercase tracking-widest py-3 px-4">
              Caller
            </th>
            <th className="text-left text-xs font-medium text-zinc-400 uppercase tracking-widest py-3 pr-4 hidden md:table-cell">
              Service Needed
            </th>
            <th className="text-left text-xs font-medium text-zinc-400 uppercase tracking-widest py-3 pr-4 whitespace-nowrap">
              Lead Status
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {calls.map((call) => (
            <tr
              key={call.id}
              className="hover:bg-zinc-50 cursor-pointer transition-colors"
              onClick={() => openCall(call.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  openCall(call.id)
                }
              }}
              tabIndex={0}
            >
              <td className="px-4 py-4 align-top">
                <div className="space-y-2">
                  <div>
                    <p className="text-base font-semibold text-black">
                      {call.caller_name ?? 'Unknown caller'}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5 text-sm text-zinc-500">
                      <Phone className="h-3.5 w-3.5" />
                      <span>{call.caller_phone ? formatPhone(call.caller_phone) : 'No phone captured'}</span>
                    </div>
                  </div>
                  <div className="md:hidden">
                    <p className="text-sm text-zinc-700">
                      {call.service_needed ?? 'Service need not captured'}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                    <UrgencyBadge urgency={call.urgency} />
                    <span>{formatTimeAgo(call.created_at)}</span>
                  </div>
                </div>
              </td>
              <td className="py-4 pr-4 align-top hidden md:table-cell">
                <p className="text-sm text-zinc-700 max-w-[320px] leading-relaxed">
                  {call.service_needed ?? 'Service need not captured'}
                </p>
              </td>
              <td className="py-4 pr-4 align-top" onClick={(event) => event.stopPropagation()}>
                <LeadStatusSelect
                  callId={call.id}
                  status={call.lead_status}
                  triggerClassName="border-0 bg-transparent px-0 shadow-none"
                  onSaved={(status) => onStatusChange?.(call.id, status)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
