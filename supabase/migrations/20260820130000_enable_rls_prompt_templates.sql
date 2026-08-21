/*
  # Enable RLS on prompt_templates and prompt_templates_safe

  These two tables were not covered by 20260820120000 because nothing in this
  repo references them -- they are written and read exclusively by n8n, which
  connects with the service role key and bypasses RLS.

  RLS on with zero policies means: closed to anon and authenticated, unchanged
  for the service role. That silences the Supabase security warning without
  touching any working code path.

  If it turns out the app ever needs to read these from the browser, add a
  SELECT policy rather than disabling RLS again.
*/

BEGIN;

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['prompt_templates', 'prompt_templates_safe']
  LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    END IF;
  END LOOP;
END $$;

COMMIT;
