/*
  # Add source column to comments table

  1. Changes
    - Add `source` column to `comments` table
    - Allowed values: 'comment_desk', 'icon_inbox'
    - Default value is 'comment_desk' for existing and new records

  2. Notes
    - Enforced with a CHECK constraint (NULL allowed for flexibility on imports)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'comments'
    AND column_name = 'source'
  ) THEN
    ALTER TABLE public.comments ADD COLUMN source text DEFAULT 'comment_desk';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'comments_source_check'
    AND conrelid = 'public.comments'::regclass
  ) THEN
    ALTER TABLE public.comments
      ADD CONSTRAINT comments_source_check
      CHECK (source IN ('comment_desk', 'icon_inbox'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_comments_source ON public.comments(source);
