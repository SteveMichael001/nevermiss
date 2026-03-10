import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { sendWelcomeSMS } from '@/lib/notifications/sms'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/server'
import { getRequiredEnv } from '@/lib/env'

export const runtime = 'nodejs'

interface BusinessBillingRecord {
  id: string
  name: string
  owner_phone: string | null
  owner_name: string | null
  twilio_phone_number: string | null
  stripe_subscription_id: string | null
  subscription_status: string | null
  is_active: boolean | null
}

function ok() {
  return NextResponse.json({ received: true }, { status: 200 })
}

async function getBusiness(
  supabase: ReturnType<typeof createAdminClient>,
  businessId: string
): Promise<BusinessBillingRecord | null> {
  const { data, error } = await supabase
    .from('businesses')
    .select(
      'id, name, owner_phone, owner_name, twilio_phone_number, stripe_subscription_id, subscription_status, is_active'
    )
    .eq('id', businessId)
    .maybeSingle<BusinessBillingRecord>()

  if (error) {
    console.error('[stripe-webhook] Failed to load business:', error)
    return null
  }

  return data
}

async function updateBusiness(
  supabase: ReturnType<typeof createAdminClient>,
  businessId: string,
  updates: Record<string, unknown>
) {
  const { error } = await supabase.from('businesses').update(updates).eq('id', businessId)

  if (error) {
    console.error(`[stripe-webhook] Failed to update business ${businessId}:`, error)
  }
}

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')
  const webhookSecret = getRequiredEnv('STRIPE_WEBHOOK_SECRET', 'stripe-webhook')

  if (!signature || !webhookSecret) {
    console.error('[stripe-webhook] Missing signature or webhook secret')
    return ok()
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (error) {
    console.error('[stripe-webhook] Signature verification failed:', error)
    return ok()
  }

  const supabase = createAdminClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const businessId = session.metadata?.businessId

        if (!businessId || !session.subscription) {
          break
        }

        const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
        const existingBusiness = await getBusiness(supabase, businessId)

        if (!existingBusiness) {
          break
        }

        const isDuplicateActivation =
          existingBusiness.stripe_subscription_id === subscription.id &&
          existingBusiness.subscription_status === subscription.status &&
          existingBusiness.is_active === true

        if (!isDuplicateActivation) {
          await updateBusiness(supabase, businessId, {
            stripe_subscription_id: subscription.id,
            subscription_status: subscription.status,
            trial_ends_at: subscription.trial_end
              ? new Date(subscription.trial_end * 1000).toISOString()
              : null,
            is_active: true,
          })
        }

        const shouldSendWelcomeSms =
          !isDuplicateActivation &&
          !!existingBusiness.owner_phone &&
          !!existingBusiness.twilio_phone_number

        if (shouldSendWelcomeSms) {
          const welcomeResult = await sendWelcomeSMS({
            ownerPhone: existingBusiness.owner_phone as string,
            ownerName: existingBusiness.owner_name || 'there',
            twilioPhoneNumber: existingBusiness.twilio_phone_number as string,
          })

          if (!welcomeResult.success) {
            console.error(
              '[stripe-webhook] Welcome SMS failed:',
              welcomeResult.errors.join('; ')
            )
          }
        }

        break
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice
        if (!invoice.subscription) {
          break
        }

        const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
        const businessId = subscription.metadata?.businessId
        if (businessId) {
          await updateBusiness(supabase, businessId, {
            subscription_status: 'active',
            is_active: true,
          })
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        if (!invoice.subscription) {
          break
        }

        const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
        const businessId = subscription.metadata?.businessId
        if (businessId) {
          await updateBusiness(supabase, businessId, {
            subscription_status: 'past_due',
            is_active: false,
          })
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const businessId = subscription.metadata?.businessId
        if (businessId) {
          await updateBusiness(supabase, businessId, {
            subscription_status: 'canceled',
            is_active: false,
          })
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const businessId = subscription.metadata?.businessId
        if (businessId) {
          await updateBusiness(supabase, businessId, {
            subscription_status: subscription.status,
            trial_ends_at: subscription.trial_end
              ? new Date(subscription.trial_end * 1000).toISOString()
              : null,
          })
        }
        break
      }

      default:
        break
    }
  } catch (error) {
    console.error('[stripe-webhook] Unhandled handler error:', error)
  }

  return ok()
}
