import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface OrderNotification {
  orderId: number;
  orderNumber: string;
  name: string;
  email: string;
  description: string;
  dimensions: string;
  backing_option: string;
  cut_option: string;
  design_image?: string;
  shipping_address_line1: string;
  shipping_address_line2?: string;
  shipping_city: string;
  shipping_state: string;
  shipping_zip: string;
  shipping_country: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const orderData: OrderNotification = await req.json();

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

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
            .image-container { margin-top: 10px; }
            .image-container img { max-width: 100%; height: auto; border-radius: 8px; border: 2px solid #ddd; }
            .footer { text-align: center; margin-top: 20px; color: #888; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎨 New Custom Rug Order</h1>
              <p>ID #${orderData.orderId}</p>
              <p>Order Number: ${orderData.orderNumber}</p>
            </div>
            <div class="content">
              <div class="field">
                <div class="label">Order Number:</div>
                <div class="value" style="background-color: #fff3cd; border-color: #ffc107; font-weight: bold; font-size: 16px;">${orderData.orderNumber}</div>
              </div>

              <div class="field">
                <div class="label">Customer Name:</div>
                <div class="value">${orderData.name}</div>
              </div>

              <div class="field">
                <div class="label">Customer Email:</div>
                <div class="value">${orderData.email}</div>
              </div>

              <div class="field">
                <div class="label">Shipping Address:</div>
                <div class="value">
                  ${orderData.shipping_address_line1}<br>
                  ${orderData.shipping_address_line2 ? `${orderData.shipping_address_line2}<br>` : ''}
                  ${orderData.shipping_city}, ${orderData.shipping_state} ${orderData.shipping_zip}<br>
                  ${orderData.shipping_country}
                </div>
              </div>

              <div class="field">
                <div class="label">Design Description:</div>
                <div class="value">${orderData.description}</div>
              </div>

              <div class="field">
                <div class="label">Dimensions:</div>
                <div class="value">${orderData.dimensions}</div>
              </div>

              <div class="field">
                <div class="label">Cut Option:</div>
                <div class="value">${orderData.cut_option}</div>
              </div>

              <div class="field">
                <div class="label">Backing Option:</div>
                <div class="value">${orderData.backing_option}</div>
              </div>

              ${orderData.design_image ? `
                <div class="field">
                  <div class="label">Design Reference Image:</div>
                  <div class="image-container">
                    <img src="${orderData.design_image}" alt="Design Reference" />
                  </div>
                  <div class="value" style="margin-top: 10px;">
                    <a href="${orderData.design_image}" target="_blank">View Full Image</a>
                  </div>
                </div>
              ` : ''}

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
        subject: `New Custom Rug Order ${orderData.orderNumber} - ${orderData.name}`,
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
        message: "Email notification sent successfully",
        emailId: emailResult.id
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
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred"
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