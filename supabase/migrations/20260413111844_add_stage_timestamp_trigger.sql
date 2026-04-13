/*
  # Add Trigger to Auto-Set Stage Timestamps

  ## Summary
  Creates a trigger on the "Custom Rugs" table that automatically sets the
  per-stage timestamp columns when their corresponding boolean flag is flipped
  to TRUE. This ensures each stage records the exact moment it was activated,
  regardless of how the update is made (admin dashboard, edge function, etc.).

  ## Trigger Behavior
  - When `is_order_placed` changes from false → true: sets `order_placed_at = now()`
  - When `is_in_production` changes from false → true: sets `in_production_at = now()`
  - When `is_post_production` changes from false → true: sets `post_production_at = now()`
  - When `is_quality_check` changes from false → true: sets `quality_check_at = now()`
  - When `is_shipped` changes from false → true: sets `shipped_at = now()`
  - When `is_delivered` changes from false → true: sets `delivered_at = now()`

  ## Notes
  - Timestamps are only set once (when the flag first becomes true)
  - If a flag is toggled back to false, the timestamp is preserved
  - Existing rows with true flags already have order_placed_at backfilled from created_at
*/

CREATE OR REPLACE FUNCTION set_stage_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_order_placed = true AND (OLD.is_order_placed IS DISTINCT FROM true) AND NEW.order_placed_at IS NULL THEN
    NEW.order_placed_at = now();
  END IF;

  IF NEW.is_in_production = true AND (OLD.is_in_production IS DISTINCT FROM true) AND NEW.in_production_at IS NULL THEN
    NEW.in_production_at = now();
  END IF;

  IF NEW.is_post_production = true AND (OLD.is_post_production IS DISTINCT FROM true) AND NEW.post_production_at IS NULL THEN
    NEW.post_production_at = now();
  END IF;

  IF NEW.is_quality_check = true AND (OLD.is_quality_check IS DISTINCT FROM true) AND NEW.quality_check_at IS NULL THEN
    NEW.quality_check_at = now();
  END IF;

  IF NEW.is_shipped = true AND (OLD.is_shipped IS DISTINCT FROM true) AND NEW.shipped_at IS NULL THEN
    NEW.shipped_at = now();
  END IF;

  IF NEW.is_delivered = true AND (OLD.is_delivered IS DISTINCT FROM true) AND NEW.delivered_at IS NULL THEN
    NEW.delivered_at = now();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS stage_timestamp_trigger ON "Custom Rugs";

CREATE TRIGGER stage_timestamp_trigger
  BEFORE UPDATE ON "Custom Rugs"
  FOR EACH ROW
  EXECUTE FUNCTION set_stage_timestamps();
