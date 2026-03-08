'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { OnboardingSteps } from '@/components/onboarding-steps'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const TRADES = [
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'hvac', label: 'HVAC' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'roofing', label: 'Roofing' },
  { value: 'general', label: 'General Contractor' },
]

interface SetupFormProps {
  businessId: string
  initialData: {
    business_name: string
    owner_name: string
    trade: string
    owner_phone: string
  }
}

export function SetupForm({ businessId, initialData }: SetupFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [businessName, setBusinessName] = useState(initialData.business_name)
  const [ownerName, setOwnerName] = useState(initialData.owner_name)
  const [trade, setTrade] = useState(initialData.trade || 'general')
  const [phone, setPhone] = useState(initialData.owner_phone)

  async function handleContinue() {
    if (!businessName.trim() || !ownerName.trim() || !phone.trim()) return

    setSaving(true)

    await fetch('/api/business', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: businessName.trim(),
        owner_name: ownerName.trim(),
        trade,
        owner_phone: phone.trim(),
      }),
    })

    router.push('/onboarding/number')
  }

  const isValid = businessName.trim() && ownerName.trim() && phone.trim()

  return (
    <div className="space-y-8">
      <OnboardingSteps currentStep={1} />

      <div>
        <p className="text-xs tracking-widest uppercase text-zinc-500 mb-3 font-sans">Step 1</p>
        <h1 className="font-serif italic text-3xl text-black mb-2">
          Tell us about your business
        </h1>
        <p className="text-zinc-500 text-sm leading-relaxed">
          We&apos;ll use this to personalize your AI receptionist.
        </p>
      </div>

      <div className="space-y-5">
        <div>
          <Label htmlFor="business_name" className="text-xs font-medium tracking-widest uppercase text-zinc-500 mb-2 block">
            Business name
          </Label>
          <Input
            id="business_name"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="e.g. Smith Plumbing"
            className="bg-white border-zinc-200 text-black placeholder-zinc-400 focus:border-zinc-400 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>

        <div>
          <Label htmlFor="owner_name" className="text-xs font-medium tracking-widest uppercase text-zinc-500 mb-2 block">
            Your name
          </Label>
          <Input
            id="owner_name"
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            placeholder="e.g. John Smith"
            className="bg-white border-zinc-200 text-black placeholder-zinc-400 focus:border-zinc-400 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>

        <div>
          <Label htmlFor="trade" className="text-xs font-medium tracking-widest uppercase text-zinc-500 mb-2 block">
            Trade
          </Label>
          <Select value={trade} onValueChange={setTrade}>
            <SelectTrigger className="bg-white border-zinc-200 text-black focus:ring-0 focus:ring-offset-0">
              <SelectValue placeholder="Select your trade" />
            </SelectTrigger>
            <SelectContent className="bg-white border-zinc-200">
              {TRADES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="phone" className="text-xs font-medium tracking-widest uppercase text-zinc-500 mb-2 block">
            Phone number
          </Label>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(555) 123-4567"
            className="bg-white border-zinc-200 text-black placeholder-zinc-400 focus:border-zinc-400 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          <p className="text-xs text-zinc-400 mt-1">
            We&apos;ll text you here when your AI captures a lead.
          </p>
        </div>
      </div>

      <button
        onClick={handleContinue}
        disabled={saving || !isValid}
        className="w-full bg-black hover:bg-zinc-800 disabled:opacity-40 text-white text-xs font-medium tracking-widest uppercase py-4 flex items-center justify-center gap-2 transition-colors"
      >
        {saving ? (
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            Continue
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </div>
  )
}
