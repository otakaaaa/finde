import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@22.0.2?target=deno'

serve(async (req) => {
  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

  if (!stripeKey || !webhookSecret) {
    return new Response('Stripe configuration is incomplete', { status: 500 })
  }

  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return new Response('Missing stripe-signature header', { status: 400 })
  }

  const body = await req.text()
  const stripe = new Stripe(stripeKey)

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Webhook verification failed'
    return new Response(`Webhook Error: ${message}`, { status: 400 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  )

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode !== 'subscription' || !session.subscription) break

        const userId = session.metadata?.user_id
        if (!userId) break

        const subscription = await stripe.subscriptions.retrieve(
          typeof session.subscription === 'string'
            ? session.subscription
            : session.subscription.id,
        )

        const plan = determinePlan(subscription)

        await supabase.from('subscriptions').upsert(
          {
            user_id: userId,
            shop_id: null,  // ユーザープレミアム会員は shop_id を持たない
            stripe_subscription_id: subscription.id,
            stripe_customer_id: typeof subscription.customer === 'string'
              ? subscription.customer
              : subscription.customer.id,
            plan,
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            canceled_at: null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'stripe_subscription_id' },
        )
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const plan = determinePlan(subscription)

        await supabase
          .from('subscriptions')
          .update({
            plan,
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            canceled_at: subscription.canceled_at
              ? new Date(subscription.canceled_at * 1000).toISOString()
              : null,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            canceled_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        if (!invoice.subscription) break

        const subscriptionId = typeof invoice.subscription === 'string'
          ? invoice.subscription
          : invoice.subscription.id

        await supabase
          .from('subscriptions')
          .update({
            status: 'past_due',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscriptionId)
        break
      }

      default:
        break
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Handler error'
    return new Response(`Handler Error: ${message}`, { status: 500 })
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})

function determinePlan(subscription: Stripe.Subscription): 'monthly' | 'yearly' {
  const item = subscription.items.data[0]
  const interval = item?.price?.recurring?.interval
  return interval === 'year' ? 'yearly' : 'monthly'
}
