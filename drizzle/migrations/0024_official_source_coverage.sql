-- SS-024: coverage status for every programme. Never treat a jurisdiction portal as a verified citation.
ALTER TABLE public.sanctions_programmes
 ADD COLUMN IF NOT EXISTS source_mapping_status text NOT NULL DEFAULT 'needs_mapping',
 ADD COLUMN IF NOT EXISTS source_last_checked_at timestamptz,
 ADD COLUMN IF NOT EXISTS source_check_note text;
ALTER TABLE public.sanctions_programmes DROP CONSTRAINT IF EXISTS sanctions_programmes_source_mapping_status_check;
ALTER TABLE public.sanctions_programmes ADD CONSTRAINT sanctions_programmes_source_mapping_status_check
 CHECK (source_mapping_status IN ('needs_mapping','mapped','link_broken','review_required'));

-- Link monitoring is separate from document publication approval.
ALTER TABLE public.official_documents
 ADD COLUMN IF NOT EXISTS link_check_status text NOT NULL DEFAULT 'unchecked',
 ADD COLUMN IF NOT EXISTS link_check_error text;
ALTER TABLE public.official_documents DROP CONSTRAINT IF EXISTS official_documents_link_check_status_check;
ALTER TABLE public.official_documents ADD CONSTRAINT official_documents_link_check_status_check
 CHECK (link_check_status IN ('unchecked','ok','redirected','broken','blocked'));
CREATE INDEX IF NOT EXISTS official_documents_link_check_idx
 ON public.official_documents(link_check_status,last_checked_at);
