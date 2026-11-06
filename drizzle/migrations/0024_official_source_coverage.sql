-- SS-024: programme-level official entrypoints, separate from dated legal acts.
-- All changes additive. 'mapped' needs an explicit official URL; unknown sources remain unverified.
ALTER TABLE public.sanctions_programmes
 ADD COLUMN IF NOT EXISTS source_mapping_status text NOT NULL DEFAULT 'needs_mapping',
 ADD COLUMN IF NOT EXISTS source_last_checked_at timestamptz,
 ADD COLUMN IF NOT EXISTS source_check_note text,
 ADD COLUMN IF NOT EXISTS official_programme_url text,
 ADD COLUMN IF NOT EXISTS official_programme_label text,
 ADD COLUMN IF NOT EXISTS official_programme_source text;
ALTER TABLE public.sanctions_programmes DROP CONSTRAINT IF EXISTS sanctions_programmes_source_mapping_status_check;
ALTER TABLE public.sanctions_programmes ADD CONSTRAINT sanctions_programmes_source_mapping_status_check
 CHECK (source_mapping_status IN ('needs_mapping','mapped','link_broken','review_required'));
ALTER TABLE public.sanctions_programmes DROP CONSTRAINT IF EXISTS official_programme_url_https;
ALTER TABLE public.sanctions_programmes ADD CONSTRAINT official_programme_url_https
 CHECK (official_programme_url IS NULL OR official_programme_url ~* '^https://[^[:space:]]+$');
ALTER TABLE public.sanctions_programmes DROP CONSTRAINT IF EXISTS official_programme_mapping_consistency;
ALTER TABLE public.sanctions_programmes ADD CONSTRAINT official_programme_mapping_consistency
 CHECK (source_mapping_status <> 'mapped' OR
  (official_programme_url IS NOT NULL AND official_programme_label IS NOT NULL
   AND official_programme_source IS NOT NULL));

-- Link health is distinct from publication approval.
ALTER TABLE public.official_documents
 ADD COLUMN IF NOT EXISTS link_check_status text NOT NULL DEFAULT 'unchecked',
 ADD COLUMN IF NOT EXISTS link_check_error text;
ALTER TABLE public.official_documents DROP CONSTRAINT IF EXISTS official_documents_link_check_status_check;
ALTER TABLE public.official_documents ADD CONSTRAINT official_documents_link_check_status_check
 CHECK (link_check_status IN ('unchecked','ok','redirected','broken','blocked'));
CREATE INDEX IF NOT EXISTS official_documents_link_check_idx
 ON public.official_documents(link_check_status,last_checked_at);
