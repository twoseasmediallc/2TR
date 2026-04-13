/*
  # Add Per-Stage Timestamps to Custom Rugs

  ## Summary
  Adds individual timestamp columns for each order stage so the tracking page
  can display the exact date and time each phase was reached, instead of
  showing the same global `updated_at` for all completed stages.

  ## New Columns (all nullable timestamptz)
  - `order_placed_at` - when the order was placed/confirmed
  - `in_production_at` - when production started
  - `post_production_at` - when post-production started
  - `quality_check_at` - when quality check started
  - `shipped_at` - when the order was shipped
  - `delivered_at` - when the order was delivered

  ## Notes
  - All columns are nullable; a NULL value means that stage hasn't been reached yet
  - Existing rows will have NULL for all new columns (except order_placed_at
    which is backfilled from created_at for rows where is_order_placed = true)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Custom Rugs' AND column_name = 'order_placed_at'
  ) THEN
    ALTER TABLE "Custom Rugs" ADD COLUMN order_placed_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Custom Rugs' AND column_name = 'in_production_at'
  ) THEN
    ALTER TABLE "Custom Rugs" ADD COLUMN in_production_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Custom Rugs' AND column_name = 'post_production_at'
  ) THEN
    ALTER TABLE "Custom Rugs" ADD COLUMN post_production_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Custom Rugs' AND column_name = 'quality_check_at'
  ) THEN
    ALTER TABLE "Custom Rugs" ADD COLUMN quality_check_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Custom Rugs' AND column_name = 'shipped_at'
  ) THEN
    ALTER TABLE "Custom Rugs" ADD COLUMN shipped_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Custom Rugs' AND column_name = 'delivered_at'
  ) THEN
    ALTER TABLE "Custom Rugs" ADD COLUMN delivered_at timestamptz;
  END IF;
END $$;

UPDATE "Custom Rugs"
SET order_placed_at = created_at
WHERE is_order_placed = true AND order_placed_at IS NULL;
