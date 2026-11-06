-- SS-023 staging-only transaction smoke. No rows persist.
BEGIN;
DO $$
DECLARE
 v_admin uuid;
 v_candidate uuid;
 v_rejected uuid;
 v_programme uuid;
 v_source uuid;
 v_doc uuid;
 v_record uuid;
 v_slug text := 'ss023-smoke-' || replace(gen_random_uuid()::text,'-','');
 v_code text := 'ss023_' || left(replace(gen_random_uuid()::text,'-',''),12);
 v_json jsonb;
 v_count integer;
 v_bad boolean;
BEGIN
 SELECT user_id INTO v_admin FROM public.user_roles WHERE role='admin' LIMIT 1;
 IF v_admin IS NULL THEN RAISE EXCEPTION 'Missing staging admin test subject'; END IF;
 IF has_table_privilege('anon','public.intelligence_candidates','SELECT') OR
  has_table_privilege('authenticated','public.editorial_publication_events','SELECT') OR
  has_table_privilege('anon','public.official_documents','UPDATE') OR
  has_table_privilege('authenticated','public.official_documents','UPDATE') THEN
  RAISE EXCEPTION 'Unauthorized direct table access enabled';
 END IF;
 INSERT INTO public.intelligence_candidates(source_code,source_url,source_title,source_publisher,status,ai_draft)
 VALUES('ss023_smoke','https://eur-lex.europa.eu/eli/reg/2024/1745/oj','Smoke case','EUR-Lex','pending_review','{}')
 RETURNING id INTO v_candidate;
 v_json:= jsonb_build_object('slug',v_slug,'content_type','legislation','legal_status','in_force',
  'headline','Smoke article','executive_summary','Smoke overview','source_facts','Verified source facts',
  'detailed_analysis','Human-reviewed legal analysis','practical_implications','Human-reviewed implications',
  'priority',false,'tags',jsonb_build_array('smoke'),'affected_entities',jsonb_build_array(),
  'affected_sectors',jsonb_build_array(),'legal_provisions',jsonb_build_array());
 v_bad:=false;
 BEGIN
  PERFORM public.finalize_intelligence_candidate(v_candidate,'approve',v_admin,v_json - 'source_facts',null);
 EXCEPTION WHEN OTHERS THEN v_bad:=true; END;
 IF NOT v_bad OR (SELECT status FROM public.intelligence_candidates WHERE id=v_candidate)<>'pending_review'
  OR EXISTS(SELECT 1 FROM public.intelligence_records WHERE slug=v_slug)
  THEN RAISE EXCEPTION 'Incomplete approval did not fail atomically'; END IF;
 PERFORM public.finalize_intelligence_candidate(v_candidate,'approve',v_admin,v_json,'source checked');
 SELECT published_record_id INTO v_record FROM public.intelligence_candidates WHERE id=v_candidate AND status='published';
 IF v_record IS NULL OR NOT EXISTS (SELECT 1 FROM public.intelligence_previews WHERE record_id=v_record)
  THEN RAISE EXCEPTION 'Approved item not atomically published'; END IF;
 v_bad:=false;
 BEGIN PERFORM public.finalize_intelligence_candidate(v_candidate,'approve',v_admin,v_json,'duplicate');
 EXCEPTION WHEN OTHERS THEN v_bad:=true; END;
 IF NOT v_bad THEN RAISE EXCEPTION 'Duplicate approval accepted'; END IF;
 PERFORM public.finalize_intelligence_candidate(v_candidate,'correct',v_admin,
  jsonb_set(v_json - 'slug','{headline}','"Corrected headline"'),'corrected');
 IF (SELECT headline FROM public.intelligence_records WHERE id=v_record)<>'Corrected headline'
  THEN RAISE EXCEPTION 'Correction missing'; END IF;
 PERFORM public.finalize_intelligence_candidate(v_candidate,'withdraw',v_admin,null,'withdrawn');
 IF EXISTS(SELECT 1 FROM public.intelligence_previews WHERE record_id=v_record)
  OR (SELECT status FROM public.intelligence_candidates WHERE id=v_candidate)<>'withdrawn'
  THEN RAISE EXCEPTION 'Withdrawal leaked public preview'; END IF;
 IF (SELECT count(*) FROM public.editorial_publication_events WHERE candidate_id=v_candidate) <> 3
  THEN RAISE EXCEPTION 'Editorial audit events missing'; END IF;
 INSERT INTO public.intelligence_candidates(source_code,source_url,source_title,status)
 VALUES('ss023_smoke','https://eur-lex.europa.eu/eli/reg/2024/1746/oj','Rejected','pending_review') RETURNING id INTO v_rejected;
 PERFORM public.finalize_intelligence_candidate(v_rejected,'reject',v_admin,null,'source unreliable');
 IF (SELECT status FROM public.intelligence_candidates WHERE id=v_rejected)<>'rejected'
  THEN RAISE EXCEPTION 'Rejection missing'; END IF;

 INSERT INTO public.sanctions_sources(code,name,jurisdiction,source_type,source_url,enabled)
 VALUES(v_code,'Staging official feed','EU','rss','https://eur-lex.europa.eu/feed',false);
 INSERT INTO public.sanctions_programmes(jurisdiction,slug,name)
 VALUES('eu',v_slug,'Smoke programme') RETURNING id INTO v_programme;
 INSERT INTO public.official_document_source_rules(source_code,programme_id,url_prefix,document_type,enabled)
 VALUES(v_code,v_programme,'https://eur-lex.europa.eu/eli/reg/2024/','legislation',true)
 RETURNING id INTO v_source;
 v_doc:=public.publish_official_document(v_source,'https://eur-lex.europa.eu/eli/reg/2024/1745/oj',
 'Test regulation','EUR-Lex','2024-06-25');
 IF NOT EXISTS (SELECT 1 FROM public.official_documents WHERE id=v_doc
  AND publication_state='published' AND validated_at IS NOT NULL)
  OR NOT EXISTS(SELECT 1 FROM public.programme_documents WHERE document_id=v_doc AND programme_id=v_programme)
  THEN RAISE EXCEPTION 'Official metadata publication failed'; END IF;
 IF public.publish_official_document(v_source,'https://eur-lex.europa.eu/eli/reg/2024/1745/oj',
 'Test regulation','EUR-Lex','2024-06-25') <> v_doc THEN
  RAISE EXCEPTION 'Official source deduplication failed'; END IF;
 v_bad:=false;
 BEGIN
  PERFORM public.publish_official_document(v_source,'https://example.org/not-an-official-source',
  'Untrusted','EUR-Lex','2024-06-25');
 EXCEPTION WHEN OTHERS THEN v_bad:=true; END;
 IF NOT v_bad THEN RAISE EXCEPTION 'Unmapped source URL was published'; END IF;
 UPDATE public.official_documents SET publication_state='withdrawn', withdrawn_at=now() WHERE id=v_doc;
 v_bad:=false;
 BEGIN PERFORM public.publish_official_document(v_source,'https://eur-lex.europa.eu/eli/reg/2024/1745/oj',
 'Test regulation','EUR-Lex','2024-06-25');
 EXCEPTION WHEN OTHERS THEN v_bad:=true; END;
 IF NOT v_bad THEN RAISE EXCEPTION 'Withdrawn source automatically republished'; END IF;
END $$;
SET LOCAL ROLE anon;
DO $$ BEGIN
 IF EXISTS (SELECT 1 FROM public.official_documents WHERE canonical_url='https://eur-lex.europa.eu/eli/reg/2024/1745/oj')
 THEN RAISE EXCEPTION 'Anonymous users see withdrawn source'; END IF;
END $$;
RESET ROLE;
SELECT 'SS-023 staging smoke passed; rolling back' AS result;
ROLLBACK;
