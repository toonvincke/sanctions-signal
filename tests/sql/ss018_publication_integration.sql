-- SS-018: ephemeral PostgreSQL integration test for SS-023 + SS-024.
-- This runs in GitHub Actions postgres:16 and MUST NOT touch a real environment.
\set ON_ERROR_STOP on
\i tests/sql/ss025_paywall_rls.sql

-- Extend the SS-025 database fixture to the actual publication columns.
CREATE TYPE public.legal_status AS ENUM (
 'final_judgment','interim','ag_opinion','settlement','penalty_notice','conviction',
 'allegation','in_force','announced','not_applicable'
);
ALTER TABLE public.intelligence_records
 ADD COLUMN source_title text,
 ADD COLUMN legal_status public.legal_status,
 ADD COLUMN tags text[] DEFAULT '{}',
 ADD COLUMN affected_entities text[] DEFAULT '{}',
 ADD COLUMN affected_sectors text[] DEFAULT '{}',
 ADD COLUMN legal_provisions text[] DEFAULT '{}',
 ADD COLUMN priority boolean DEFAULT false,
 ADD COLUMN updated_at timestamptz DEFAULT now();

ALTER TABLE public.intelligence_candidates ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.intelligence_candidates
 ADD COLUMN source_code text,
 ADD COLUMN source_url text UNIQUE,
 ADD COLUMN source_title text,
 ADD COLUMN source_publisher text,
 ADD COLUMN published_at timestamptz,
 ADD COLUMN status text NOT NULL DEFAULT 'pending_review',
 ADD COLUMN ai_draft jsonb,
 ADD COLUMN reviewer_id uuid REFERENCES auth.users(id),
 ADD COLUMN reviewed_at timestamptz,
 ADD COLUMN review_notes text,
 ADD COLUMN published_record_id uuid REFERENCES public.intelligence_records(id),
 ADD COLUMN updated_at timestamptz DEFAULT now();
ALTER TABLE public.intelligence_candidates
 ADD CONSTRAINT intelligence_candidates_status_check
 CHECK (status IN ('pending_review','approved','rejected','published'));
ALTER TABLE public.intelligence_candidates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage intelligence candidates" ON public.intelligence_candidates
 FOR ALL TO authenticated
 USING (private.has_role(auth.uid(),'admin'::public.app_role))
 WITH CHECK (private.has_role(auth.uid(),'admin'::public.app_role));

ALTER TABLE public.sanctions_sources ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.sanctions_sources
 ADD COLUMN code text UNIQUE,
 ADD COLUMN name text,
 ADD COLUMN source_type text,
 ADD COLUMN source_url text,
 ADD COLUMN jurisdiction text,
 ADD COLUMN enabled boolean DEFAULT false;

\i drizzle/migrations/0012_programme_document_model.sql
\i drizzle/migrations/0023_publication_review.sql
\i drizzle/migrations/0024_official_source_coverage.sql
\i scripts/ss-023-staging-smoke.sql
\i scripts/ss-024-staging-smoke.sql

-- Ensure new public catalogues are readable, pending documents never are.
INSERT INTO public.sanctions_programmes (jurisdiction,slug,name)
 VALUES('eu','ss018-check','SS018 check') ON CONFLICT DO NOTHING;
INSERT INTO public.official_documents(canonical_url,title,document_type,publication_state)
 VALUES('https://eur-lex.europa.eu/eli/reg/2024/386/oj/eng','Unreviewed original','legislation','draft')
 ON CONFLICT DO NOTHING;

SET ROLE anon;
DO $$
BEGIN
 IF (SELECT COUNT(*) FROM public.sanctions_programmes WHERE slug='ss018-check') <> 1
 THEN RAISE EXCEPTION 'Public catalogue missing'; END IF;
 IF EXISTS (SELECT 1 FROM public.official_documents WHERE title='Unreviewed original')
 THEN RAISE EXCEPTION 'Unreviewed official document leaked to anon'; END IF;
 IF has_table_privilege('anon','public.editorial_publication_events','SELECT')
 THEN RAISE EXCEPTION 'Anon can read confidential audit'; END IF;
END $$;
RESET ROLE;
SELECT 'SS-018 integrated publication fixture passed' AS result;
