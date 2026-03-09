import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface PremadeRug {
  id: number;
  title: string | null;
  description: string | null;
  price: string | null;
  image: string | null;
  stripe_price_id: string | null;
  stripe_prod_id: string | null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
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

    const { data: rugs, error: fetchError } = await supabase
      .from("Pre-made Rugs")
      .select("*")
      .is("stripe_prod_id", null);

    if (fetchError) {
      throw new Error(`Failed to fetch rugs: ${fetchError.message}`);
    }

    if (!rugs || rugs.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "All rugs are already synced with Stripe",
          synced: 0,
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const results = [];

    for (const rug of rugs as PremadeRug[]) {
      try {
        if (!rug.title || !rug.price) {
          console.log(`Skipping rug ${rug.id}: missing title or price`);
          continue;
        }

        const priceInCents = Math.round(parseFloat(rug.price) * 100);

        const productResponse = await fetch("https://api.stripe.com/v1/products", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${stripeSecretKey}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            name: rug.title,
            description: rug.description || "",
            ...(rug.image && { images: [rug.image] }),
            metadata: JSON.stringify({
              supabase_rug_id: rug.id.toString(),
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
              supabase_rug_id: rug.id.toString(),
            }),
          }).toString(),
        });

        if (!priceResponse.ok) {
          const errorData = await priceResponse.text();
          throw new Error(`Stripe price creation failed: ${errorData}`);
        }

        const price = await priceResponse.json();

        const { error: updateError } = await supabase
          .from("Pre-made Rugs")
          .update({
            stripe_prod_id: product.id,
            stripe_price_id: price.id,
          })
          .eq("id", rug.id);

        if (updateError) {
          throw new Error(`Failed to update rug ${rug.id}: ${updateError.message}`);
        }

        results.push({
          rug_id: rug.id,
          title: rug.title,
          stripe_product_id: product.id,
          stripe_price_id: price.id,
          success: true,
        });
      } catch (error) {
        console.error(`Error syncing rug ${rug.id}:`, error);
        results.push({
          rug_id: rug.id,
          title: rug.title,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Synced ${results.filter(r => r.success).length} rugs with Stripe`,
        synced: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error syncing rugs to Stripe:", error);
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
