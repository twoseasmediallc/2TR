/*
  # Add Shipping Address to Custom Rugs Table

  1. New Columns
    - `shipping_address_line1` (text) - Street address line 1
    - `shipping_address_line2` (text, optional) - Street address line 2 (apartment, suite, etc.)
    - `shipping_city` (text) - City
    - `shipping_state` (text) - State/Province
    - `shipping_zip` (text) - ZIP/Postal Code
    - `shipping_country` (text) - Country (defaults to 'United States')

  2. Changes
    - Add shipping address fields to store customer delivery information
    - All fields except address_line2 are required for order fulfillment
*/

-- Add shipping address columns to Custom Rugs table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Custom Rugs' AND column_name = 'shipping_address_line1'
  ) THEN
    ALTER TABLE "Custom Rugs" ADD COLUMN shipping_address_line1 text NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Custom Rugs' AND column_name = 'shipping_address_line2'
  ) THEN
    ALTER TABLE "Custom Rugs" ADD COLUMN shipping_address_line2 text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Custom Rugs' AND column_name = 'shipping_city'
  ) THEN
    ALTER TABLE "Custom Rugs" ADD COLUMN shipping_city text NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Custom Rugs' AND column_name = 'shipping_state'
  ) THEN
    ALTER TABLE "Custom Rugs" ADD COLUMN shipping_state text NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Custom Rugs' AND column_name = 'shipping_zip'
  ) THEN
    ALTER TABLE "Custom Rugs" ADD COLUMN shipping_zip text NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Custom Rugs' AND column_name = 'shipping_country'
  ) THEN
    ALTER TABLE "Custom Rugs" ADD COLUMN shipping_country text NOT NULL DEFAULT 'United States';
  END IF;
END $$;