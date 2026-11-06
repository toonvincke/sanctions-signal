-- SS-022 repeatable staging smoke test. All writes are rolled back.
-- Run only after migration 0012 in a disposable staging database.
BEGIN;
DO $$
DECLARE p uuid; d uuid; r uuid; duplicate_rejected boolean;
BEGIN
  INSERT INTO public.sanctions_programmes (jurisdiction, slug, name)
    VALUES ('eu', 'ss-022-smoke', 'Temporary smoke programme') RETURNING id INTO p;
  duplicate_rejected := false;
  BEGIN
    INSERT INTO public.sanctions_programmes (jurisdiction, slug, name)
      VALUES ('eu', 'ss-022-smoke', 'Duplicate');
  EXCEPTION WHEN unique_violation THEN duplicate_rejected := true;
  END;
  IF NOT duplicate_rejected THEN RAISE EXCEPTION 'Duplicate programme accepted'; END IF;

  INSERT INTO public.official_documents (canonical_url, title, document_type)
    VALUES ('https://example.org/ss-022-smoke', 'Temporary smoke document', 'guidance') RETURNING id INTO d;
  duplicate_rejected := false;
  BEGIN
    INSERT INTO public.official_documents (canonical_url, title, document_type)
      VALUES ('https://example.org/ss-022-smoke', 'Duplicate', 'guidance');
  EXCEPTION WHEN unique_violation THEN duplicate_rejected := true;
  END;
  IF NOT duplicate_rejected THEN RAISE EXCEPTION 'Duplicate document accepted'; END IF;

  INSERT INTO public.programme_documents (programme_id, document_id) VALUES (p, d);
  duplicate_rejected := false;
  BEGIN
    INSERT INTO public.programme_documents (programme_id, document_id) VALUES (p, d);
  EXCEPTION WHEN unique_violation THEN duplicate_rejected := true;
  END;
  IF NOT duplicate_rejected THEN RAISE EXCEPTION 'Duplicate programme/document link accepted'; END IF;

  SELECT id INTO r FROM public.intelligence_records LIMIT 1;
  IF r IS NOT NULL THEN
    INSERT INTO public.programme_intelligence (programme_id, record_id) VALUES (p, r);
    IF NOT EXISTS (SELECT 1 FROM public.programme_intelligence WHERE programme_id = p AND record_id = r)
      THEN RAISE EXCEPTION 'Intelligence link missing'; END IF;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.programme_documents WHERE programme_id = p AND document_id = d)
    THEN RAISE EXCEPTION 'Document link missing'; END IF;
  IF EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname IN ('sanctions_programmes', 'official_documents', 'programme_documents', 'programme_intelligence')
      AND NOT c.relrowsecurity
  ) THEN RAISE EXCEPTION 'RLS disabled on SS-022 table'; END IF;
END $$;
SELECT 'SS-022 staging smoke test passed; transaction will roll back' AS result;
ROLLBACK;
