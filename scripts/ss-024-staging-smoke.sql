-- SS-024: rollback-only source coverage smoke, requires 0023 and 0024 applied.
BEGIN;
DO $$
DECLARE total integer; pending integer;
BEGIN
 SELECT count(*) INTO total FROM public.sanctions_programmes;
 SELECT count(*) INTO pending FROM public.sanctions_programmes
 WHERE source_mapping_status IN ('needs_mapping','mapped','link_broken','review_required');
 IF total = 0 OR total <> pending THEN
  RAISE EXCEPTION 'Not all programmes have a source coverage status';
 END IF;
 IF has_table_privilege('anon','public.official_documents','UPDATE') OR
    has_table_privilege('authenticated','public.sanctions_programmes','UPDATE') THEN
  RAISE EXCEPTION 'Public users may change source metadata';
 END IF;
END $$;
SET LOCAL ROLE anon;
DO $$
DECLARE v integer;
BEGIN
 SELECT count(*) INTO v FROM public.sanctions_programmes;
 IF v < 1 THEN RAISE EXCEPTION 'Public programme catalogue unexpectedly hidden'; END IF;
 IF EXISTS(SELECT 1 FROM public.official_documents WHERE publication_state <> 'published')
 THEN RAISE EXCEPTION 'Nonpublished official documents exposed'; END IF;
END $$;
RESET ROLE;
SELECT 'SS-024 coverage and RLS checks passed; rolling back' AS result;
ROLLBACK;
