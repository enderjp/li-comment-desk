/*
  # Add mediaType column to comments table

  1. Changes
    - Add `mediaType` column to `comments` table
    - Default value is 'video' for existing and new records

  2. Notes
    - This column stores the type of media (video, image, etc.)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'comments' 
    AND column_name = 'mediaType'
  ) THEN
    ALTER TABLE public.comments ADD COLUMN "mediaType" text DEFAULT 'video';
  END IF;
END $$;