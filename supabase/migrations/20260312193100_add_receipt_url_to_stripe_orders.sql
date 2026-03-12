/*
  # Add receipt URL to stripe_orders table

  1. Changes
    - Add `receipt_url` column to `stripe_orders` table to store Stripe receipt URL
    
  2. Details
    - Column is nullable since existing orders won't have this data
    - New orders will have the receipt URL populated from Stripe checkout session
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stripe_orders' AND column_name = 'receipt_url'
  ) THEN
    ALTER TABLE stripe_orders ADD COLUMN receipt_url text;
  END IF;
END $$;