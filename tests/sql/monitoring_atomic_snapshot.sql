-- Standalone PostgreSQL integration test for 0006.
-- Runs in an ephemeral CI database only; never point this script at Lovable Cloud.
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role BYPASSRLS NOLOGIN;
CREATE TABLE public.sanctions_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL, enabled boolean DEFAULT true,
  last_checked_at timestamptz, last_success_at timestamptz,
  last_content_hash text, last_error text
);
CREATE TABLE public.sanctions_import_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_code text NOT NULL, status text NOT NULL,
  finished_at timestamptz, http_status integer, content_hash text,
  records_seen integer DEFAULT 0, records_added integer DEFAULT 0,
  records_changed integer DEFAULT 0, records_removed integer DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb
);
CREATE TABLE public.sanctions_list_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_code text NOT NULL, source_entry_id text NOT NULL,
  subject_name text NOT NULL, subject_type text,
  programs text[] DEFAULT '{}', aliases text[] DEFAULT '{}',
  identifying_data jsonb DEFAULT '{}'::jsonb,
  source_url text NOT NULL, content_hash text NOT NULL,
  active boolean DEFAULT true, last_seen_at timestamptz DEFAULT now(),
  removed_at timestamptz,
  UNIQUE (source_code, source_entry_id)
);
GRANT ALL ON public.sanctions_sources, public.sanctions_import_runs,
  public.sanctions_list_entries TO service_role;
\i drizzle/migrations/0006_atomic_sanctions_import.sql

DO $$
BEGIN
  IF has_function_privilege('anon', 'public.finalize_sanctions_import(uuid,text,integer)', 'EXECUTE')
     OR has_function_privilege('authenticated', 'public.finalize_sanctions_import(uuid,text,integer)', 'EXECUTE') THEN
    RAISE EXCEPTION 'Atomic finalizer must not be callable by browser roles';
  END IF;
END $$;

SET ROLE service_role;
DO $$
DECLARE
  v_run uuid := gen_random_uuid();
  v_result jsonb;
  v_second uuid := gen_random_uuid();
  v_failed uuid := gen_random_uuid();
BEGIN
  INSERT INTO public.sanctions_sources(code) VALUES ('ofac_sdn');
  INSERT INTO public.sanctions_import_runs(id, source_code, status) VALUES (v_run, 'ofac_sdn', 'running');
  INSERT INTO public.sanctions_import_staging(run_id, source_code, source_entry_id,
      subject_name, source_url, content_hash)
    SELECT v_run, 'ofac_sdn', n::text, 'Name ' || n, 'https://example.com', 'hash-' || n
    FROM generate_series(1,12) AS n;
  v_result := public.finalize_sanctions_import(v_run, 'snapshot-1', 200);
  IF (v_result->>'added')::int <> 12 OR (v_result->>'removed')::int <> 0 THEN
    RAISE EXCEPTION 'Initial import stats wrong: %', v_result;
  END IF;
  IF (SELECT count(*) FROM public.sanctions_list_entries WHERE active) <> 12 THEN
    RAISE EXCEPTION 'Initial snapshot missing entries';
  END IF;
  IF (SELECT count(*) FROM public.sanctions_import_staging) <> 0 THEN
    RAISE EXCEPTION 'Staging rows not cleaned';
  END IF;

  INSERT INTO public.sanctions_import_runs(id, source_code, status) VALUES (v_second, 'ofac_sdn', 'running');
  INSERT INTO public.sanctions_import_staging(run_id, source_code, source_entry_id,
      subject_name, source_url, content_hash)
    SELECT v_second, 'ofac_sdn', n::text,
      CASE WHEN n = 1 THEN 'Renamed' ELSE 'Name ' || n END,
      'https://example.com', CASE WHEN n = 1 THEN 'changed' ELSE 'hash-' || n END
    FROM generate_series(1,11) AS n;
  v_result := public.finalize_sanctions_import(v_second, 'snapshot-2', 200);
  IF (v_result->>'changed')::int <> 1 OR (v_result->>'removed')::int <> 1 THEN
    RAISE EXCEPTION 'Update/delist stats wrong: %', v_result;
  END IF;
  IF (SELECT count(*) FROM public.sanctions_list_entries WHERE active) <> 11
    OR (SELECT count(*) FROM public.sanctions_list_entries WHERE NOT active AND removed_at IS NOT NULL) <> 1 THEN
    RAISE EXCEPTION 'Removed entries must be retained, but inactive';
  END IF;
  IF (SELECT subject_name FROM public.sanctions_list_entries WHERE source_entry_id = '1') <> 'Renamed' THEN
    RAISE EXCEPTION 'Changed entry not updated';
  END IF;

  INSERT INTO public.sanctions_import_runs(id, source_code, status) VALUES (v_failed, 'ofac_sdn', 'running');
  INSERT INTO public.sanctions_import_staging(run_id, source_code, source_entry_id,
      subject_name, source_url, content_hash)
    SELECT v_failed, 'ofac_sdn', n::text, 'Truncated ' || n, 'https://example.com', 'bad'
    FROM generate_series(1,2) AS n;
  BEGIN
    PERFORM public.finalize_sanctions_import(v_failed, 'bad-snapshot', 200);
    RAISE EXCEPTION 'Incomplete snapshot was unexpectedly accepted';
  EXCEPTION WHEN others THEN
    IF SQLERRM = 'Incomplete snapshot was unexpectedly accepted' THEN RAISE; END IF;
  END;
  IF (SELECT count(*) FROM public.sanctions_list_entries WHERE active) <> 11
    OR (SELECT last_content_hash FROM public.sanctions_sources WHERE code = 'ofac_sdn') <> 'snapshot-2' THEN
    RAISE EXCEPTION 'Rejected snapshot changed live data';
  END IF;
END $$;
RESET ROLE;
