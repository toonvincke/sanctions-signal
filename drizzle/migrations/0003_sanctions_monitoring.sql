-- Sanctions Signal: monitoring and editorial workflow foundation.
-- Apply this migration to the linked Supabase/Lovable Cloud project before deploying functions.

create extension if not exists pgcrypto;

create table if not exists public.sanctions_sources (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  jurisdiction text not null,
  source_type text not null check (source_type in ('sanctions_list','rss','web_page','api')),
  source_url text not null,
  enabled boolean not null default true,
  last_checked_at timestamptz,
  last_success_at timestamptz,
  last_content_hash text,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sanctions_import_runs (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references public.sanctions_sources(id) on delete set null,
  source_code text not null,
  status text not null check (status in ('running','succeeded','failed','unchanged')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  http_status integer,
  content_hash text,
  records_seen integer not null default 0,
  records_added integer not null default 0,
  records_changed integer not null default 0,
  records_removed integer not null default 0,
  error_message text,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.sanctions_list_entries (
  id uuid primary key default gen_random_uuid(),
  source_code text not null,
  source_entry_id text not null,
  subject_name text not null,
  subject_type text,
  programs text[] not null default '{}',
  aliases text[] not null default '{}',
  identifying_data jsonb not null default '{}'::jsonb,
  source_url text not null,
  source_updated_at timestamptz,
  content_hash text not null,
  active boolean not null default true,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  removed_at timestamptz,
  unique (source_code, source_entry_id)
);

create index if not exists sanctions_list_entries_name_idx
  on public.sanctions_list_entries using gin (to_tsvector('simple', subject_name));
create index if not exists sanctions_list_entries_source_active_idx
  on public.sanctions_list_entries(source_code, active);

create table if not exists public.intelligence_candidates (
  id uuid primary key default gen_random_uuid(),
  source_code text not null,
  source_url text not null unique,
  source_title text not null,
  source_publisher text,
  published_at timestamptz,
  discovered_at timestamptz not null default now(),
  content_hash text,
  extracted_text text,
  ai_draft jsonb,
  status text not null default 'pending_review'
    check (status in ('pending_review','approved','rejected','published')),
  reviewer_id uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  published_record_id uuid references public.intelligence_records(id) on delete set null,
  review_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists intelligence_candidates_status_idx
  on public.intelligence_candidates(status, discovered_at desc);

create table if not exists public.intelligence_record_versions (
  id uuid primary key default gen_random_uuid(),
  record_id uuid not null references public.intelligence_records(id) on delete cascade,
  version_number integer not null,
  snapshot jsonb not null,
  changed_by uuid references auth.users(id) on delete set null,
  change_reason text,
  created_at timestamptz not null default now(),
  unique(record_id, version_number)
);

create table if not exists public.assistant_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question text not null,
  answer text not null,
  cited_record_ids uuid[] not null default '{}',
  feedback text check (feedback in ('helpful','not_helpful')),
  created_at timestamptz not null default now()
);

-- Read-only access to source metadata and imported list entries for signed-in portal users.
alter table public.sanctions_sources enable row level security;
alter table public.sanctions_import_runs enable row level security;
alter table public.sanctions_list_entries enable row level security;
alter table public.intelligence_candidates enable row level security;
alter table public.intelligence_record_versions enable row level security;
alter table public.assistant_feedback enable row level security;

drop policy if exists "Authenticated users can read sanctions sources" on public.sanctions_sources;
create policy "Authenticated users can read sanctions sources"
  on public.sanctions_sources for select to authenticated using (true);

drop policy if exists "Authenticated users can read sanctions list entries" on public.sanctions_list_entries;
create policy "Authenticated users can read sanctions list entries"
  on public.sanctions_list_entries for select to authenticated using (true);

-- Editorial candidates and import logs are restricted to administrators.
-- Set app_metadata.role = 'admin' for designated reviewer accounts.
drop policy if exists "Admins can read import runs" on public.sanctions_import_runs;
create policy "Admins can read import runs"
  on public.sanctions_import_runs for select to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Admins can manage intelligence candidates" on public.intelligence_candidates;
create policy "Admins can manage intelligence candidates"
  on public.intelligence_candidates for all to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Admins can read record versions" on public.intelligence_record_versions;
create policy "Admins can read record versions"
  on public.intelligence_record_versions for select to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Users can submit own assistant feedback" on public.assistant_feedback;
create policy "Users can submit own assistant feedback"
  on public.assistant_feedback for insert to authenticated
  with check (auth.uid() = user_id);
drop policy if exists "Users can read own assistant feedback" on public.assistant_feedback;
create policy "Users can read own assistant feedback"
  on public.assistant_feedback for select to authenticated
  using (auth.uid() = user_id);

-- Only service_role can write monitoring data; no client-side insert/update policies exist.
grant select on public.sanctions_sources, public.sanctions_list_entries to authenticated;
grant select on public.sanctions_import_runs, public.intelligence_candidates,
  public.intelligence_record_versions to authenticated;
grant insert, select on public.assistant_feedback to authenticated;
grant all on public.sanctions_sources, public.sanctions_import_runs,
  public.sanctions_list_entries, public.intelligence_candidates,
  public.intelligence_record_versions, public.assistant_feedback to service_role;

-- Initial authoritative list feeds. EU's export URL is configurable because its
-- public download endpoint can require a generated access token.
insert into public.sanctions_sources(code,name,jurisdiction,source_type,source_url)
values
 ('ofac_sdn','US OFAC SDN List','US','sanctions_list','https://sanctionslistservice.ofac.treas.gov/api/PublicationPreview/exports/SDN.CSV'),
 ('ofac_non_sdn','US OFAC Consolidated Non-SDN List','US','sanctions_list','https://sanctionslistservice.ofac.treas.gov/api/PublicationPreview/exports/CONS_PRIM.CSV'),
 ('uk_sanctions','UK Sanctions List','UK','sanctions_list','https://sanctionslist.fcdo.gov.uk/docs/UK-Sanctions-List.csv'),
 ('un_consolidated','UN Security Council Consolidated List','UN','sanctions_list','https://scsanctions.un.org/resources/xml/en/consolidated.xml')
on conflict (code) do update set name=excluded.name,jurisdiction=excluded.jurisdiction,
  source_type=excluded.source_type,source_url=excluded.source_url,updated_at=now();
