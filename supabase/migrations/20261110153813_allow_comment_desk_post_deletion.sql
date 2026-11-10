-- Authenticated users can delete Comment Desk posts they can read.
-- Existing foreign keys cascade deletion to the three AI comment tables.
CREATE POLICY "Delete visible Comment Desk posts"
  ON public.comments FOR DELETE TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL
    AND source = 'comment_desk'
    AND (
      COALESCE(public.current_user_role(), '') <> 'agent'
      OR visibility = 'public'
    )
  );
