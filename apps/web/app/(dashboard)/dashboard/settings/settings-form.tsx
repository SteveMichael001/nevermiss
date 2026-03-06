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

const inputClass = 'mt-1.5 bg-white border-zinc-200 text-black placeholder-zinc-400 focus:border-zinc-400 focus-visible:ring-0 focus-visible:ring-offset-0'
const labelClass = 'text-xs font-medium tracking-widest uppercase text-zinc-500'

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
        <div className="border border-zinc-200 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-zinc-400" />
            <h2 className="font-medium text-black text-sm">Your AI Phone Number</h2>
          </div>
          <p className="text-sm text-zinc-500">
            Forward your business number to this number to activate AI answering.
          </p>
          <div className="flex items-center gap-3 bg-zinc-50 border border-zinc-200 px-4 py-3">
            <span className="text-xl font-serif text-black flex-1 tabular-nums">
              {formatPhone(business.twilio_phone_number)}
            </span>
            <button
              onClick={copyNumber}
              className="text-xs font-medium text-zinc-500 flex items-center gap-1.5 hover:text-black transition-colors"
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
            <p className="text-xs font-medium tracking-widest uppercase text-zinc-500">Call forwarding setup</p>
            <div className="grid sm:grid-cols-2 gap-px border border-zinc-200 bg-zinc-200">
              <div className="bg-white px-3 py-2.5">
                <p className="font-medium text-black mb-0.5 text-xs uppercase tracking-wide">iPhone</p>
                <p className="text-xs text-zinc-500">Settings → Phone → Call Forwarding</p>
              </div>
              <div className="bg-white px-3 py-2.5">
                <p className="font-medium text-black mb-0.5 text-xs uppercase tracking-wide">Android</p>
                <p className="text-xs text-zinc-500">Phone app → Settings → Call Forwarding</p>
              </div>
              <div className="bg-white px-3 py-2.5">
                <p className="font-medium text-black mb-0.5 text-xs uppercase tracking-wide">AT&T / T-Mobile</p>
                <p className="text-xs text-zinc-500">Dial <code className="bg-zinc-100 px-1 text-black">*72 + number</code></p>
              </div>
              <div className="bg-white px-3 py-2.5">
                <p className="font-medium text-black mb-0.5 text-xs uppercase tracking-wide">Verizon</p>
                <p className="text-xs text-zinc-500">Dial <code className="bg-zinc-100 px-1 text-black">*72 + number</code></p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Business Info */}
      <div className="border border-zinc-200 p-6">
        <h2 className="font-medium text-black text-sm mb-5">Business Information</h2>
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
              className={`${inputClass} w-full px-3 py-2 border rounded-none text-sm focus:outline-none cursor-pointer`}
            >
              {Object.entries(TRADE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
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
              <span className="text-zinc-400 font-normal normal-case tracking-normal">(optional)</span>
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
            <p className="text-xs text-zinc-400 mt-1">
              Leave blank to use the default greeting for your trade.
            </p>
          </div>

          {error && (
            <p className="text-sm text-red-600 border border-red-200 bg-red-50 px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 bg-black hover:bg-zinc-800 disabled:opacity-40 text-white text-xs font-medium tracking-widest uppercase px-6 py-3 transition-colors"
          >
            {saving ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : saved ? (
              <>
                <Check className="w-4 h-4" /> Saved
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Save changes
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
