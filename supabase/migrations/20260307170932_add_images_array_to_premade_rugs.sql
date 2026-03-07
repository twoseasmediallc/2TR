/*
  # Add Images Array to Pre-made Rugs

  1. Changes
    - Add `images` column (text array) to store multiple image URLs for each rug
    - This allows creating image galleries for each rug
    - The existing `image` column will remain as the primary/thumbnail image
  
  2. Notes
    - Existing rugs will have NULL for images array initially
    - New rugs can have multiple images in the gallery
    - Frontend will display image galleries when available
*/

-- Add images array column to Pre-made Rugs table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Pre-made Rugs' AND column_name = 'images'
  ) THEN
    ALTER TABLE "Pre-made Rugs" ADD COLUMN images text[];
  END IF;
END $$;
