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

  if (!signature) {
    return new Response('No signature', { status: 400 })
  }

  const body = await request.text()
  let receivedEvent

  try {
    receivedEvent = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!,
      undefined,
      cryptoProvider
    )
  } catch (err) {
    console.log(`Webhook signature verification failed.`, err.message)
    return new Response(`Webhook signature verification failed.`, { status: 400 })
  }

  console.log(`🔔 Webhook received: ${receivedEvent.type}`)

  try {
    switch (receivedEvent.type) {
      case 'checkout.session.completed': {
        const session = receivedEvent.data.object as Stripe.Checkout.Session
        
        if (session.mode === 'payment') {
          // Handle one-time payment
          await supabase.from('stripe_orders').insert({
            checkout_session_id: session.id,
            payment_intent_id: session.payment_intent as string,
            customer_id: session.customer as string,
            amount_subtotal: session.amount_subtotal || 0,
            amount_total: session.amount_total || 0,
            currency: session.currency || 'usd',
            payment_status: session.payment_status || 'unpaid',
            status: 'completed',
          })
        } else if (session.mode === 'subscription') {
          // Handle subscription
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
          
          await supabase.from('stripe_subscriptions').upsert({
            customer_id: session.customer as string,
            subscription_id: subscription.id,
            price_id: subscription.items.data[0]?.price.id,
            current_period_start: subscription.current_period_start,
            current_period_end: subscription.current_period_end,
            cancel_at_period_end: subscription.cancel_at_period_end,
            status: subscription.status,
          })
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = receivedEvent.data.object as Stripe.Subscription
        
        await supabase.from('stripe_subscriptions').upsert({
          customer_id: subscription.customer as string,
          subscription_id: subscription.id,
          price_id: subscription.items.data[0]?.price.id,
          current_period_start: subscription.current_period_start,
          current_period_end: subscription.current_period_end,
          cancel_at_period_end: subscription.cancel_at_period_end,
          status: subscription.status,
        })
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = receivedEvent.data.object as Stripe.Subscription
        
        await supabase.from('stripe_subscriptions').upsert({
          customer_id: subscription.customer as string,
          subscription_id: subscription.id,
          status: 'canceled',
        })
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = receivedEvent.data.object as Stripe.Invoice
        
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)
          
          await supabase.from('stripe_subscriptions').upsert({
            customer_id: invoice.customer as string,
            subscription_id: subscription.id,
            price_id: subscription.items.data[0]?.price.id,
            current_period_start: subscription.current_period_start,
            current_period_end: subscription.current_period_end,
            cancel_at_period_end: subscription.cancel_at_period_end,
            payment_method_brand: invoice.charge?.payment_method_details?.card?.brand,
            payment_method_last4: invoice.charge?.payment_method_details?.card?.last4,
            status: subscription.status,
          })
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${receivedEvent.type}`)
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return new Response(
      JSON.stringify({ error: 'Webhook processing failed' }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})