/*
  # Create Reviews Table

  1. New Tables
    - `reviews`
      - `id` (uuid, primary key)
      - `name` (text) - customer's display name
      - `rating` (integer, 1-5) - star rating
      - `review_text` (text) - the review body
      - `order_number` (text, nullable) - optional order reference
      - `created_at` (timestamptz) - submission timestamp

  2. Security
    - Enable RLS on `reviews` table
    - Public INSERT allowed so unauthenticated customers can submit reviews
    - Only authenticated users (admins) can SELECT all reviews
    - No UPDATE or DELETE exposed publicly

  3. Notes
    - Customers do not need an account to leave a review
    - Rating is constrained to 1-5 via a check constraint
*/

CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text text NOT NULL DEFAULT '',
  order_number text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a review"
  ON reviews
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view reviews"
  ON reviews
  FOR SELECT
  TO authenticated
  USING (true);
