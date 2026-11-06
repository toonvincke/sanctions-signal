-- SS-023: isolated, fail-closed publication pipeline. Does not alter legacy readers.
create table if not exists public.official_source_publications (
 id uuid primary key default gen_random_uuid(),
 source_url text not null unique check (source_url ~ '^https://[^[:space:]]+$'),
 publisher text not null,
 source_type text not null check (source_type in ('legislation','guidance','case_law','enforcement','official_notice')),
 source_date date not null,
 programme_slug text not null,
 title text not null,
 validated_at timestamptz,
 published_at timestamptz,
 withdrawn_at timestamptz,
 created_at timestamptz not null default now(),
 constraint source_publication_valid check (published_at is null or (validated_at is not null and withdrawn_at is null))
);
create table if not exists public.editorial_reviews (
 id uuid primary key default gen_random_uuid(),
 source_id uuid references public.official_source_publications(id),
 draft_text text not null,
 kind text not null check (kind in ('ai_summary','legal_analysis','practical_implications')),
 status text not null default 'draft' check (status in ('draft','pending','approved','rejected','withdrawn')),
 reviewed_by uuid,
 reviewed_at timestamptz,
 published_at timestamptz,
 created_at timestamptz not null default now(),
 constraint editorial_approval_required check (published_at is null or (status = 'approved' and reviewed_by is not null and reviewed_at is not null))
);
create table if not exists public.editorial_review_events (
 id bigint generated always as identity primary key,
 review_id uuid not null references public.editorial_reviews(id),
 actor_id uuid not null,
 action text not null,
 occurred_at timestamptz not null default now()
);
alter table public.official_source_publications enable row level security;
alter table public.editorial_reviews enable row level security;
alter table public.editorial_review_events enable row level security;
revoke all on public.official_source_publications, public.editorial_reviews, public.editorial_review_events from public, anon, authenticated;
grant select on public.official_source_publications to anon, authenticated;
create policy "published validated official metadata only" on public.official_source_publications
 for select to anon, authenticated using (published_at is not null and validated_at is not null and withdrawn_at is null);
-- No user-facing SELECT/WRITE policy for editorial drafts: server-side service role only.
grant all on public.official_source_publications, public.editorial_reviews, public.editorial_review_events to service_role;
