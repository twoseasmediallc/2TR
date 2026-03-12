/*
  # Add coupon code to Custom Rugs table

  1. Changes
    - Add `coupon_code` column to `Custom Rugs` table to store optional coupon codes
    
  2. Details
    - Column is nullable since it's optional
    - Will store coupon codes entered by customers during custom rug orders
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Custom Rugs' AND column_name = 'coupon_code'
  ) THEN
    ALTER TABLE "Custom Rugs" ADD COLUMN coupon_code text;
  END IF;
END $$;