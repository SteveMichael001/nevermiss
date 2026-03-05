'use client'

import { useState } from 'react'
import { Phone, Save, CheckCircle, Copy } from 'lucide-react'
import { formatPhone, TRADE_LABELS } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

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
    <div className="max-w-2xl space-y-6">
      {/* AI Phone Number */}
      {business.twilio_phone_number && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-brand" />
              Your AI Phone Number
            </CardTitle>
            <CardDescription>
              Forward your business number to this number to activate AI answering.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
              <span className="text-xl font-bold text-gray-900 flex-1">
                {formatPhone(business.twilio_phone_number)}
              </span>
              <button
                onClick={copyNumber}
                className="text-sm text-brand font-medium flex items-center gap-1.5 hover:underline"
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-4 h-4" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" /> Copy
                  </>
                )}
              </button>
            </div>
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium text-gray-700">Call forwarding setup:</p>
              <div className="grid sm:grid-cols-2 gap-2 text-sm text-gray-600">
                <div className="bg-gray-50 rounded-lg px-3 py-2">
                  <p className="font-medium text-gray-800 mb-0.5">iPhone</p>
                  <p>Settings → Phone → Call Forwarding</p>
                </div>
                <div className="bg-gray-50 rounded-lg px-3 py-2">
                  <p className="font-medium text-gray-800 mb-0.5">Android</p>
                  <p>Phone app → Settings → Call Forwarding</p>
                </div>
                <div className="bg-gray-50 rounded-lg px-3 py-2">
                  <p className="font-medium text-gray-800 mb-0.5">AT&T / T-Mobile</p>
                  <p>Dial <code className="bg-gray-200 px-1 rounded">*72 + number</code></p>
                </div>
                <div className="bg-gray-50 rounded-lg px-3 py-2">
                  <p className="font-medium text-gray-800 mb-0.5">Verizon</p>
                  <p>Dial <code className="bg-gray-200 px-1 rounded">*72 + number</code></p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Business Info */}
      <Card>
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <Label htmlFor="name">Business name</Label>
              <Input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="trade">Trade type</Label>
              <select
                id="trade"
                name="trade"
                value={form.trade}
                onChange={handleChange}
                className="mt-1.5 w-full px-3 py-2 border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-white"
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
                <Label htmlFor="owner_name">Your name</Label>
                <Input
                  id="owner_name"
                  name="owner_name"
                  value={form.owner_name}
                  onChange={handleChange}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="owner_phone">Your cell (gets SMS alerts)</Label>
                <Input
                  id="owner_phone"
                  name="owner_phone"
                  type="tel"
                  value={form.owner_phone}
                  onChange={handleChange}
                  className="mt-1.5"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="owner_email">Email</Label>
              <Input
                id="owner_email"
                name="owner_email"
                type="email"
                value={form.owner_email}
                onChange={handleChange}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="greeting_text">
                Custom greeting{' '}
                <span className="text-gray-400 font-normal">(optional)</span>
              </Label>
              <Textarea
                id="greeting_text"
                name="greeting_text"
                value={form.greeting_text}
                onChange={handleChange}
                placeholder={`Hi, thanks for calling ${form.name || 'us'}. We can't get to the phone right now, but I'd love to help...`}
                rows={3}
                className="mt-1.5"
              />
              <p className="text-xs text-gray-400 mt-1">
                Leave blank to use the default greeting for your trade.
              </p>
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}

            <Button type="submit" disabled={saving} className="flex items-center gap-2">
              {saving ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : saved ? (
                <>
                  <CheckCircle className="w-4 h-4" /> Saved!
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Save changes
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
