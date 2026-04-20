/*
  # Fix request_id type in notifications table

  ## Changes
  - Change `request_id` column from uuid to integer in notifications table
  - This allows storing numeric request IDs (like 385) instead of UUIDs

  ## Important Notes
  - Drops existing data in request_id column (if any) as part of type conversion
  - Uses integer type to match the request_id column in comments table
*/

-- Drop the request_id column and recreate it with the correct type
ALTER TABLE notifications
DROP COLUMN IF EXISTS request_id;

ALTER TABLE notifications
ADD COLUMN request_id integer;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_notifications_request_id ON notifications(request_id);
