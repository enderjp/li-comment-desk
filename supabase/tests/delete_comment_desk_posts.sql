-- Run as postgres after the migration, with an admin and agent profile seeded.
-- All fixtures and deletions are rolled back; existing posts are never modified.
BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE role = 'agent')
     OR NOT EXISTS (SELECT 1 FROM public.profiles WHERE role = 'admin') THEN
    RAISE EXCEPTION 'Seed an admin and an agent profile before running this test';
  END IF;
END $$;

INSERT INTO public.comments (id, request_id, source, visibility, adset)
VALUES
  (-2026111001, -2026111001, 'comment_desk', 'public', 'delete-post-test'),
  (-2026111002, -2026111002, 'comment_desk', 'admin_only', 'delete-post-test'),
  (-2026111003, -2026111003, 'icon_inbox', 'public', 'delete-post-test'),
  (-2026111004, -2026111004, 'comment_desk', 'public', 'delete-post-test');
INSERT INTO public.gemini_comments (id, comment_request_id, comment_content)
VALUES (-2026111001, -2026111001, 'delete-post-test');
INSERT INTO public.gpt_comments (id, comment_request_id, comment_content)
VALUES (-2026111001, -2026111001, 'delete-post-test');
INSERT INTO public.claude_comments (id, comment_request_id, comment_content)
VALUES (-2026111001, -2026111001, 'delete-post-test');

SELECT set_config('request.jwt.claim.sub', (SELECT id::text FROM public.profiles WHERE role = 'agent' LIMIT 1), true);
SET LOCAL ROLE authenticated;
DO $$
DECLARE deleted_count integer;
BEGIN
  DELETE FROM public.comments WHERE id = -2026111002;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  IF deleted_count <> 0 THEN RAISE EXCEPTION 'Agent deleted a private post'; END IF;
  DELETE FROM public.comments WHERE id = -2026111003;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  IF deleted_count <> 0 THEN RAISE EXCEPTION 'Agent deleted an Icon Inbox post'; END IF;
  WITH deleted AS (
    DELETE FROM public.comments WHERE id = -2026111001 AND source = 'comment_desk' RETURNING id
  ) SELECT count(*) INTO deleted_count FROM deleted;
  IF deleted_count <> 1 THEN RAISE EXCEPTION 'Agent could not delete a public Comment Desk post'; END IF;
  DELETE FROM public.comments WHERE id = -2026111001;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  IF deleted_count <> 0 THEN RAISE EXCEPTION 'Repeated deletion should return zero rows'; END IF;
END $$;
RESET ROLE;

-- Check cascades as postgres so child SELECT policies cannot hide orphaned rows.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.gemini_comments WHERE comment_request_id = -2026111001)
     OR EXISTS (SELECT 1 FROM public.gpt_comments WHERE comment_request_id = -2026111001)
     OR EXISTS (SELECT 1 FROM public.claude_comments WHERE comment_request_id = -2026111001) THEN
    RAISE EXCEPTION 'AI comments were not deleted in cascade';
  END IF;
END $$;

SELECT set_config('request.jwt.claim.sub', (SELECT id::text FROM public.profiles WHERE role = 'admin' LIMIT 1), true);
SET LOCAL ROLE authenticated;
DO $$
DECLARE deleted_count integer;
BEGIN
  DELETE FROM public.comments WHERE id = -2026111002;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  IF deleted_count <> 1 THEN RAISE EXCEPTION 'Admin could not delete a private Comment Desk post'; END IF;
  DELETE FROM public.comments WHERE id = -2026111003;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  IF deleted_count <> 0 THEN RAISE EXCEPTION 'Admin deleted an Icon Inbox post'; END IF;
END $$;
RESET ROLE;

SELECT set_config('request.jwt.claim.sub', '', true);
SET LOCAL ROLE anon;
DO $$
DECLARE deleted_count integer;
BEGIN
  DELETE FROM public.comments WHERE id = -2026111004;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  IF deleted_count <> 0 THEN RAISE EXCEPTION 'Anonymous user deleted a post'; END IF;
EXCEPTION WHEN insufficient_privilege THEN NULL;
END $$;
RESET ROLE;

DO $$
BEGIN
  IF (SELECT count(*) FROM public.comments WHERE id IN (-2026111003, -2026111004)) <> 2 THEN
    RAISE EXCEPTION 'Unrelated or protected posts were deleted';
  END IF;
END $$;
ROLLBACK;

SELECT 'PASS: admin/agent permissions, source isolation, anonymous denial, repeated deletion, and all three cascades' AS result;
