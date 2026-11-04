-- Security hardening after the 2026-11-04 live-schema audit.
-- Requires the existing profiles/user_roles schema.
-- Do not apply until the Lovable Cloud deployment and migration history are reconciled.

-- Prevent authenticated users from probing other users' roles via the RPC.
-- Existing RLS policies call has_role(auth.uid(), 'admin'), which remains supported.
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select _user_id = (select auth.uid())
     and exists (
       select 1 from public.user_roles
       where user_id = _user_id and role = _role
     );
$$;
revoke execute on function public.has_role(uuid, public.app_role) from public, anon;
grant execute on function public.has_role(uuid, public.app_role) to authenticated, service_role;

-- Repair the two auth triggers if missing. Existing triggers are not duplicated.
do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgrelid = 'auth.users'::regclass
      and tgname = 'on_auth_user_created'
      and not tgisinternal
  ) then
    create trigger on_auth_user_created
      after insert on auth.users
      for each row execute function public.handle_new_user();
  end if;
  if not exists (
    select 1 from pg_trigger
    where tgrelid = 'auth.users'::regclass
      and tgname = 'on_auth_user_email_changed'
      and not tgisinternal
  ) then
    create trigger on_auth_user_email_changed
      after update of email on auth.users
      for each row when (old.email is distinct from new.email)
      execute function public.handle_user_email_change();
  end if;
end $$;
