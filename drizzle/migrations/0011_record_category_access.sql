-- SS-012: prevent listing associations of drafts and inaccessible intelligence.
DROP POLICY IF EXISTS "auth read" ON public.record_categories;
CREATE POLICY "categories visible only for accessible intelligence"
ON public.record_categories FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.intelligence_records i
    WHERE i.id = record_categories.record_id
  )
);
