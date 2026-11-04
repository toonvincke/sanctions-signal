-- Role check helper lives in a schema that is not exposed through the Data API.
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;
REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;

-- Existing admin policies: switch to the private helper.
DROP POLICY IF EXISTS "admin profile select" ON public.profiles;
CREATE POLICY "admin profile select" ON public.profiles
  FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "admin roles select" ON public.user_roles;
CREATE POLICY "admin roles select" ON public.user_roles
  FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'::public.app_role));

-- Monitoring/editorial tables: use user_roles instead of login-account metadata.
DROP POLICY IF EXISTS "Admins can read import runs" ON public.sanctions_import_runs;
CREATE POLICY "Admins can read import runs" ON public.sanctions_import_runs
  FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can manage intelligence candidates" ON public.intelligence_candidates;
CREATE POLICY "Admins can manage intelligence candidates" ON public.intelligence_candidates
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can read record versions" ON public.intelligence_record_versions;
CREATE POLICY "Admins can read record versions" ON public.intelligence_record_versions
  FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'::public.app_role));

-- The old public helper is no longer used by policies; make it run with the caller's own
-- permissions so it cannot reveal other users' roles when called through the API.
ALTER FUNCTION public.has_role(uuid, public.app_role) SECURITY INVOKER;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
COMMENT ON FUNCTION public.has_role(uuid, public.app_role) IS 'DEPRECATED: replaced by private.has_role for policies';

-- Lock internal trigger helpers so they cannot be called through the API.
REVOKE EXECUTE ON FUNCTION public.capture_intelligence_record_version() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_user_email_change() FROM PUBLIC, anon, authenticated;
