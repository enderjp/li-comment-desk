/*
  # Add adset column to comments table

  ## Changes
  This migration adds a new column to the comments table:
  - `adset` (text, nullable) - Ad set identifier for tracking

  ## Notes
  - The column is nullable to allow existing records to remain valid
  - No default value is set as this is optional information
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'comments' AND column_name = 'adset'
  ) THEN
    ALTER TABLE comments ADD COLUMN adset text;
  END IF;
END $$;
