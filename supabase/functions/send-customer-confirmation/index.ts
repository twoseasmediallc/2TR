import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CustomerConfirmation {
  trackingNumber: string;
  name: string;
  email: string;
  description: string;
  dimensions: string;
  backing_option: string;
  cut_option: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const customerData: CustomerConfirmation = await req.json();

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
            .header { background-color: #ea580c; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-radius: 0 0 8px 8px; }
            .tracking-box { background-color: #fff3cd; border: 2px solid #ffc107; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
            .tracking-number { font-size: 24px; font-weight: bold; color: #ea580c; letter-spacing: 2px; }
            .field { margin-bottom: 15px; }
            .label { font-weight: bold; color: #555; margin-bottom: 5px; }
            .value { background-color: white; padding: 10px; border-radius: 4px; border: 1px solid #ddd; }
            .note { background-color: #e8f4fd; border-left: 4px solid #2196F3; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #888; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Order Confirmation</h1>
              <p style="font-size: 18px; margin: 10px 0;">Thank you for your custom rug order!</p>
            </div>
            <div class="content">
              <p style="font-size: 16px; margin-bottom: 20px;">Hi ${customerData.name},</p>

              <p>We've received your custom rug order and are excited to bring your vision to life! Here are your order details:</p>

              <div class="tracking-box">
                <div style="color: #666; font-size: 14px; margin-bottom: 5px;">Your Tracking Number</div>
                <div class="tracking-number">${customerData.trackingNumber}</div>
                <p style="margin-top: 10px; font-size: 12px; color: #666;">Save this number for tracking your order</p>
              </div>

              <div class="field">
                <div class="label">Design Description:</div>
                <div class="value">${customerData.description}</div>
              </div>

              <div class="field">
                <div class="label">Dimensions:</div>
                <div class="value">${customerData.dimensions}</div>
              </div>

              <div class="field">
                <div class="label">Cut Option:</div>
                <div class="value">${customerData.cut_option}</div>
              </div>

              <div class="field">
                <div class="label">Backing Option:</div>
                <div class="value">${customerData.backing_option}</div>
              </div>

              <div class="note">
                <strong>📧 What's Next?</strong>
                <p style="margin: 10px 0 0 0;">Our team will review your order and respond within <strong>24 hours</strong> with:</p>
                <ul style="margin: 10px 0 0 20px;">
                  <li>A detailed quote for your custom rug</li>
                  <li>Timeline for completion</li>
                  <li>Any questions about your design</li>
                </ul>
              </div>

              <p style="margin-top: 20px;">If you have any questions in the meantime, feel free to reply to this email.</p>

              <p style="margin-top: 20px;">Thank you for choosing Two Tuft Rugs!</p>

              <div class="footer">
                <p><strong>Two Tuft Rugs</strong></p>
                <p>orders@twotuftrugs.com</p>
                <p style="margin-top: 10px;">This is an automated confirmation email.</p>
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
        to: [customerData.email],
        subject: `Order Confirmation - ${customerData.trackingNumber}`,
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
        message: "Confirmation email sent successfully",
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
    console.error("Error sending confirmation email:", error);
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
