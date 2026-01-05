/*
  # Add Boolean Tracking Status Fields

  1. Changes
    - Add boolean columns for each tracking stage:
      - `is_order_placed` (default true) - Order has been received
      - `is_in_production` (default false) - Rug is being handcrafted
      - `is_quality_check` (default false) - Final inspection in progress
      - `is_shipped` (default false) - Order has been shipped
      - `is_delivered` (default false) - Order has been delivered
    - Migrate existing status data to boolean columns
    - Keep existing `status` column for backward compatibility

  2. Benefits
    - Easy to update via Supabase dashboard with checkboxes
    - Clear visual representation of order progress
    - Simple true/false toggles for each stage

  3. Security
    - No RLS changes needed - existing policies remain in effect
*/

-- Add boolean status columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Custom Rugs' AND column_name = 'is_order_placed'
  ) THEN
    ALTER TABLE "Custom Rugs" ADD COLUMN is_order_placed boolean DEFAULT true NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Custom Rugs' AND column_name = 'is_in_production'
  ) THEN
    ALTER TABLE "Custom Rugs" ADD COLUMN is_in_production boolean DEFAULT false NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Custom Rugs' AND column_name = 'is_quality_check'
  ) THEN
    ALTER TABLE "Custom Rugs" ADD COLUMN is_quality_check boolean DEFAULT false NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Custom Rugs' AND column_name = 'is_shipped'
  ) THEN
    ALTER TABLE "Custom Rugs" ADD COLUMN is_shipped boolean DEFAULT false NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Custom Rugs' AND column_name = 'is_delivered'
  ) THEN
    ALTER TABLE "Custom Rugs" ADD COLUMN is_delivered boolean DEFAULT false NOT NULL;
  END IF;
END $$;

-- Migrate existing status data to boolean columns
UPDATE "Custom Rugs"
SET 
  is_order_placed = true,
  is_in_production = CASE WHEN status IN ('in_production', 'quality_check', 'shipped', 'delivered') THEN true ELSE false END,
  is_quality_check = CASE WHEN status IN ('quality_check', 'shipped', 'delivered') THEN true ELSE false END,
  is_shipped = CASE WHEN status IN ('shipped', 'delivered') THEN true ELSE false END,
  is_delivered = CASE WHEN status = 'delivered' THEN true ELSE false END;
