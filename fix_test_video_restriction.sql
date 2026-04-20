/*
  # Restrict visibility of test videos - Final Fix

  ## Overview
  This migration creates a restrictive policy for the comments table
  to hide posts with videos containing "test" in the name from unauthorized users.

  ## Changes
  1. Security
    - Drops all existing SELECT policies on `comments` table
    - Creates new restrictive SELECT policy:
      * Videos containing "test" (case-insensitive) are ONLY visible to:
        - User: eb879e3a-0290-49f7-9038-9c075b03be65
        - User: 86c451ca-101b-4bf4-ab40-393a6bdc994c
      * All other videos are visible to authenticated users
    - Uses explicit logic to prevent any bypasses

  ## Security Notes
  - Uses ILIKE for case-insensitive matching
  - Explicitly checks user UUID against authorized list
  - No fallback conditions that could expose test videos
*/

-- Drop ALL existing SELECT policies to start fresh
DROP POLICY IF EXISTS "Authenticated users can view all comments" ON comments;
DROP POLICY IF EXISTS "Users can view comments" ON comments;
DROP POLICY IF EXISTS "Authenticated users can view comments" ON comments;
DROP POLICY IF EXISTS "Users can view comments based on video restrictions" ON comments;
DROP POLICY IF EXISTS "Restrict test videos to authorized users" ON comments;

-- Create restrictive SELECT policy with explicit CASE logic
CREATE POLICY "Restrict test videos to authorized users"
  ON comments
  FOR SELECT
  TO authenticated
  USING (
    CASE
      -- If adset contains 'test' (case-insensitive), only allow specific users
      WHEN adset ILIKE '%test%' THEN
        auth.uid() IN (
          'eb879e3a-0290-49f7-9038-9c075b03be65'::uuid,
          '86c451ca-101b-4bf4-ab40-393a6bdc994c'::uuid
        )
      -- Otherwise, allow all authenticated users
      ELSE true
    END
  );
