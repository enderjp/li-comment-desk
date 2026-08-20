-- Read-only. Run before and after the RLS migration to compare.

SELECT 'RLS enabled per table' AS section;
SELECT tablename, rowsecurity AS rls_on
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY rowsecurity, tablename;

SELECT 'Policies in place' AS section;
SELECT tablename, policyname, cmd, roles::text, permissive
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd, policyname;

SELECT 'Tables with RLS on but no policy (fully closed)' AS section;
SELECT t.tablename
FROM pg_tables t
LEFT JOIN pg_policies p
  ON p.schemaname = t.schemaname AND p.tablename = t.tablename
WHERE t.schemaname = 'public' AND t.rowsecurity AND p.policyname IS NULL
ORDER BY t.tablename;

SELECT 'Distinct visibility values in comments' AS section;
SELECT COALESCE(visibility, '(null)') AS visibility, COUNT(*)
FROM public.comments
GROUP BY 1 ORDER BY 2 DESC;

SELECT 'Distinct roles in profiles' AS section;
SELECT COALESCE(role, '(null)') AS role, COUNT(*)
FROM public.profiles
GROUP BY 1 ORDER BY 2 DESC;
