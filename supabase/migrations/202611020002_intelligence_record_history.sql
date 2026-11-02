-- Preserve previous intelligence record content before every update.
create or replace function public.capture_intelligence_record_version()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  next_version integer;
begin
  select coalesce(max(version_number), 0) + 1 into next_version
  from public.intelligence_record_versions
  where record_id = old.id;

  insert into public.intelligence_record_versions(record_id, version_number, snapshot, changed_by, change_reason)
  values (old.id, next_version, to_jsonb(old), auth.uid(), 'Automatic snapshot before record update');

  return new;
end;
$$;

drop trigger if exists intelligence_records_version_before_update on public.intelligence_records;
create trigger intelligence_records_version_before_update
before update on public.intelligence_records
for each row execute function public.capture_intelligence_record_version();
