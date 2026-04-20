/*
  # Restrict visibility of test videos

  ## Overview
  This migration updates the Row Level Security policies for the comments table
  to restrict visibility of posts with videos containing "test" in their name.

  ## Changes
  1. Security
    - Updates SELECT policy on `comments` table
    - Posts with videos containing "test" (case-insensitive) are only visible to:
      - User ID: eb879e3a-0290-49f7-9038-9c075b03be65
      - User ID: 86c451ca-101b-4bf4-ab40-393a6bdc994c
    - All other posts remain visible to all authenticated users

  ## Notes
  - Uses case-insensitive matching with ILIKE operator
  - NULL adset values are treated as non-test videos (visible to all)
  - Existing policies are replaced to ensure consistency
*/

-- Drop existing SELECT policy if it exists
DROP POLICY IF EXISTS "Authenticated users can view all comments" ON comments;
DROP POLICY IF EXISTS "Users can view comments" ON comments;
DROP POLICY IF EXISTS "Authenticated users can view comments" ON comments;

-- Create new SELECT policy with conditional visibility
CREATE POLICY "Users can view comments based on video restrictions"
  ON comments
  FOR SELECT
  TO authenticated
  USING (
    -- If adset contains 'test' (case insensitive), only specific users can see it
    CASE
      WHEN adset ILIKE '%test%' THEN
        auth.uid() IN (
          'eb879e3a-0290-49f7-9038-9c075b03be65'::uuid,
          '86c451ca-101b-4bf4-ab40-393a6bdc994c'::uuid
        )
      ELSE
        -- All other posts are visible to authenticated users
        true
    END
  );
