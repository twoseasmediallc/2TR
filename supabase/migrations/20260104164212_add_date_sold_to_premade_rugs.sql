/*
  # Add date_sold column to Pre-made Rugs table

  1. Changes to Tables
    - Add `date_sold` column to `Pre-made Rugs` table:
      - `date_sold` (timestamptz, nullable) - Date when the rug was sold (null if not sold)

  2. Notes
    - This column is used to track when a pre-made rug has been purchased
    - When null, the rug is still available for sale
    - When set, the rug should no longer appear in the shop
*/

-- Add date_sold column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Pre-made Rugs' AND column_name = 'date_sold'
  ) THEN
    ALTER TABLE "Pre-made Rugs" ADD COLUMN date_sold timestamptz;
  END IF;
END $$;
