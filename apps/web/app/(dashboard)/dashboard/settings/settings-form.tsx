'use client'

import { useState } from 'react'
import { Phone, Save, Check, Copy } from 'lucide-react'
import { formatPhone, TRADE_LABELS } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface Business {
  id: string
  name: string
  trade: string
  owner_name: string
  owner_phone: string
  owner_email: string
  twilio_phone_number: string | null
  greeting_text: string | null
  notification_phones: string[] | null
  notification_emails: string[] | null
}

interface SettingsFormProps {
  business: Business
}

const inputClass = 'mt-1.5 bg-[#0A0A0A] border-[#1A1A1A] text-[#FAFAFA] placeholder-[#666666] focus:border-[#F59E0B] focus-visible:ring-0 focus-visible:ring-offset-0'
const labelClass = 'text-sm font-semibold text-[#FAFAFA]'

export function SettingsForm({ business }: SettingsFormProps) {
  const [form, setForm] = useState({
    name: business.name,
    trade: business.trade,
    owner_name: business.owner_name,
    owner_phone: business.owner_phone,
    owner_email: business.owner_email,
    greeting_text: business.greeting_text ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setSaved(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const res = await fetch('/api/business', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } else {
      const data = await res.json()
      setError(data.error ?? 'Failed to save')
    }

    setSaving(false)
  }

  async function copyNumber() {
    if (!business.twilio_phone_number) return
    await navigator.clipboard.writeText(business.twilio_phone_number)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="max-w-2xl space-y-4">
      {/* AI Phone Number */}
      {business.twilio_phone_number && (
        <div className="bg-[#111111] border border-[#1A1A1A] p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-[#F59E0B]" />
            <h2 className="font-bold text-[#FAFAFA] text-base">Your AI Phone Number</h2>
          </div>
          <p className="text-sm text-[#666666]">
            Forward your business number to this number to activate AI answering.
          </p>
          <div className="flex items-center gap-3 bg-[#0A0A0A] border border-[#1A1A1A] px-4 py-3">
            <span className="text-xl font-bold text-[#FAFAFA] flex-1 tabular-nums">
              {formatPhone(business.twilio_phone_number)}
            </span>
            <button
              onClick={copyNumber}
              className="text-sm text-[#F59E0B] font-medium flex items-center gap-1.5 hover:underline"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" /> Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" /> Copy
                </>
              )}
            </button>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-[#FAFAFA]">Call forwarding setup:</p>
            <div className="grid sm:grid-cols-2 gap-2 text-sm text-[#666666]">
              <div className="bg-[#0A0A0A] border border-[#1A1A1A] px-3 py-2">
                <p className="font-semibold text-[#FAFAFA] mb-0.5 text-xs uppercase tracking-wide">iPhone</p>
                <p className="text-xs">Settings → Phone → Call Forwarding</p>
              </div>
              <div className="bg-[#0A0A0A] border border-[#1A1A1A] px-3 py-2">
                <p className="font-semibold text-[#FAFAFA] mb-0.5 text-xs uppercase tracking-wide">Android</p>
                <p className="text-xs">Phone app → Settings → Call Forwarding</p>
              </div>
              <div className="bg-[#0A0A0A] border border-[#1A1A1A] px-3 py-2">
                <p className="font-semibold text-[#FAFAFA] mb-0.5 text-xs uppercase tracking-wide">AT&T / T-Mobile</p>
                <p className="text-xs">Dial <code className="bg-[#1A1A1A] px-1 text-[#FAFAFA]">*72 + number</code></p>
              </div>
              <div className="bg-[#0A0A0A] border border-[#1A1A1A] px-3 py-2">
                <p className="font-semibold text-[#FAFAFA] mb-0.5 text-xs uppercase tracking-wide">Verizon</p>
                <p className="text-xs">Dial <code className="bg-[#1A1A1A] px-1 text-[#FAFAFA]">*72 + number</code></p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Business Info */}
      <div className="bg-[#111111] border border-[#1A1A1A] p-6">
        <h2 className="font-bold text-[#FAFAFA] text-base mb-5">Business Information</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <Label htmlFor="name" className={labelClass}>Business name</Label>
            <Input
              id="name"
              name="name"
              value={form.name}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <div>
            <Label htmlFor="trade" className={labelClass}>Trade type</Label>
            <select
              id="trade"
              name="trade"
              value={form.trade}
              onChange={handleChange}
              className={`${inputClass} w-full px-3 py-2 border rounded-md text-sm focus:outline-none cursor-pointer`}
            >
              {Object.entries(TRADE_LABELS).map(([value, label]) => (
                <option key={value} value={value} className="bg-[#111111]">
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="owner_name" className={labelClass}>Your name</Label>
              <Input
                id="owner_name"
                name="owner_name"
                value={form.owner_name}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <Label htmlFor="owner_phone" className={labelClass}>Your cell (gets SMS alerts)</Label>
              <Input
                id="owner_phone"
                name="owner_phone"
                type="tel"
                value={form.owner_phone}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="owner_email" className={labelClass}>Email</Label>
            <Input
              id="owner_email"
              name="owner_email"
              type="email"
              value={form.owner_email}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <div>
            <Label htmlFor="greeting_text" className={labelClass}>
              Custom greeting{' '}
              <span className="text-[#666666] font-normal">(optional)</span>
            </Label>
            <Textarea
              id="greeting_text"
              name="greeting_text"
              value={form.greeting_text}
              onChange={handleChange}
              placeholder={`Hi, thanks for calling ${form.name || 'us'}. We can't get to the phone right now, but I'd love to help...`}
              rows={3}
              className={inputClass}
            />
            <p className="text-xs text-[#666666] mt-1">
              Leave blank to use the default greeting for your trade.
            </p>
          </div>

          {error && (
            <p className="text-sm text-red-400 border border-red-900/50 bg-red-950/30 px-3 py-2">{error}</p>
          )}

          <Button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-[#F59E0B] hover:bg-[#D97706] text-[#0A0A0A] font-bold"
          >
            {saving ? (
              <span className="w-4 h-4 border-2 border-[#0A0A0A]/30 border-t-[#0A0A0A] rounded-full animate-spin" />
            ) : saved ? (
              <>
                <Check className="w-4 h-4" /> Saved
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Save changes
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
