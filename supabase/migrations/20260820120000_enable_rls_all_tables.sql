/*
  # Enable RLS on every public table

  ## Context
  RLS was disabled on all tables, so the anon key granted full read/write access
  to anyone who extracted it from the bundle. This migration turns RLS back on
  and adds policies that mirror what the app actually does.

  ## Access model
  - The frontend is read-only except for `notifications` (own rows).
  - All other writes come from n8n and the edge functions, which use the service
    role key and therefore bypass RLS entirely.
  - Role lives in `profiles.role` ('admin' | 'agent' | null).
  - Agents only see comments with `visibility = 'public'`, matching the filter
    that CommentsView.tsx already applies client-side.

  ## Rollback
  See 20260820120000_enable_rls_all_tables_rollback.sql
*/

BEGIN;

-- ---------------------------------------------------------------------------
-- Helper: read the caller's role without tripping over profiles' own policy.
-- SECURITY DEFINER so it can read profiles regardless of RLS; STABLE so the
-- planner evaluates it once per statement instead of once per row.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.current_user_role() FROM public;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;

-- ---------------------------------------------------------------------------
-- Existence checks for NotificationBell. It deletes notifications whose parent
-- comment is gone; without these, RLS would make an invisible comment look
-- deleted and the notification would be destroyed. SECURITY DEFINER answers
-- "does it exist" without leaking any row contents.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.comment_exists_by_request(p_request_id bigint)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.comments WHERE request_id = p_request_id);
$$;

CREATE OR REPLACE FUNCTION public.comment_exists_by_id(p_id bigint)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.comments WHERE id = p_id);
$$;

REVOKE ALL ON FUNCTION public.comment_exists_by_request(bigint) FROM public;
REVOKE ALL ON FUNCTION public.comment_exists_by_id(bigint) FROM public;
GRANT EXECUTE ON FUNCTION public.comment_exists_by_request(bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.comment_exists_by_id(bigint) TO authenticated;

-- ---------------------------------------------------------------------------
-- Drop every existing policy on the tables we are about to configure.
-- Leftover permissive policies OR together with new ones, so a stale
-- "USING (true)" would silently defeat everything below.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  r record;
  managed text[] := ARRAY[
    'profiles', 'comments', 'request_errors', 'notifications',
    'gemini_comments', 'gpt_comments', 'claude_comments',
    'vertical', 'media_buyer', 'customer_service_agents', 'requests'
  ];
BEGIN
  FOR r IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = ANY(managed)
  LOOP
    EXECUTE format('DROP POLICY %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- profiles: everyone reads only their own row.
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- comments: agents see public rows only; everyone else sees all.
-- COALESCE keeps today's behaviour for users whose role is NULL.
-- ---------------------------------------------------------------------------
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read comments per visibility"
  ON public.comments FOR SELECT TO authenticated
  USING (
    COALESCE(public.current_user_role(), '') <> 'agent'
    OR visibility = 'public'
  );

-- ---------------------------------------------------------------------------
-- Generated comments: visible only when the parent comment is visible.
-- ---------------------------------------------------------------------------
ALTER TABLE public.gemini_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gpt_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claude_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read gemini comments of visible posts"
  ON public.gemini_comments FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.comments c
    WHERE c.request_id = gemini_comments.comment_request_id
  ));

CREATE POLICY "Read gpt comments of visible posts"
  ON public.gpt_comments FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.comments c
    WHERE c.request_id = gpt_comments.comment_request_id
  ));

CREATE POLICY "Read claude comments of visible posts"
  ON public.claude_comments FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.comments c
    WHERE c.request_id = claude_comments.comment_request_id
  ));

-- ---------------------------------------------------------------------------
-- request_errors: Admin panel only.
-- ---------------------------------------------------------------------------
ALTER TABLE public.request_errors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read request errors"
  ON public.request_errors FOR SELECT TO authenticated
  USING (public.current_user_role() = 'admin');

-- ---------------------------------------------------------------------------
-- notifications: own rows only. No INSERT policy: notifications are created by
-- edge functions with the service role, which bypasses RLS.
-- ---------------------------------------------------------------------------
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users update own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own notifications"
  ON public.notifications FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Lookup tables: read-only for any signed-in user.
-- ---------------------------------------------------------------------------
ALTER TABLE public.vertical ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_buyer ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_service_agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read verticals"
  ON public.vertical FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated read media buyers"
  ON public.media_buyer FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated read cs agents"
  ON public.customer_service_agents FOR SELECT TO authenticated USING (true);

-- ---------------------------------------------------------------------------
-- requests: legacy table, no code path reads it. RLS on, zero policies,
-- so it is closed to anon and authenticated alike.
-- ---------------------------------------------------------------------------
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;

COMMIT;
