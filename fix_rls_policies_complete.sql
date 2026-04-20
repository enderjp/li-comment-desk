-- ============================================
-- COMPLETE RLS FIX FOR ALL TABLES
-- This will properly restrict test videos
-- ============================================

-- Step 1: Check current state (for debugging)
SELECT 'Current RLS Status for all tables:' as step;
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

SELECT 'Current Policies for comments:' as step;
SELECT policyname, cmd, roles::text
FROM pg_policies
WHERE tablename = 'comments';

-- Step 2: ENABLE RLS on ALL tables (CRITICAL!)
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop ALL existing policies on comments
DROP POLICY IF EXISTS "Authenticated users can view all comments" ON comments;
DROP POLICY IF EXISTS "Users can view comments" ON comments;
DROP POLICY IF EXISTS "Authenticated users can view comments" ON comments;
DROP POLICY IF EXISTS "Users can view comments based on video restrictions" ON comments;
DROP POLICY IF EXISTS "Restrict test videos to authorized users" ON comments;
DROP POLICY IF EXISTS "Authenticated users can view allowed comments" ON comments;
DROP POLICY IF EXISTS "Authenticated users can insert comments" ON comments;
DROP POLICY IF EXISTS "Users can insert comments" ON comments;
DROP POLICY IF EXISTS "Authenticated users can update comments" ON comments;
DROP POLICY IF EXISTS "Users can update comments" ON comments;
DROP POLICY IF EXISTS "Authenticated users can delete comments" ON comments;
DROP POLICY IF EXISTS "Users can delete comments" ON comments;

-- Step 4: Create restrictive SELECT policy
CREATE POLICY "Authenticated users can view allowed comments"
  ON comments
  FOR SELECT
  TO authenticated
  USING (
    CASE
      -- If adset contains 'test' (case-insensitive), only allow specific users
      WHEN LOWER(COALESCE(adset, '')) LIKE '%test%' THEN
        auth.uid() IN (
          'eb879e3a-0290-49f7-9038-9c075b03be65'::uuid,
          '86c451ca-101b-4bf4-ab40-393a6bdc994c'::uuid
        )
      -- All other videos are visible to any authenticated user
      ELSE true
    END
  );

-- Step 5: Create INSERT policy for authenticated users
CREATE POLICY "Authenticated users can insert comments"
  ON comments
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Step 6: Create UPDATE policy for authenticated users
CREATE POLICY "Authenticated users can update comments"
  ON comments
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Step 7: Create DELETE policy for authenticated users
CREATE POLICY "Authenticated users can delete comments"
  ON comments
  FOR DELETE
  TO authenticated
  USING (true);

-- ============================================
-- REQUESTS TABLE POLICIES
-- ============================================

-- Drop existing policies on requests
DROP POLICY IF EXISTS "Authenticated users can view requests" ON requests;
DROP POLICY IF EXISTS "Users can view requests" ON requests;
DROP POLICY IF EXISTS "Authenticated users can insert requests" ON requests;
DROP POLICY IF EXISTS "Authenticated users can update requests" ON requests;
DROP POLICY IF EXISTS "Authenticated users can delete requests" ON requests;

-- Create policies for requests table
CREATE POLICY "Authenticated users can view requests"
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

-- ============================================
-- NOTIFICATIONS TABLE POLICIES
-- ============================================

-- Drop existing policies on notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Authenticated users can view notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON notifications;

-- Create policies for notifications table
CREATE POLICY "Users can view their own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert notifications"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- VERIFICATION
-- ============================================

-- Step 8: Verify RLS is now enabled
SELECT 'RLS Status After Enabling:' as step;
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Step 9: Verify the new policies
SELECT 'Policies Created for comments:' as step;
SELECT policyname, cmd, roles::text
FROM pg_policies
WHERE tablename = 'comments'
ORDER BY cmd, policyname;

SELECT 'Policies Created for requests:' as step;
SELECT policyname, cmd, roles::text
FROM pg_policies
WHERE tablename = 'requests'
ORDER BY cmd, policyname;

SELECT 'Policies Created for notifications:' as step;
SELECT policyname, cmd, roles::text
FROM pg_policies
WHERE tablename = 'notifications'
ORDER BY cmd, policyname;

-- Step 10: Test query to verify test videos are restricted
SELECT 'Test Videos Count (should only show if you are authorized user):' as step;
SELECT COUNT(*) as test_video_count
FROM comments
WHERE LOWER(COALESCE(adset, '')) LIKE '%test%';
