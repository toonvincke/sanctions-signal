-- SS-025 / SS-012: separate approved public intelligence previews from paid full records.
-- Apply only after verifying live schema, backup and rollout.
-- This is intentionally a separate table: a security-invoker view over gated records
-- would not expose public previews, while a definer view could bypass RLS.
CREATE TABLE public.intelligence_previews (
  record_id uuid PRIMARY KEY REFERENCES public.intelligence_records(id) ON DELETE CASCADE,
  slug text UNIQUE NOT NULL,
  content_type public.content_type NOT NULL,
  headline text NOT NULL,
  publication_date date NOT NULL,
  jurisdiction_id uuid REFERENCES public.jurisdictions(id),
  regime_id uuid REFERENCES public.regimes(id),
  authority_id uuid REFERENCES public.authorities(id),
  source_url text NOT NULL,
  source_publisher text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.intelligence_previews ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.intelligence_previews FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.intelligence_previews TO anon, authenticated;
GRANT ALL ON public.intelligence_previews TO service_role;
CREATE POLICY "published previews are readable" ON public.intelligence_previews
  FOR SELECT TO anon, authenticated USING (true);

CREATE OR REPLACE FUNCTION private.sync_intelligence_preview()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF TG_OP = 'DELETE' THEN
   DELETE FROM public.intelligence_previews WHERE record_id = OLD.id;
   RETURN OLD;
 END IF;
 IF NEW.verification_status = 'verified' THEN
   INSERT INTO public.intelligence_previews
     (record_id, slug, content_type, headline, publication_date,
      jurisdiction_id, regime_id, authority_id, source_url, source_publisher, updated_at)
   VALUES (NEW.id, NEW.slug, NEW.content_type, NEW.headline, NEW.publication_date,
      NEW.jurisdiction_id, NEW.regime_id, NEW.authority_id, NEW.source_url, NEW.source_publisher, now())
   ON CONFLICT (record_id) DO UPDATE SET
     slug = EXCLUDED.slug, content_type = EXCLUDED.content_type, headline = EXCLUDED.headline,
     publication_date = EXCLUDED.publication_date, jurisdiction_id = EXCLUDED.jurisdiction_id,
     regime_id = EXCLUDED.regime_id, authority_id = EXCLUDED.authority_id,
     source_url = EXCLUDED.source_url, source_publisher = EXCLUDED.source_publisher, updated_at = now();
 ELSE
   DELETE FROM public.intelligence_previews WHERE record_id = NEW.id;
 END IF;
 RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.sync_intelligence_preview() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS intelligence_records_preview_sync ON public.intelligence_records;
CREATE TRIGGER intelligence_records_preview_sync
 AFTER INSERT OR UPDATE OR DELETE ON public.intelligence_records
 FOR EACH ROW EXECUTE FUNCTION private.sync_intelligence_preview();

-- One-time backfill of approved records; drafts never enter previews.
INSERT INTO public.intelligence_previews
 (record_id, slug, content_type, headline, publication_date,
  jurisdiction_id, regime_id, authority_id, source_url, source_publisher)
SELECT id, slug, content_type, headline, publication_date, jurisdiction_id,
       regime_id, authority_id, source_url, source_publisher
FROM public.intelligence_records WHERE verification_status = 'verified'
ON CONFLICT (record_id) DO NOTHING;

-- The previous policy exposed entire drafts and analyses to EVERY signed-in user.
DROP POLICY IF EXISTS "auth read" ON public.intelligence_records;
CREATE POLICY "verified full intelligence for premium or admins"
 ON public.intelligence_records FOR SELECT TO authenticated
 USING (
    (SELECT private.has_role(auth.uid(), 'admin'::public.app_role))
    OR (
      verification_status = 'verified'
      AND (SELECT private.has_premium_access(auth.uid()))
    )
 );
-- Membership is not required for anonymous users to read headline-only previews.
-- record_categories references remain protected by base record RLS.
COMMENT ON TABLE public.intelligence_previews IS 'Safe public headline metadata for verified records; excludes summary, source facts and analysis.';
