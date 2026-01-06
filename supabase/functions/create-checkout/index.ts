import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { priceId, priceIds, mode, userId, userEmail } = await req.json()

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    })

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get or create Stripe customer
    let customer
    const { data: existingCustomer } = await supabase
      .from('stripe_customers')
      .select('customer_id')
      .eq('user_id', userId)
      .single()

    if (existingCustomer) {
      customer = await stripe.customers.retrieve(existingCustomer.customer_id)
    } else {
      customer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          supabase_user_id: userId,
        },
      })

      await supabase.from('stripe_customers').insert({
        user_id: userId,
        customer_id: customer.id,
      })
    }

    // Create line items
    let line_items
    if (priceIds && Array.isArray(priceIds)) {
      // Multiple items (cart)
      const priceIdCounts = priceIds.reduce((acc: Record<string, number>, id: string) => {
        acc[id] = (acc[id] || 0) + 1
        return acc
      }, {})

      line_items = Object.entries(priceIdCounts).map(([price, quantity]) => ({
        price,
        quantity: quantity as number,
      }))
    } else {
      // Single item
      line_items = [
        {
          price: priceId,
          quantity: 1,
        },
      ]
    }

    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      line_items,
      mode,
      success_url: `${req.headers.get('origin')}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/`,
      automatic_tax: { enabled: true },
    })

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})