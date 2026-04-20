/*
  # Create Notifications Table

  ## Overview
  This migration creates a notifications table to alert users when comment generation requests are completed.

  ## New Tables

  ### `notifications`
  Stores user notifications with the following fields:
  - `id` (uuid, primary key) - Unique identifier for each notification
  - `user_id` (uuid) - Foreign key to auth.users
  - `title` (text) - Notification title
  - `message` (text) - Notification message content
  - `type` (text) - Type of notification (e.g., 'comment_ready', 'comment_error')
  - `request_id` (uuid, nullable) - Reference to the related request
  - `adset` (text, nullable) - Adset name for quick reference
  - `is_read` (boolean) - Whether the notification has been read
  - `created_at` (timestamptz) - Timestamp when notification was created

  ## Security

  ### Row Level Security (RLS)
  - RLS is enabled on the `notifications` table
  - Users can only view their own notifications
  - Users can update their own notifications (to mark as read)
  - Only authenticated users can access notifications

  ## Important Notes
  - Notifications are user-specific and filtered by `user_id`
  - Default value for `is_read` is false
  - Type field helps categorize notifications for future filtering
  - Adset field provides quick context without joining tables
*/

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'comment_ready',
  request_id uuid,
  adset text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policy for users to update their own notifications
CREATE POLICY "Users can update own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policy for inserting notifications (needed for edge functions)
CREATE POLICY "Authenticated users can insert notifications"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;
