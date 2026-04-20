/*
  # Create comments table

  ## Overview
  Creates the core `comments` table that the application reads from.
  This table stores customer service request data imported from external sources.

  ## New Tables

  ### `comments`
  - `id` (int, primary key, auto-increment)
  - `request_id` (int) - Reference ID for the request (e.g. row 578)
  - `created_at` (timestamptz)
  - `media_buyer` (text) - Media buyer name
  - `agente_customer_service` (text) - Customer service agent name
  - `vertical` (text) - Business vertical
  - `url` (text) - Related URL
  - `script` (text) - Script content
  - `Comentarios` (text) - Comments/notes
  - `adset` (text) - Ad set identifier
  - `language` (text) - Language
  - `script_updated_at` (timestamptz) - When the script was last updated
  - `thumbnail_urls` (text[]) - Array of thumbnail image URLs

  ## Security
  - RLS enabled
  - Authenticated users can SELECT, INSERT, UPDATE, DELETE their own records
*/

CREATE TABLE IF NOT EXISTS comments (
  id serial PRIMARY KEY,
  request_id integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  media_buyer text,
  agente_customer_service text,
  vertical text,
  url text,
  script text,
  "Comentarios" text,
  adset text,
  language text,
  script_updated_at timestamptz,
  thumbnail_urls text[]
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view comments"
  ON comments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert comments"
  ON comments
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update comments"
  ON comments
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete comments"
  ON comments
  FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_comments_request_id ON comments(request_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);
