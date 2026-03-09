import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

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
    const { rugId, title, description, price, imageUrl } = await req.json();

    if (!rugId || !title || !price) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required fields: rugId, title, and price are required",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase environment variables not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const priceInCents = Math.round(parseFloat(price) * 100);

    const productResponse = await fetch("https://api.stripe.com/v1/products", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        name: title,
        description: description || "",
        ...(imageUrl && { images: [imageUrl] }),
        metadata: JSON.stringify({
          supabase_rug_id: rugId.toString(),
        }),
      }).toString(),
    });

    if (!productResponse.ok) {
      const errorData = await productResponse.text();
      throw new Error(`Stripe product creation failed: ${errorData}`);
    }

    const product = await productResponse.json();

    const priceResponse = await fetch("https://api.stripe.com/v1/prices", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        product: product.id,
        unit_amount: priceInCents.toString(),
        currency: "usd",
        metadata: JSON.stringify({
          supabase_rug_id: rugId.toString(),
        }),
      }).toString(),
    });

    if (!priceResponse.ok) {
      const errorData = await priceResponse.text();
      throw new Error(`Stripe price creation failed: ${errorData}`);
    }

    const stripePrice = await priceResponse.json();

    const { error: updateError } = await supabase
      .from("Pre-made Rugs")
      .update({
        stripe_prod_id: product.id,
        stripe_price_id: stripePrice.id,
      })
      .eq("id", rugId);

    if (updateError) {
      throw new Error(`Failed to update rug ${rugId}: ${updateError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Rug ${rugId} synced with Stripe successfully`,
        stripe_product_id: product.id,
        stripe_price_id: stripePrice.id,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error syncing rug to Stripe:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
