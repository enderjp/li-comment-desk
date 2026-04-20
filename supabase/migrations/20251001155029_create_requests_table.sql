/*
  # Create Requests Table for Customer Service Platform

  ## Overview
  This migration creates the core table for storing customer service requests
  imported from Google Sheets.

  ## New Tables
  
  ### `requests`
  Stores all customer service requests with the following fields:
  - `id` (uuid, primary key) - Unique identifier for each request
  - `media_buyer` (text) - Name of the media buyer responsible
  - `agent` (text) - Customer service agent assigned
  - `vertical` (text) - Business vertical/category
  - `url` (text) - Related URL for the request
  - `script` (text) - Script text or reference
  - `recommended_comments` (text) - Recommended comments/notes
  - `created_at` (timestamptz) - Timestamp when record was created
  - `updated_at` (timestamptz) - Timestamp when record was last updated
  - `sheet_row_id` (text, nullable) - Reference to original Google Sheet row

  ## Security
  
  ### Row Level Security (RLS)
  - RLS is enabled on the `requests` table
  - Authenticated users can view all requests (SELECT)
  - Authenticated users can insert new requests (INSERT)
  - Authenticated users can update existing requests (UPDATE)
  - Authenticated users can delete requests (DELETE)
  
  ## Notes
  - All timestamp fields use `timestamptz` for timezone awareness
  - `updated_at` automatically updates on record modification via trigger
  - Text fields allow NULL to handle incomplete data imports
*/

-- Create requests table
CREATE TABLE IF NOT EXISTS requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  media_buyer text,
  agent text,
  vertical text,
  url text,
  script text,
  recommended_comments text,
  sheet_row_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Authenticated users can view all requests"
  ON requests
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert requests"
  ON requests
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update requests"
  ON requests
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete requests"
  ON requests
  FOR DELETE
  TO authenticated
  USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_requests_updated_at
  BEFORE UPDATE ON requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_requests_created_at ON requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_requests_agent ON requests(agent);
CREATE INDEX IF NOT EXISTS idx_requests_vertical ON requests(vertical);