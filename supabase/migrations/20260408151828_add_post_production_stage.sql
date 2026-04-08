/*
  # Add Post-Production Stage to Order Timeline

  1. Changes
    - Adds `is_post_production` boolean column to "Custom Rugs" table
    - Positioned logically between `is_in_production` and `is_quality_check`
    - Default value is FALSE (orders don't start in post-production)

  2. Data Migration
    - Any existing orders that are already at quality_check, shipped, or delivered
      will have is_post_production set to TRUE to maintain correct timeline progression

  3. Notes
    - No data loss - purely additive change
    - Existing orders are updated to reflect accurate stage history
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Custom Rugs' AND column_name = 'is_post_production'
  ) THEN
    ALTER TABLE "Custom Rugs" ADD COLUMN is_post_production boolean NOT NULL DEFAULT false;
  END IF;
END $$;

UPDATE "Custom Rugs"
SET is_post_production = true
WHERE is_quality_check = true OR is_shipped = true OR is_delivered = true;
