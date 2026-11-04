-- Align monitoring/editorial RLS with the application's existing user_roles source of truth.
-- Apply only after confirming public.has_role(uuid, public.app_role) exists.
-- Non-destructive: replaces only the three known policies.

drop policy if exists "Admins can read import runs" on public.sanctions_import_runs;
create policy "Admins can read import runs"
  on public.sanctions_import_runs for select to authenticated
  using ((select public.has_role((select auth.uid()), 'admin'::public.app_role)));

drop policy if exists "Admins can manage intelligence candidates" on public.intelligence_candidates;
create policy "Admins can manage intelligence candidates"
  on public.intelligence_candidates for all to authenticated
  using ((select public.has_role((select auth.uid()), 'admin'::public.app_role)))
  with check ((select public.has_role((select auth.uid()), 'admin'::public.app_role)));

drop policy if exists "Admins can read record versions" on public.intelligence_record_versions;
create policy "Admins can read record versions"
  on public.intelligence_record_versions for select to authenticated
  using ((select public.has_role((select auth.uid()), 'admin'::public.app_role)));
