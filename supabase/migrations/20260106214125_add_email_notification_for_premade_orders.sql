/*
  # Add Email Notification Trigger for Pre-made Rug Orders

  1. Changes
    - Creates a trigger function that sends order data to the send-premade-order-notification edge function
    - Creates a trigger that fires after INSERT on stripe_orders table
    
  2. How it works
    - When a new row is inserted into stripe_orders, the trigger automatically fires
    - The trigger function gathers order details and sends them to the edge function
    - The edge function fetches full details from Stripe (customer info, products) and sends an email to orders@twotuftrugs.com
    
  3. Important Notes
    - Requires RESEND_API_KEY and STRIPE_SECRET_KEY to be configured in Supabase Edge Function secrets
    - Uses pg_net extension for HTTP requests
    - Trigger runs asynchronously to avoid blocking the INSERT operation
    - Only sends notification when payment_status is 'paid' and status is 'completed'
*/

-- Ensure pg_net extension is enabled (should already be enabled from custom rugs)
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create function to send pre-made order notification
CREATE OR REPLACE FUNCTION notify_new_premade_rug_order()
RETURNS TRIGGER AS $$
DECLARE
  function_url TEXT;
  payload JSONB;
  request_id BIGINT;
BEGIN
  -- Only send notification if payment is completed
  IF NEW.payment_status = 'paid' AND NEW.status = 'completed' THEN
    -- Construct the edge function URL
    function_url := 'https://esvrzocrrwabwrvlurpf.supabase.co/functions/v1/send-premade-order-notification';
    
    -- Build the payload with order details
    payload := jsonb_build_object(
      'orderId', NEW.id,
      'checkoutSessionId', NEW.checkout_session_id,
      'customerId', NEW.customer_id,
      'amountTotal', NEW.amount_total,
      'currency', NEW.currency
    );
    
    -- Make async HTTP POST request to edge function
    SELECT extensions.http_post(
      url := function_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzdnJ6b2NycndhYndydmx1cnBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3MjAzNjksImV4cCI6MjA4MDI5NjM2OX0.-8IjWYSVbsV4UM6qdc2_el9zhdPyAtvH0RHx7YtqDwA'
      ),
      body := payload
    ) INTO request_id;
    
    -- Log the request (optional, for debugging)
    RAISE NOTICE 'Pre-made order email notification request sent with ID: %, payload: %', request_id, payload;
  END IF;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the insert
  RAISE WARNING 'Failed to send pre-made order email notification: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on stripe_orders table
DROP TRIGGER IF EXISTS trigger_notify_premade_rug_order ON stripe_orders;
CREATE TRIGGER trigger_notify_premade_rug_order
  AFTER INSERT ON stripe_orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_premade_rug_order();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA extensions TO postgres, service_role;