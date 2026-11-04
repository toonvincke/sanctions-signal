-- Atomic full-snapshot imports. Run through Lovable Cloud Drizzle AFTER 0005.
-- No existing monitoring, user, or intelligence rows are deleted.
CREATE TABLE IF NOT EXISTS public.sanctions_import_staging (
  run_id uuid NOT NULL REFERENCES public.sanctions_import_runs(id) ON DELETE CASCADE,
  source_code text NOT NULL,
  source_entry_id text NOT NULL,
  subject_name text NOT NULL,
  subject_type text,
  programs text[] NOT NULL DEFAULT '{}',
  aliases text[] NOT NULL DEFAULT '{}',
  identifying_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_url text NOT NULL,
  content_hash text NOT NULL,
  PRIMARY KEY (run_id, source_entry_id)
);
CREATE INDEX IF NOT EXISTS sanctions_import_staging_source_idx
  ON public.sanctions_import_staging (source_code, run_id);
ALTER TABLE public.sanctions_import_staging ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.sanctions_import_staging FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, DELETE ON public.sanctions_import_staging TO service_role;

-- Called by the server's service-role client only. Runs as INVOKER, not as definer.
-- PostgreSQL performs all writes in one transaction: failures roll back the entire import.
CREATE OR REPLACE FUNCTION public.finalize_sanctions_import(
  p_run_id uuid, p_content_hash text, p_http_status integer DEFAULT 200
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_code text;
  v_source_id uuid;
  v_count integer;
  v_previous integer;
  v_added integer;
  v_changed integer;
  v_removed integer;
  v_stamp timestamptz := now();
BEGIN
  SELECT source_code INTO v_code
    FROM public.sanctions_import_runs
    WHERE id = p_run_id AND status = 'running'
    FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Unknown or already finalized import run'; END IF;
  SELECT id INTO v_source_id FROM public.sanctions_sources
    WHERE code = v_code AND enabled = true FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Import source missing or disabled'; END IF;

  SELECT count(*)::integer INTO v_count FROM public.sanctions_import_staging
    WHERE run_id = p_run_id AND source_code = v_code;
  IF v_count < 10 THEN RAISE EXCEPTION 'Too few staged entries (%): refusing import', v_count; END IF;
  IF EXISTS (
    SELECT 1 FROM public.sanctions_import_staging
    WHERE run_id = p_run_id AND source_code <> v_code
  ) THEN RAISE EXCEPTION 'Cross-source staging rows detected'; END IF;

  SELECT count(*)::integer INTO v_previous FROM public.sanctions_list_entries
    WHERE source_code = v_code AND active = true;
  -- A large mass-delisting must be manually verified against the official issuer.
  IF v_previous >= 100 AND v_count < (v_previous * 0.98) THEN
    RAISE EXCEPTION 'Snapshot shrank by more than 2 percent (% -> %); manual review required', v_previous, v_count;
  END IF;

  SELECT
    count(*) FILTER (WHERE target.id IS NULL)::integer,
    count(*) FILTER (WHERE target.id IS NOT NULL
      AND (target.content_hash IS DISTINCT FROM staged.content_hash OR target.active = false))::integer
  INTO v_added, v_changed
  FROM public.sanctions_import_staging AS staged
  LEFT JOIN public.sanctions_list_entries AS target
    ON target.source_code = v_code AND target.source_entry_id = staged.source_entry_id
  WHERE staged.run_id = p_run_id;

  INSERT INTO public.sanctions_list_entries (
    source_code, source_entry_id, subject_name, subject_type,
    programs, aliases, identifying_data, source_url,
    content_hash, active, last_seen_at, removed_at
  )
  SELECT source_code, source_entry_id, subject_name, subject_type,
    programs, aliases, identifying_data, source_url,
    content_hash, true, v_stamp, NULL
  FROM public.sanctions_import_staging WHERE run_id = p_run_id
  ON CONFLICT (source_code, source_entry_id) DO UPDATE SET
    subject_name = EXCLUDED.subject_name,
    subject_type = EXCLUDED.subject_type,
    programs = EXCLUDED.programs,
    aliases = EXCLUDED.aliases,
    identifying_data = EXCLUDED.identifying_data,
    source_url = EXCLUDED.source_url,
    content_hash = EXCLUDED.content_hash,
    active = true,
    last_seen_at = v_stamp,
    removed_at = NULL;

  SELECT count(*)::integer INTO v_removed
  FROM public.sanctions_list_entries AS target
  WHERE target.source_code = v_code AND target.active = true
    AND NOT EXISTS (
      SELECT 1 FROM public.sanctions_import_staging AS staged
      WHERE staged.run_id = p_run_id AND staged.source_entry_id = target.source_entry_id
    );

  UPDATE public.sanctions_list_entries AS target
  SET active = false, removed_at = v_stamp
  WHERE target.source_code = v_code AND target.active = true
    AND NOT EXISTS (
      SELECT 1 FROM public.sanctions_import_staging AS staged
      WHERE staged.run_id = p_run_id AND staged.source_entry_id = target.source_entry_id
    );

  UPDATE public.sanctions_import_runs SET
    status = 'succeeded', finished_at = v_stamp,
    http_status = p_http_status, content_hash = p_content_hash,
    records_seen = v_count, records_added = v_added,
    records_changed = v_changed, records_removed = v_removed,
    metadata = jsonb_build_object('atomic_snapshot', true)
  WHERE id = p_run_id;
  UPDATE public.sanctions_sources SET
    last_checked_at = v_stamp, last_success_at = v_stamp,
    last_content_hash = p_content_hash, last_error = NULL
  WHERE id = v_source_id;
  DELETE FROM public.sanctions_import_staging WHERE run_id = p_run_id;

  RETURN jsonb_build_object(
    'source', v_code, 'status', 'succeeded',
    'records', v_count, 'added', v_added, 'changed', v_changed, 'removed', v_removed
  );
END;
$$;
REVOKE ALL ON FUNCTION public.finalize_sanctions_import(uuid, text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_sanctions_import(uuid, text, integer) TO service_role;
