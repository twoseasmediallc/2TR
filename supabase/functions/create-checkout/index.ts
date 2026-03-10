import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';
import Stripe from 'npm:stripe@14.21.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { priceId, priceIds, mode, userId, userEmail } = await req.json();

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
    });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let customer;

    if (userId) {
      const { data: existingCustomer, error: customerError } = await supabase
        .from('stripe_customers')
        .select('customer_id')
        .eq('user_id', userId)
        .maybeSingle();

      if (customerError) {
        console.error('Error fetching customer:', customerError);
        throw new Error(`Database error: ${customerError.message}`);
      }

      if (existingCustomer) {
        customer = await stripe.customers.retrieve(existingCustomer.customer_id);
        if (customer.deleted) {
          throw new Error('Customer has been deleted in Stripe');
        }
      } else {
        customer = await stripe.customers.create({
          email: userEmail || undefined,
          metadata: {
            supabase_user_id: userId,
          },
        });

        const { error: insertError } = await supabase.from('stripe_customers').insert({
          user_id: userId,
          customer_id: customer.id,
        });

        if (insertError) {
          console.error('Error inserting customer:', insertError);
          throw new Error(`Failed to save customer: ${insertError.message}`);
        }
      }
    }

    let line_items;
    if (priceIds && Array.isArray(priceIds)) {
      const priceIdCounts = priceIds.reduce((acc: Record<string, number>, id: string) => {
        acc[id] = (acc[id] || 0) + 1;
        return acc;
      }, {});

      line_items = Object.entries(priceIdCounts).map(([price, quantity]) => ({
        price,
        quantity: quantity as number,
      }));
    } else {
      line_items = [
        {
          price: priceId,
          quantity: 1,
        },
      ];
    }

    console.log('Creating checkout session with line items:', line_items);

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      line_items,
      mode,
      success_url: `${req.headers.get('origin')}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/`,
      automatic_tax: { enabled: true },
      billing_address_collection: 'required',
      shipping_address_collection: {
        allowed_countries: ['US', 'CA', 'GB', 'AU', 'NZ', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'SE', 'NO', 'DK', 'FI', 'IE', 'AT', 'CH', 'PL', 'PT', 'CZ', 'GR', 'RO', 'HU', 'JP', 'KR', 'SG', 'IN', 'BR', 'MX', 'AR', 'CL', 'CO'],
      },
      customer_creation: 'always',
    };

    if (customer) {
      sessionParams.customer = customer.id;
      delete sessionParams.customer_creation;
    } else {
      sessionParams.customer_creation = 'always';
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Checkout error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create checkout session';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});