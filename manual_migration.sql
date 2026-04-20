-- Change request_id from uuid to text in notifications table
-- Run this SQL in your Supabase SQL Editor

ALTER TABLE notifications 
  ALTER COLUMN request_id TYPE text USING request_id::text;
