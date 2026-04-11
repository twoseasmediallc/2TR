/*
  # Add Post Column to Reviews Table

  1. Changes
    - `reviews` table: add `post` (boolean, default false) column
      - When set to true by an admin, the review will be publicly visible on the Review page

  2. Security
    - Add a public SELECT policy so anyone can read reviews where post = true
    - Existing "Authenticated users can view reviews" policy remains for admin access

  3. Notes
    - New reviews default to post = false (not visible publicly until approved)
    - This allows manual curation of which reviews appear on the site
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reviews' AND column_name = 'post'
  ) THEN
    ALTER TABLE reviews ADD COLUMN post boolean NOT NULL DEFAULT false;
  END IF;
END $$;

CREATE POLICY "Anyone can view posted reviews"
  ON reviews
  FOR SELECT
  TO anon
  USING (post = true);
