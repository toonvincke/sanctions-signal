-- SS-022: additive catalogue for programme/document/intelligence relationships.
-- REVIEW ONLY: apply after Lovable Cloud schema/backup verification.
-- The existing static programme catalogue, routes and premium tables remain unchanged.
CREATE TABLE IF NOT EXISTS public.sanctions_programmes (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 jurisdiction text NOT NULL CHECK (jurisdiction IN ('eu','us','uk','un')),
 slug text NOT NULL,
 name text NOT NULL,
 group_name text,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT sanctions_programmes_key UNIQUE (jurisdiction, slug),
 CONSTRAINT sanctions_programmes_slug_valid CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);
CREATE TABLE IF NOT EXISTS public.official_documents (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 canonical_url text NOT NULL UNIQUE,
 title text NOT NULL,
 document_type text NOT NULL CHECK (document_type IN
 ('legislation','executive_order','guidance','faq','licensing','ruling','enforcement','resolution','other')),
 issuing_authority text,
 publication_date date,
 effective_date date,
 document_status text,
 last_checked_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT official_documents_https CHECK (canonical_url ~* '^https://[^[:space:]]+$')
);
CREATE TABLE IF NOT EXISTS public.programme_documents (
 programme_id uuid NOT NULL REFERENCES public.sanctions_programmes(id) ON DELETE CASCADE,
 document_id uuid NOT NULL REFERENCES public.official_documents(id) ON DELETE CASCADE,
 PRIMARY KEY (programme_id, document_id)
);
CREATE INDEX IF NOT EXISTS programme_documents_document_idx ON public.programme_documents(document_id);
CREATE TABLE IF NOT EXISTS public.programme_intelligence (
 programme_id uuid NOT NULL REFERENCES public.sanctions_programmes(id) ON DELETE CASCADE,
 record_id uuid NOT NULL REFERENCES public.intelligence_records(id) ON DELETE CASCADE,
 PRIMARY KEY (programme_id, record_id)
);
CREATE INDEX IF NOT EXISTS programme_intelligence_record_idx ON public.programme_intelligence(record_id);

-- Least privilege: metadata can be maintained only by trusted server operations.
-- No public SELECT policy until SS-023 decides which metadata may be published.
ALTER TABLE public.sanctions_programmes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.official_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programme_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programme_intelligence ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.sanctions_programmes, public.official_documents,
 public.programme_documents, public.programme_intelligence FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.sanctions_programmes, public.official_documents,
 public.programme_documents, public.programme_intelligence TO service_role;
COMMENT ON TABLE public.sanctions_programmes IS 'SS-022: programme IDs keyed by existing jurisdiction and URL slug; existing routes are unaffected.';
COMMENT ON TABLE public.official_documents IS 'SS-022: one record per canonical official HTTPS URL; verified content publication handled separately.';
