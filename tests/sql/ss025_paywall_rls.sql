-- Standalone SS-025 integration test. Use ONLY ephemeral PostgreSQL in CI.
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN BYPASSRLS;
CREATE SCHEMA auth;
CREATE SCHEMA private;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;
GRANT USAGE ON SCHEMA public,auth,private TO anon,authenticated,service_role;
CREATE TABLE auth.users(id uuid PRIMARY KEY);
CREATE TYPE public.app_role AS ENUM ('admin','user');
CREATE TYPE public.content_type AS ENUM ('sanctions_development','case_law','enforcement_action','guidance','legislation','circumvention');
CREATE TYPE public.verification_status AS ENUM ('verified','pending_review','unverified');
CREATE TABLE public.user_roles(user_id uuid,role public.app_role,PRIMARY KEY(user_id,role));
CREATE FUNCTION private.has_role(_user_id uuid,_role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role=_role)
$$;
REVOKE ALL ON FUNCTION private.has_role(uuid,public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_role(uuid,public.app_role) TO authenticated,service_role;
CREATE TABLE public.jurisdictions(id uuid PRIMARY KEY DEFAULT gen_random_uuid());
CREATE TABLE public.regimes(id uuid PRIMARY KEY DEFAULT gen_random_uuid());
CREATE TABLE public.authorities(id uuid PRIMARY KEY DEFAULT gen_random_uuid());
CREATE TABLE public.categories(id uuid PRIMARY KEY DEFAULT gen_random_uuid());
CREATE TABLE public.intelligence_records(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), slug text UNIQUE NOT NULL,
  content_type public.content_type NOT NULL,
  headline text NOT NULL,
  executive_summary text NOT NULL,
  source_facts text NOT NULL,
  detailed_analysis text,
  practical_implications text,
  publication_date date NOT NULL,
  jurisdiction_id uuid REFERENCES public.jurisdictions(id),
  regime_id uuid REFERENCES public.regimes(id),
  authority_id uuid REFERENCES public.authorities(id),
  source_url text NOT NULL,
  source_publisher text,
  verification_status public.verification_status NOT NULL DEFAULT 'pending_review'
);
CREATE TABLE public.record_categories(record_id uuid REFERENCES public.intelligence_records(id),category_id uuid REFERENCES public.categories(id));
CREATE TABLE public.profiles(id uuid PRIMARY KEY,full_name text);
CREATE TABLE public.bookmarks(id uuid PRIMARY KEY);
CREATE TABLE public.assistant_feedback(id uuid PRIMARY KEY);
CREATE TABLE public.intelligence_candidates(id uuid PRIMARY KEY);
CREATE TABLE public.intelligence_record_versions(id uuid PRIMARY KEY);
CREATE TABLE public.sanctions_import_runs(id uuid PRIMARY KEY);
CREATE TABLE public.sanctions_import_staging(id uuid PRIMARY KEY);
CREATE TABLE public.sanctions_sources(id uuid PRIMARY KEY);
CREATE TABLE public.sanctions_list_entries(id uuid PRIMARY KEY);
ALTER TABLE public.intelligence_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.record_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read" ON public.intelligence_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth read" ON public.record_categories FOR SELECT TO authenticated USING (true);

-- Simulate Supabase projects with broad legacy default privileges.
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon,authenticated,service_role;

\i drizzle/migrations/0008_premium_access.sql
\i drizzle/migrations/0009_intelligence_preview_rls.sql
\i drizzle/migrations/0010_least_privilege_grants.sql
\i drizzle/migrations/0011_record_category_access.sql

INSERT INTO auth.users(id) VALUES
 ('00000000-0000-0000-0000-000000000001'),
 ('00000000-0000-0000-0000-000000000002'),
 ('00000000-0000-0000-0000-000000000003'),
 ('00000000-0000-0000-0000-000000000004');
INSERT INTO public.user_roles(user_id,role) VALUES
 ('00000000-0000-0000-0000-000000000001','user'),
 ('00000000-0000-0000-0000-000000000002','user'),
 ('00000000-0000-0000-0000-000000000003','admin'),
 ('00000000-0000-0000-0000-000000000004','user');
INSERT INTO public.user_subscriptions(user_id,plan,status,current_period_end) VALUES
 ('00000000-0000-0000-0000-000000000002','premium_monthly','active',now()+interval '5 days'),
 ('00000000-0000-0000-0000-000000000004','premium_annual','active',now()-interval '1 day');
INSERT INTO public.intelligence_records(slug,content_type,headline,executive_summary,source_facts,publication_date,source_url,verification_status) VALUES
 ('verified','guidance','Verified public headline','PRIVATE SUMMARY','PRIVATE FACTS',current_date,'https://example.org/1','verified'),
 ('draft','guidance','Secret draft headline','DRAFT SECRET','SECRET FACTS',current_date,'https://example.org/2','pending_review');
INSERT INTO public.categories(id) VALUES ('00000000-0000-0000-0000-000000000010');
INSERT INTO public.record_categories(record_id,category_id) SELECT id,'00000000-0000-0000-0000-000000000010' FROM public.intelligence_records;
INSERT INTO public.programme_premium_sections(jurisdiction,programme_slug,section_key,title,body,published) VALUES
 ('eu','russia','guidance','Published guidance','PRIVATE PAID CONTENT',true),
 ('eu','russia','guidance','Unpublished draft','SECRET DRAFT',false);

DO $$
BEGIN
 IF (SELECT count(*) FROM public.intelligence_previews) <> 1 THEN
   RAISE EXCEPTION 'Public preview backfill must contain only one verified headline';
 END IF;
 IF has_table_privilege('authenticated','public.intelligence_records','TRUNCATE')
 OR has_table_privilege('anon','public.intelligence_records','TRUNCATE')
 OR has_table_privilege('authenticated','public.user_subscriptions','UPDATE')
 OR has_table_privilege('anon','public.intelligence_records','SELECT')
 THEN RAISE EXCEPTION 'Forbidden privilege exists'; END IF;
END $$;
\i supabase/tests/ss025_security_assertions.sql

SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);
DO $$
BEGIN
 IF (SELECT count(*) FROM public.intelligence_records) <> 0 THEN RAISE EXCEPTION 'Free account sees full records'; END IF;
 IF (SELECT count(*) FROM public.programme_premium_sections) <> 0 THEN RAISE EXCEPTION 'Free account sees premium sections'; END IF;
 IF (SELECT count(*) FROM public.intelligence_previews) <> 1 THEN RAISE EXCEPTION 'Free account cannot see safe headline'; END IF;
 IF (SELECT count(*) FROM public.record_categories) <> 0 THEN RAISE EXCEPTION 'Free account can infer protected record categories'; END IF;
END $$;

SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false);
DO $$
BEGIN
 IF (SELECT count(*) FROM public.intelligence_records) <> 1 THEN RAISE EXCEPTION 'Paid account cannot see verified record'; END IF;
 IF (SELECT count(*) FROM public.programme_premium_sections) <> 1 THEN RAISE EXCEPTION 'Paid account can see drafts or lacks approved premium section'; END IF;
 IF (SELECT count(*) FROM public.record_categories) <> 1 THEN RAISE EXCEPTION 'Paid account category scope invalid'; END IF;
END $$;

SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000004',false);
DO $$
BEGIN
 IF (SELECT count(*) FROM public.intelligence_records) <> 0 THEN RAISE EXCEPTION 'Expired account sees full intelligence'; END IF;
 IF (SELECT count(*) FROM public.programme_premium_sections) <> 0 THEN RAISE EXCEPTION 'Expired account sees premium content'; END IF;
END $$;

SELECT set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000003',false);
DO $$
BEGIN
 IF (SELECT count(*) FROM public.intelligence_records) <> 2 THEN RAISE EXCEPTION 'Admin cannot see editorial drafts'; END IF;
 IF (SELECT count(*) FROM public.programme_premium_sections) <> 2 THEN RAISE EXCEPTION 'Admin cannot see programme drafts'; END IF;
END $$;
RESET ROLE;
SET ROLE anon;
DO $$
BEGIN
 IF (SELECT count(*) FROM public.intelligence_previews) <> 1 THEN RAISE EXCEPTION 'Anon cannot see public approved headline'; END IF;
END $$;
RESET ROLE;
