import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@17.7.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface PremadeOrderNotification {
  orderId: number;
  checkoutSessionId: string;
  customerId: string;
  amountTotal: number;
  currency: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const orderData: PremadeOrderNotification = await req.json();

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    if (!STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      appInfo: {
        name: "Two Tuft Rugs",
        version: "1.0.0",
      },
    });

    const session = await stripe.checkout.sessions.retrieve(
      orderData.checkoutSessionId,
      {
        expand: ["customer", "line_items", "line_items.data.price.product"],
      }
    );

    const customer = session.customer as Stripe.Customer;
    const lineItems = session.line_items?.data || [];

    const totalQuantity = lineItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const currentYear = new Date().getFullYear();
    const yearPrefix = currentYear.toString().slice(-2);
    const formattedOrderNumber = `${totalQuantity}${yearPrefix}${orderData.orderId}`;

    const itemsHtml = lineItems
      .map((item) => {
        const product = item.price?.product as Stripe.Product;
        const productName = product?.name || "Unknown Product";
        const quantity = item.quantity || 1;
        const amount = item.amount_total || 0;
        const formattedAmount = (amount / 100).toFixed(2);

        return `
          <div style="margin-bottom: 15px; padding: 15px; background-color: white; border: 1px solid #ddd; border-radius: 4px;">
            <div style="font-weight: bold; color: #333; margin-bottom: 5px;">${productName}</div>
            <div style="color: #666;">Quantity: ${quantity}</div>
            <div style="color: #ea580c; font-weight: bold; margin-top: 5px;">$${formattedAmount}</div>
          </div>
        `;
      })
      .join("");

    const totalAmount = (orderData.amountTotal / 100).toFixed(2);

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #ea580c; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-radius: 0 0 8px 8px; }
            .field { margin-bottom: 20px; }
            .label { font-weight: bold; color: #555; margin-bottom: 5px; }
            .value { background-color: white; padding: 10px; border-radius: 4px; border: 1px solid #ddd; }
            .footer { text-align: center; margin-top: 20px; color: #888; font-size: 12px; }
            .total { background-color: #fff3cd; border: 2px solid #ffc107; padding: 15px; border-radius: 4px; font-size: 18px; font-weight: bold; text-align: center; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎨 New Pre-made Rug Order</h1>
              <p>Order #${formattedOrderNumber}</p>
            </div>
            <div class="content">
              <div class="field">
                <div class="label">Customer Name:</div>
                <div class="value">${customer.name || "Not provided"}</div>
              </div>

              <div class="field">
                <div class="label">Customer Email:</div>
                <div class="value">${customer.email || "Not provided"}</div>
              </div>

              <div class="field">
                <div class="label">Shipping Address:</div>
                <div class="value">
                  ${session.shipping_details?.address?.line1 || ""}<br>
                  ${session.shipping_details?.address?.line2 ? session.shipping_details.address.line2 + "<br>" : ""}
                  ${session.shipping_details?.address?.city || ""}, ${session.shipping_details?.address?.state || ""} ${session.shipping_details?.address?.postal_code || ""}<br>
                  ${session.shipping_details?.address?.country || ""}
                </div>
              </div>

              <div class="field">
                <div class="label">Payment Status:</div>
                <div class="value" style="background-color: #d4edda; border-color: #28a745; color: #155724; font-weight: bold;">${session.payment_status?.toUpperCase()}</div>
              </div>

              <div class="field">
                <div class="label">Order Items:</div>
                ${itemsHtml}
              </div>

              <div class="total">
                Total Amount: $${totalAmount} ${orderData.currency.toUpperCase()}
              </div>

              <div class="field" style="margin-top: 20px;">
                <div class="label">Stripe Details:</div>
                <div class="value">
                  <strong>Session ID:</strong> ${orderData.checkoutSessionId}<br>
                  <strong>Customer ID:</strong> ${orderData.customerId}
                </div>
              </div>

              <div class="footer">
                <p>This is an automated notification from Two Tuft Rugs</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Two Tuft Rugs <orders@twotuftrugs.com>",
        to: ["orders@twotuftrugs.com"],
        subject: `New Pre-made Rug Order #${formattedOrderNumber} - ${customer.name || customer.email}`,
        html: emailHtml,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text();
      console.error("Resend API error:", errorData);
      throw new Error(`Failed to send email: ${errorData}`);
    }

    const emailResult = await emailResponse.json();

    return new Response(
      JSON.stringify({
        success: true,
        message: "Pre-made rug order email notification sent successfully",
        emailId: emailResult.id,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error sending pre-made order email:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
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