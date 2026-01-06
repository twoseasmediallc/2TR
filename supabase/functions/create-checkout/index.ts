import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import Stripe from "npm:stripe@14.21.0";

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

    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase configuration is missing");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let customer;
    const { data: existingCustomer } = await supabase
      .from("stripe_customers")
      .select("customer_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (existingCustomer) {
      customer = await stripe.customers.retrieve(existingCustomer.customer_id);
    } else {
      customer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          supabase_user_id: userId,
        },
      });

      await supabase.from("stripe_customers").insert({
        user_id: userId,
        customer_id: customer.id,
      });
    }

    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      customer: customer.id,
      mode: mode as "payment" | "subscription",
      success_url: `${req.headers.get("origin")}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/`,
      metadata: {
        user_id: userId,
      },
      line_items: [],
    };

    if (priceIds && Array.isArray(priceIds)) {
      sessionConfig.line_items = priceIds.map((id: string) => ({
        price: id,
        quantity: 1,
      }));
    } else if (priceId) {
      sessionConfig.line_items = [
        {
          price: priceId,
          quantity: 1,
        },
      ];
    } else {
      throw new Error("Either priceId or priceIds must be provided");
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Checkout error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});