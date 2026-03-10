import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe, STRIPE_PRICE_ID, PLAN } from '@/lib/stripe'
import { getAppUrl } from '@/lib/env'

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id, name, owner_email, stripe_customer_id')
      .eq('owner_id', user.id)
      .maybeSingle()

    if (businessError) {
      console.error('[billing/checkout] Failed to load business:', businessError)
      return NextResponse.json({ error: 'Failed to load business' }, { status: 500 })
    }

    if (!business) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

    if (!STRIPE_PRICE_ID) {
      console.error('[billing/checkout] STRIPE_PRICE_ID is not set')
      return NextResponse.json({ error: 'Billing is not configured' }, { status: 500 })
    }

    const origin = getAppUrl(request)

    let customerId = business.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: business.owner_email ?? user.email,
        name: business.name,
        metadata: {
          businessId: business.id,
          userId: user.id,
        },
      })
      customerId = customer.id

      const { error: updateError } = await supabase
        .from('businesses')
        .update({ stripe_customer_id: customerId })
        .eq('id', business.id)

      if (updateError) {
        console.error('[billing/checkout] Failed to persist Stripe customer:', updateError)
        return NextResponse.json({ error: 'Failed to prepare billing account' }, { status: 500 })
      }
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      subscription_data: {
        trial_period_days: PLAN.trialDays,
        metadata: {
          businessId: business.id,
        },
      },
      success_url: `${origin}/onboarding/complete?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/onboarding/payment`,
      metadata: {
        businessId: business.id,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[billing/checkout] Unhandled error:', err)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
