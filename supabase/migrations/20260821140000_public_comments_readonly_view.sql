/*
  # Read-only public window onto comments

  ## Context
  Supabase API keys are project-wide: there is no per-table or read-only key.
  The publishable (legacy `anon`) key maps to the `anon` Postgres role, so the
  scope of "read-only, comments only" has to come from a grant, not a key.

  ## Approach
  `comments` stays closed to `anon` (RLS on, no anon policy). Instead we expose
  a view that:
    - exposes every column of `comments` (requested explicitly),
    - filters to the rows safe to serve publicly,
    - is granted SELECT to `anon`, and nothing else.

  The view is intentionally NOT `security_invoker`, so it reads `comments` as
  its owner and bypasses that table's RLS. That is the whole point: it is the
  controlled window. Supabase's linter flags this as a "security definer view";
  it is expected here.

  Every column is exposed, so any column added to `comments` later must be
  reviewed before being added here: the view's column list is frozen at
  creation, which is why it is spelled out rather than `SELECT *`.

  ## Note
  Anyone holding the publishable key can read this view — it is in the app
  bundle. Treat everything below as world-readable.
*/

BEGIN;

CREATE OR REPLACE VIEW public.public_comments
WITH (security_invoker = false) AS
SELECT
  id,
  request_id,
  created_at,
  media_buyer,
  agente_customer_service,
  vertical,
  language,
  url,
  script,
  "Comentarios",
  adset,
  thumbnail_urls,
  media_type,
  script_updated_at,
  visibility,
  source
FROM public.comments
WHERE source = 'comment_desk'
  AND visibility = 'public';

COMMENT ON VIEW public.public_comments IS
  'Read-only public projection of comments. Granted SELECT to anon. '
  'Exposes every column of comments, including media_buyer, '
  'agente_customer_service and adset. Rows are limited to '
  'source = comment_desk AND visibility = public.';

-- Read-only, and only for the public role. No INSERT/UPDATE/DELETE anywhere.
REVOKE ALL ON public.public_comments FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.public_comments TO anon;

COMMIT;
