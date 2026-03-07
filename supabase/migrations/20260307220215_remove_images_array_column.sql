/*
  # Remove Images Array Column

  1. Changes
    - Remove the `images` array column from Pre-made Rugs table
    - This table already has modal_image1, modal_image2, modal_image3 columns
    - We will use those individual columns instead of an array
*/

-- Remove images array column if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Pre-made Rugs' AND column_name = 'images'
  ) THEN
    ALTER TABLE "Pre-made Rugs" DROP COLUMN images;
  END IF;
END $$;
