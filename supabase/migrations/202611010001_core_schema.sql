
create type public.content_type as enum ('sanctions_development','case_law','enforcement_action','guidance','legislation','circumvention');
create type public.verification_status as enum ('verified','pending_review','unverified');
create type public.legal_status as enum ('final_judgment','interim','ag_opinion','settlement','penalty_notice','conviction','allegation','in_force','announced','not_applicable');

create table public.jurisdictions (id uuid primary key default gen_random_uuid(), code text unique not null, name text not null);
create table public.regimes (id uuid primary key default gen_random_uuid(), slug text unique not null, name text not null, target_country text);
create table public.authorities (id uuid primary key default gen_random_uuid(), slug text unique not null, name text not null, short_name text not null, jurisdiction_id uuid references public.jurisdictions(id), website text);
create table public.categories (id uuid primary key default gen_random_uuid(), slug text unique not null, name text not null);

create table public.intelligence_records (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  content_type public.content_type not null,
  headline text not null,
  source_title text,
  executive_summary text not null,
  source_facts text not null,
  detailed_analysis text,
  practical_implications text,
  publication_date date not null,
  event_date date,
  effective_date date,
  jurisdiction_id uuid references public.jurisdictions(id),
  regime_id uuid references public.regimes(id),
  authority_id uuid references public.authorities(id),
  affected_entities text[] not null default '{}',
  affected_sectors text[] not null default '{}',
  legal_provisions text[] not null default '{}',
  case_number text,
  penalty_amount numeric,
  penalty_currency text,
  legal_status public.legal_status not null default 'not_applicable',
  violation text,
  circumvention_methods text[] not null default '{}',
  control_failures text[] not null default '{}',
  source_url text not null,
  source_publisher text,
  retrieved_at timestamptz default now(),
  verification_status public.verification_status not null default 'pending_review',
  priority boolean not null default false,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search tsvector generated always as (
    setweight(to_tsvector('english', coalesce(headline,'')), 'A') ||
    setweight(to_tsvector('english', coalesce(executive_summary,'')), 'B') ||
    setweight(to_tsvector('english', coalesce(source_facts,'') || ' ' || coalesce(detailed_analysis,'') || ' ' || coalesce(case_number,'')), 'C')
  ) stored
);
create index on public.intelligence_records using gin(search);
create index on public.intelligence_records (publication_date desc);

create table public.record_categories (record_id uuid references public.intelligence_records(id) on delete cascade, category_id uuid references public.categories(id) on delete cascade, primary key (record_id, category_id));

create table public.bookmarks (id uuid primary key default gen_random_uuid(), user_id uuid not null, record_id uuid not null references public.intelligence_records(id) on delete cascade, note text, created_at timestamptz not null default now(), unique(user_id, record_id));

grant select on public.jurisdictions, public.regimes, public.authorities, public.categories, public.intelligence_records, public.record_categories to authenticated;
grant all on public.jurisdictions, public.regimes, public.authorities, public.categories, public.intelligence_records, public.record_categories, public.bookmarks to service_role;
grant select, insert, update, delete on public.bookmarks to authenticated;

alter table public.jurisdictions enable row level security;
alter table public.regimes enable row level security;
alter table public.authorities enable row level security;
alter table public.categories enable row level security;
alter table public.intelligence_records enable row level security;
alter table public.record_categories enable row level security;
alter table public.bookmarks enable row level security;

create policy "auth read" on public.jurisdictions for select to authenticated using (true);
create policy "auth read" on public.regimes for select to authenticated using (true);
create policy "auth read" on public.authorities for select to authenticated using (true);
create policy "auth read" on public.categories for select to authenticated using (true);
create policy "auth read" on public.intelligence_records for select to authenticated using (true);
create policy "auth read" on public.record_categories for select to authenticated using (true);
create policy "own bookmarks select" on public.bookmarks for select to authenticated using (auth.uid() = user_id);
create policy "own bookmarks insert" on public.bookmarks for insert to authenticated with check (auth.uid() = user_id);
create policy "own bookmarks update" on public.bookmarks for update to authenticated using (auth.uid() = user_id);
create policy "own bookmarks delete" on public.bookmarks for delete to authenticated using (auth.uid() = user_id);

insert into public.jurisdictions (code,name) values ('EU','European Union'),('US','United States'),('UK','United Kingdom'),('UN','United Nations');
insert into public.regimes (slug,name,target_country) values ('russia','Russia / Ukraine','Russia'),('iran','Iran','Iran'),('cyber-crypto','Cyber-related & Virtual Currency',null),('multi','Multiple programmes',null);
insert into public.authorities (slug,name,short_name,jurisdiction_id,website) values
('eu-council','Council of the European Union','EU Council',(select id from public.jurisdictions where code='EU'),'https://www.consilium.europa.eu'),
('eu-commission','European Commission','EU Commission',(select id from public.jurisdictions where code='EU'),'https://finance.ec.europa.eu'),
('cjeu','Court of Justice of the European Union','CJEU',(select id from public.jurisdictions where code='EU'),'https://curia.europa.eu'),
('ofac','Office of Foreign Assets Control, US Treasury','OFAC',(select id from public.jurisdictions where code='US'),'https://ofac.treasury.gov'),
('bis','Bureau of Industry and Security, US Commerce','BIS',(select id from public.jurisdictions where code='US'),'https://www.bis.gov'),
('ofsi','Office of Financial Sanctions Implementation, HM Treasury','OFSI',(select id from public.jurisdictions where code='UK'),'https://www.gov.uk/government/organisations/office-of-financial-sanctions-implementation'),
('uksc','Supreme Court of the United Kingdom','UKSC',(select id from public.jurisdictions where code='UK'),'https://www.supremecourt.uk');
insert into public.categories (slug,name) values ('designations','Designations & Delistings'),('trade-restrictions','Trade Restrictions'),('financial-services','Financial Services'),('crypto','Virtual Assets'),('due-diligence','Due Diligence & Controls'),('ownership-control','Ownership & Control'),('export-controls','Export Controls'),('judicial-review','Judicial Review'),('penalties','Penalties');
