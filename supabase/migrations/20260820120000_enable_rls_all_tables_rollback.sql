/*
  Rollback for 20260820120000_enable_rls_all_tables.sql

  Run this only if enabling RLS breaks production and you need the app back
  immediately. It returns the database to the previous (insecure) state.
*/

BEGIN;

ALTER TABLE public.profiles                DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments                DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.gemini_comments         DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.gpt_comments            DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.claude_comments         DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_errors          DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications           DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.vertical                DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_buyer             DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_service_agents DISABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF to_regclass('public.requests') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.requests DISABLE ROW LEVEL SECURITY';
  END IF;
END $$;

COMMIT;
