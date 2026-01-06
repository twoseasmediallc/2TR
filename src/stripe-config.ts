export interface StripeProduct {
  priceId: string;
  name: string;
  description: string;
  price: number;
  mode: 'payment' | 'subscription';
}

export const stripeProducts: StripeProduct[] = [
  {
    priceId: 'price_1SmObKCWVSnInCPVJdZUGQ3o',
    name: 'Test Rug 3',
    description: 'Test product for development',
    price: 3.00,
    mode: 'payment'
  },
  {
    priceId: 'price_1SmOb1CWVSnInCPVHkVZF0VA',
    name: 'Test Rug 1',
    description: 'Test product for development',
    price: 1.00,
    mode: 'payment'
  },
  {
    priceId: 'price_1SlhNlCWVSnInCPVZ9XE2eQ1',
    name: 'Live Music',
    description: '2\' x 2\' Music note on a lively colored staff (background color may vary)',
    price: 90.00,
    mode: 'payment'
  },
  {
    priceId: 'price_1SlhMOCWVSnInCPVakoCZsjG',
    name: 'Checkerboard B&R',
    description: '2\' x 2\' Black and red checkerboard',
    price: 85.00,
    mode: 'payment'
  },
  {
    priceId: 'price_1SlhLXCWVSnInCPVvh7ajg0h',
    name: 'Just Smile',
    description: '2\' x 2\' Smiley face in a square box (colors may vary)',
    price: 80.00,
    mode: 'payment'
  },
  {
    priceId: 'price_1SlhKvCWVSnInCPVoJTSOcmX',
    name: 'Lightening Bolt',
    description: '2\' x 2\' Floating lightening bolt (background color may vary)',
    price: 80.00,
    mode: 'payment'
  },
  {
    priceId: 'price_1SlhIuCWVSnInCPVjyFagIF8',
    name: 'Sunny Sunflower',
    description: '2\' x 2\' Sunflower petals (background color may vary)',
    price: 80.00,
    mode: 'payment'
  },
  {
    priceId: 'price_1SlhGTCWVSnInCPVRTgVY0QO',
    name: 'Alive in Motion',
    description: '2\' x 2\' Abstract artwork of lines in motion (colors may vary)',
    price: 90.00,
    mode: 'payment'
  }


  import Stripe from "https://esm.sh/stripe@14.25.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2023-10-16",
});

type CartItem = {
  stripe_price_id: string;
  quantity: number;
};

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const { items } = (await req.json()) as { items: CartItem[] };

    if (!items?.length) {
      return new Response(JSON.stringify({ error: "Cart is empty" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Basic validation
    for (const it of items) {
      if (!it.stripe_price_id) {
        return new Response(JSON.stringify({ error: "Missing stripe_price_id" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (!it.quantity || it.quantity < 1) {
        return new Response(JSON.stringify({ error: "Invalid quantity" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    const origin = req.headers.get("origin") ?? "https://YOURDOMAIN.com";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: items.map((it) => ({
        price: it.stripe_price_id,
        quantity: it.quantity,
      })),
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cart`,
      // Optional but common:
      // shipping_address_collection: { allowed_countries: ["US"] },
      // automatic_tax: { enabled: true },
      // phone_number_collection: { enabled: true },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

];