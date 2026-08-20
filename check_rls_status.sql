-- Read-only diagnostic. Single result set, so the Supabase SQL Editor shows
-- everything at once instead of just the last statement.

SELECT 'rls_off' AS check, tablename AS detail, NULL::bigint AS count
FROM pg_tables
WHERE schemaname = 'public' AND NOT rowsecurity

UNION ALL
SELECT 'rls_on', tablename, NULL
FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity

UNION ALL
SELECT 'policy', tablename || ' :: ' || policyname || ' [' || cmd || ']', NULL
FROM pg_policies
WHERE schemaname = 'public'

UNION ALL
SELECT 'rls_on_no_policy', t.tablename, NULL
FROM pg_tables t
LEFT JOIN pg_policies p ON p.schemaname = t.schemaname AND p.tablename = t.tablename
WHERE t.schemaname = 'public' AND t.rowsecurity AND p.policyname IS NULL

UNION ALL
SELECT 'visibility', COALESCE(visibility, '(null)'), COUNT(*)
FROM public.comments GROUP BY visibility

UNION ALL
SELECT 'role', COALESCE(role, '(null)'), COUNT(*)
FROM public.profiles GROUP BY role

UNION ALL
SELECT 'helper_fn', proname, NULL
FROM pg_proc WHERE proname IN
  ('current_user_role', 'comment_exists_by_request', 'comment_exists_by_id')

ORDER BY 1, 2;
