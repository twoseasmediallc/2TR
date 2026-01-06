import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
})

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

const cryptoProvider = Stripe.createSubtleCryptoProvider()

serve(async (request) => {
  const signature = request.headers.get('Stripe-Signature')
  const body = await request.text()
  
  let receivedEvent
  try {
    receivedEvent = await stripe.webhooks.constructEventAsync(
      body,
      signature!,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!,
      undefined,
      cryptoProvider
    )
  } catch (err) {
    console.log(`⚠️  Webhook signature verification failed.`, err.message)
    return new Response(err.message, { status: 400 })
  }

  console.log(`🔔 Event received: ${receivedEvent.type}`)

  try {
    switch (receivedEvent.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(receivedEvent.data.object)
        break
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionChange(receivedEvent.data.object)
        break
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(receivedEvent.data.object)
        break
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(receivedEvent.data.object)
        break
      default:
        console.log(`Unhandled event type: ${receivedEvent.type}`)
    }
  } catch (error) {
    console.error('Error processing webhook:', error)
    return new Response('Webhook processing failed', { status: 500 })
  }

  return new Response('OK', { status: 200 })
})

async function handleCheckoutSessionCompleted(session: any) {
  console.log('Processing checkout session completed:', session.id)

  if (session.mode === 'payment') {
    // Handle one-time payment
    await supabase.from('stripe_orders').insert({
      checkout_session_id: session.id,
      payment_intent_id: session.payment_intent,
      customer_id: session.customer,
      amount_subtotal: session.amount_subtotal,
      amount_total: session.amount_total,
      currency: session.currency,
      payment_status: session.payment_status,
      status: 'completed',
    })
  } else if (session.mode === 'subscription') {
    // Handle subscription
    const subscription = await stripe.subscriptions.retrieve(session.subscription)
    await handleSubscriptionChange(subscription)
  }
}

async function handleSubscriptionChange(subscription: any) {
  console.log('Processing subscription change:', subscription.id)

  const paymentMethod = subscription.default_payment_method
    ? await stripe.paymentMethods.retrieve(subscription.default_payment_method)
    : null

  await supabase.from('stripe_subscriptions').upsert({
    customer_id: subscription.customer,
    subscription_id: subscription.id,
    price_id: subscription.items.data[0]?.price.id,
    current_period_start: subscription.current_period_start,
    current_period_end: subscription.current_period_end,
    cancel_at_period_end: subscription.cancel_at_period_end,
    payment_method_brand: paymentMethod?.card?.brand,
    payment_method_last4: paymentMethod?.card?.last4,
    status: subscription.status,
  })
}

async function handleSubscriptionDeleted(subscription: any) {
  console.log('Processing subscription deleted:', subscription.id)

  await supabase
    .from('stripe_subscriptions')
    .update({ deleted_at: new Date().toISOString() })
    .eq('subscription_id', subscription.id)
}

async function handleInvoicePaymentSucceeded(invoice: any) {
  console.log('Processing invoice payment succeeded:', invoice.id)

  if (invoice.subscription) {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription)
    await handleSubscriptionChange(subscription)
  }
}