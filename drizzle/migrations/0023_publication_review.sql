-- SS-023, after 0012: reuse official_documents and intelligence_candidates.
-- Existing records stay available under SS-025 RLS; no automatic legacy publication.
-- Migration is designed to fail closed for all new content.

ALTER TABLE public.official_documents
 ADD COLUMN IF NOT EXISTS publication_state text NOT NULL DEFAULT 'draft',
 ADD COLUMN IF NOT EXISTS validated_at timestamptz,
 ADD COLUMN IF NOT EXISTS published_at timestamptz,
 ADD COLUMN IF NOT EXISTS withdrawn_at timestamptz,
 ADD COLUMN IF NOT EXISTS source_code text;
ALTER TABLE public.official_documents
 ADD CONSTRAINT official_document_publication_state_check
 CHECK (publication_state IN ('draft','published','withdrawn'));
ALTER TABLE public.official_documents
 ADD CONSTRAINT official_document_publish_requires_validation
 CHECK (publication_state <> 'published' OR
  (validated_at IS NOT NULL AND published_at IS NOT NULL AND withdrawn_at IS NULL
   AND publication_date IS NOT NULL AND issuing_authority IS NOT NULL));
CREATE INDEX IF NOT EXISTS official_documents_publication_idx
 ON public.official_documents(publication_state, publication_date DESC);

-- A curator must explicitly map a dedicated, official feed URL prefix to a programme.
-- No rules are enabled by default: a generic authority-wide feed must never be
-- mistaken for a specific sanctions programme.
CREATE TABLE public.official_document_source_rules (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 source_code text NOT NULL REFERENCES public.sanctions_sources(code),
 programme_id uuid NOT NULL REFERENCES public.sanctions_programmes(id) ON DELETE CASCADE,
 url_prefix text NOT NULL CHECK (url_prefix ~ '^https://[^[:space:]]+'),
 document_type text NOT NULL CHECK (document_type IN
  ('legislation','executive_order','guidance','faq','licensing','ruling','enforcement','resolution','other')),
 enabled boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(source_code, programme_id, url_prefix)
);
ALTER TABLE public.official_document_source_rules ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.official_document_source_rules FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.official_document_source_rules TO service_role;

-- SS-025 already blocks access to unverified analyses and populates headline previews
-- only for verified records. Do not loosen those policies.
-- Explicitly protect source metadata and mapping rows from unreviewed publication.
GRANT SELECT ON public.sanctions_programmes, public.official_documents, public.programme_documents TO anon, authenticated;
CREATE POLICY "public catalogue programmes" ON public.sanctions_programmes
 FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "published validated official documents" ON public.official_documents
 FOR SELECT TO anon, authenticated
 USING (publication_state = 'published' AND validated_at IS NOT NULL
 AND published_at IS NOT NULL AND withdrawn_at IS NULL);
CREATE POLICY "links for published documents only" ON public.programme_documents
 FOR SELECT TO anon, authenticated USING (
 EXISTS (SELECT 1 FROM public.official_documents d WHERE d.id = document_id
 AND d.publication_state = 'published' AND d.validated_at IS NOT NULL
 AND d.published_at IS NOT NULL AND d.withdrawn_at IS NULL));
-- No client INSERT/UPDATE/DELETE permissions on any of the above tables.

-- Keep the original candidate statuses, additionally allow withdrawn articles.
ALTER TABLE public.intelligence_candidates
 DROP CONSTRAINT IF EXISTS intelligence_candidates_status_check;
ALTER TABLE public.intelligence_candidates ADD CONSTRAINT intelligence_candidates_status_check
 CHECK (status IN ('pending_review','approved','rejected','published','withdrawn'));

CREATE TABLE public.editorial_publication_events (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 candidate_id uuid NOT NULL REFERENCES public.intelligence_candidates(id),
 record_id uuid REFERENCES public.intelligence_records(id),
 actor_id uuid NOT NULL REFERENCES auth.users(id),
 action text NOT NULL CHECK (action IN ('approve','reject','correct','withdraw')),
 notes text,
 occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX editorial_events_candidate_idx ON public.editorial_publication_events(candidate_id,occurred_at DESC);
ALTER TABLE public.editorial_publication_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.editorial_publication_events FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.editorial_publication_events TO service_role;
GRANT USAGE,SELECT ON SEQUENCE public.editorial_publication_events_id_seq TO service_role;

-- Called only with the server-only service-role key after verifying caller's JWT
-- and membership in public.user_roles. SECURITY INVOKER, never callable by users.
-- Every decision, record mutation, preview trigger and audit insertion are one transaction.
CREATE OR REPLACE FUNCTION public.finalize_intelligence_candidate(
 p_candidate_id uuid, p_decision text, p_actor uuid,
 p_record jsonb DEFAULT NULL, p_notes text DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
 c public.intelligence_candidates%ROWTYPE;
 r uuid;
 v_slug text;
BEGIN
 IF p_actor IS NULL OR p_decision NOT IN ('approve','reject','correct','withdraw') THEN
  RAISE EXCEPTION 'Invalid decision or reviewer';
 END IF;
 SELECT * INTO c FROM public.intelligence_candidates WHERE id=p_candidate_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Candidate not found'; END IF;
 IF p_decision IN ('approve','reject') AND c.status <> 'pending_review' THEN
  RAISE EXCEPTION 'Candidate already reviewed';
 END IF;
 IF p_decision IN ('withdraw','correct') AND c.status <> 'published' THEN
  RAISE EXCEPTION 'Only published articles may be corrected or withdrawn';
 END IF;
 IF p_decision IN ('approve','correct') THEN
  IF p_record IS NULL OR jsonb_typeof(p_record) <> 'object'
     OR nullif(trim(p_record->>'headline'),'') IS NULL
     OR nullif(trim(p_record->>'executive_summary'),'') IS NULL
     OR nullif(trim(p_record->>'source_facts'),'') IS NULL
     OR nullif(trim(p_record->>'practical_implications'),'') IS NULL
     OR nullif(trim(p_record->>'detailed_analysis'),'') IS NULL THEN
    RAISE EXCEPTION 'Incomplete editorial draft';
  END IF;
  -- Reject attempts to smuggle privileged fields into the publication payload.
  IF EXISTS (SELECT 1 FROM jsonb_object_keys(p_record) AS k
    WHERE k NOT IN ('slug','headline','executive_summary','source_facts','practical_implications',
    'detailed_analysis','content_type','legal_status','priority','tags','affected_entities',
    'affected_sectors','legal_provisions')) THEN
    RAISE EXCEPTION 'Unexpected editorial field';
  END IF;
 END IF;
 IF p_decision = 'reject' THEN
  UPDATE public.intelligence_candidates SET status='rejected',reviewer_id=p_actor,
    reviewed_at=now(),review_notes=p_notes,updated_at=now() WHERE id=c.id;
 ELSIF p_decision = 'approve' THEN
  v_slug := nullif(p_record->>'slug','');
  IF v_slug IS NULL OR v_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' THEN
   RAISE EXCEPTION 'Invalid published slug';
  END IF;
  INSERT INTO public.intelligence_records (
   slug, content_type, headline, executive_summary, source_facts,
   detailed_analysis, practical_implications, source_url, source_title,
   source_publisher, publication_date, legal_status, verification_status,
   affected_entities, affected_sectors, legal_provisions, tags, priority
  ) VALUES (
   v_slug, (p_record->>'content_type')::public.content_type,
   p_record->>'headline',p_record->>'executive_summary',p_record->>'source_facts',
   p_record->>'detailed_analysis',p_record->>'practical_implications',
   c.source_url,c.source_title,c.source_publisher,
   coalesce(c.published_at::date,now()::date),
   (p_record->>'legal_status')::public.legal_status,'verified'::public.verification_status,
   ARRAY(SELECT jsonb_array_elements_text(coalesce(p_record->'affected_entities','[]'::jsonb))),
   ARRAY(SELECT jsonb_array_elements_text(coalesce(p_record->'affected_sectors','[]'::jsonb))),
   ARRAY(SELECT jsonb_array_elements_text(coalesce(p_record->'legal_provisions','[]'::jsonb))),
   ARRAY(SELECT jsonb_array_elements_text(coalesce(p_record->'tags','[]'::jsonb))),
   coalesce((p_record->>'priority')::boolean,false)
  ) RETURNING id INTO r;
  UPDATE public.intelligence_candidates SET status='published',published_record_id=r,
   reviewer_id=p_actor,reviewed_at=now(),review_notes=p_notes,updated_at=now()
   WHERE id=c.id;
 ELSIF p_decision = 'withdraw' THEN
  r:=c.published_record_id;
  IF r IS NULL THEN RAISE EXCEPTION 'Published record missing'; END IF;
  UPDATE public.intelligence_records SET verification_status='unverified',updated_at=now()
   WHERE id=r;
  IF NOT FOUND THEN RAISE EXCEPTION 'Published record missing'; END IF;
  UPDATE public.intelligence_candidates SET status='withdrawn',reviewer_id=p_actor,
   reviewed_at=now(),review_notes=p_notes,updated_at=now() WHERE id=c.id;
 ELSE -- correct
  r:=c.published_record_id;
  IF r IS NULL THEN RAISE EXCEPTION 'Published record missing'; END IF;
  UPDATE public.intelligence_records SET
   headline=p_record->>'headline', executive_summary=p_record->>'executive_summary',
   source_facts=p_record->>'source_facts',detailed_analysis=p_record->>'detailed_analysis',
   practical_implications=p_record->>'practical_implications',
   legal_status=(p_record->>'legal_status')::public.legal_status,
   content_type=(p_record->>'content_type')::public.content_type,
   affected_entities=ARRAY(SELECT jsonb_array_elements_text(coalesce(p_record->'affected_entities','[]'::jsonb))),
   affected_sectors=ARRAY(SELECT jsonb_array_elements_text(coalesce(p_record->'affected_sectors','[]'::jsonb))),
   legal_provisions=ARRAY(SELECT jsonb_array_elements_text(coalesce(p_record->'legal_provisions','[]'::jsonb))),
   tags=ARRAY(SELECT jsonb_array_elements_text(coalesce(p_record->'tags','[]'::jsonb))),
   priority=coalesce((p_record->>'priority')::boolean,false),updated_at=now()
  WHERE id=r AND verification_status='verified';
  IF NOT FOUND THEN RAISE EXCEPTION 'Record is not currently published'; END IF;
  UPDATE public.intelligence_candidates SET ai_draft=p_record,reviewer_id=p_actor,
   reviewed_at=now(),review_notes=p_notes,updated_at=now() WHERE id=c.id;
 END IF;
 INSERT INTO public.editorial_publication_events(candidate_id,record_id,actor_id,action,notes)
 VALUES(c.id,coalesce(r,c.published_record_id),p_actor,p_decision,p_notes);
 RETURN jsonb_build_object('status',CASE WHEN p_decision='approve' THEN 'published'
  WHEN p_decision='withdraw' THEN 'withdrawn'
  WHEN p_decision='reject' THEN 'rejected' ELSE 'corrected' END,
  'record_id',coalesce(r,c.published_record_id));
END $$;
REVOKE ALL ON FUNCTION public.finalize_intelligence_candidate(uuid,text,uuid,jsonb,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_intelligence_candidate(uuid,text,uuid,jsonb,text) TO service_role;

-- Atomically upsert official metadata only for a curator-enabled source-to-programme
-- rule and a URL within its explicitly approved prefix. Withdrawn sources stay withdrawn.
CREATE OR REPLACE FUNCTION public.publish_official_document(
 p_rule_id uuid, p_url text, p_title text, p_issuer text, p_date date
) RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE v_rule public.official_document_source_rules%ROWTYPE; v_id uuid;
BEGIN
 SELECT * INTO v_rule FROM public.official_document_source_rules
  WHERE id=p_rule_id AND enabled=true FOR SHARE;
 IF NOT FOUND OR nullif(trim(p_title),'') IS NULL
 OR nullif(trim(p_issuer),'') IS NULL OR p_date IS NULL
 OR left(p_url,length(v_rule.url_prefix)) <> v_rule.url_prefix
 OR p_url !~ '^https://[^[:space:]]+$' THEN
  RAISE EXCEPTION 'Unapproved official source metadata';
 END IF;
 INSERT INTO public.official_documents
  (canonical_url,title,document_type,issuing_authority,publication_date,
   source_code,publication_state,validated_at,published_at)
 VALUES(p_url,p_title,v_rule.document_type,p_issuer,p_date,
  v_rule.source_code,'published',now(),now())
 ON CONFLICT(canonical_url) DO UPDATE SET
  title=excluded.title,issuing_authority=excluded.issuing_authority,
  publication_date=excluded.publication_date,source_code=excluded.source_code,
  publication_state='published',validated_at=now(),published_at=coalesce(public.official_documents.published_at,now()),
  updated_at=now()
 WHERE public.official_documents.withdrawn_at IS NULL
 RETURNING id INTO v_id;
 IF v_id IS NULL THEN RAISE EXCEPTION 'Withdrawn source cannot be republished automatically'; END IF;
 INSERT INTO public.programme_documents(programme_id,document_id)
 VALUES(v_rule.programme_id,v_id) ON CONFLICT DO NOTHING;
 RETURN v_id;
END $$;
REVOKE ALL ON FUNCTION public.publish_official_document(uuid,text,text,text,date) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.publish_official_document(uuid,text,text,text,date) TO service_role;
