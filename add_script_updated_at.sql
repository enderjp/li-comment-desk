-- Add script_updated_at column to comments table
-- This tracks when the script field was last updated

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'comments' AND column_name = 'script_updated_at'
  ) THEN
    ALTER TABLE comments ADD COLUMN script_updated_at timestamptz;
  END IF;
END $$;
