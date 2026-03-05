import Stripe from 'stripe'

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) throw new Error('STRIPE_SECRET_KEY is not set')
    _stripe = new Stripe(key, {
      apiVersion: '2025-02-24.acacia',
    })
  }
  return _stripe
}

// Convenience export for direct use in route handlers
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return getStripe()[prop as keyof Stripe]
  },
})

export const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID ?? ''

export const PLAN = {
  name: 'NeverMiss AI',
  price: 250,
  interval: 'month',
  trialDays: 14,
}
