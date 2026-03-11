/*
  # Rename tracking_number to order_number

  1. Changes
    - Rename `tracking_number` column to `order_number` in Custom Rugs table
    - Update all functions and triggers that reference tracking_number
    
  2. Security
    - No RLS changes needed - existing policies remain in effect
*/

-- Rename the column
ALTER TABLE "Custom Rugs" 
RENAME COLUMN tracking_number TO order_number;

-- Update the function name and references
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS text AS $$
DECLARE
  new_order_number text;
  date_part text;
  random_part text;
BEGIN
  -- Get current date in YYYYMMDD format
  date_part := to_char(NOW(), 'YYYYMMDD');
  
  -- Generate random 5-digit number
  random_part := lpad(floor(random() * 100000)::text, 5, '0');
  
  -- Combine into order number format: 2TR-YYYYMMDD-XXXXX
  new_order_number := '2TR-' || date_part || '-' || random_part;
  
  -- Check if it already exists (rare collision case)
  WHILE EXISTS (SELECT 1 FROM "Custom Rugs" WHERE order_number = new_order_number) LOOP
    random_part := lpad(floor(random() * 100000)::text, 5, '0');
    new_order_number := '2TR-' || date_part || '-' || random_part;
  END LOOP;
  
  RETURN new_order_number;
END;
$$ LANGUAGE plpgsql;

-- Update trigger function
CREATE OR REPLACE FUNCTION assign_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := generate_order_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger with new function name
DROP TRIGGER IF EXISTS assign_tracking_number_trigger ON "Custom Rugs";
DROP TRIGGER IF EXISTS assign_order_number_trigger ON "Custom Rugs";
CREATE TRIGGER assign_order_number_trigger
  BEFORE INSERT ON "Custom Rugs"
  FOR EACH ROW
  EXECUTE FUNCTION assign_order_number();

-- Drop old functions
DROP FUNCTION IF EXISTS generate_tracking_number();
DROP FUNCTION IF EXISTS assign_tracking_number();
