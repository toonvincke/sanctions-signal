-- SQL is replay-safe for the already-created Lovable Cloud objects. Verify live schema before using elsewhere.
-- SS-025: paid entitlement is separate from ordinary login and admin roles.
-- Review the live Lovable Cloud schema before applying this migration.
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan text NOT NULL CHECK (plan IN ('premium_monthly', 'premium_annual', 'team')),
  status text NOT NULL CHECK (status IN ('active','trialing','past_due','canceled','expired')),
  current_period_end timestamptz NOT NULL,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  provider_customer_id text,
  provider_subscription_id text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.user_subscriptions FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.user_subscriptions TO authenticated;
GRANT ALL ON public.user_subscriptions TO service_role;
DROP POLICY IF EXISTS "subscription owner may read" ON public.user_subscriptions;
CREATE POLICY "subscription owner may read" ON public.user_subscriptions
  FOR SELECT TO authenticated USING (user_id = auth.uid());
-- No INSERT/UPDATE/DELETE for authenticated: checkout webhook/service role only.

-- Non-exposed RLS predicate. Server-side time checks prevent stale client flags.
CREATE OR REPLACE FUNCTION private.has_premium_access(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
 SELECT EXISTS (
  SELECT 1 FROM public.user_subscriptions s
  WHERE s.user_id = _user_id
    AND s.status IN ('active', 'trialing')
    AND s.current_period_end > now()
 );
$$;
REVOKE ALL ON FUNCTION private.has_premium_access(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.has_premium_access(uuid) TO authenticated, service_role;

-- Only *new protected content* goes here; no paywalled content in public tables or JS bundles.
CREATE TABLE IF NOT EXISTS public.programme_premium_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jurisdiction text NOT NULL CHECK (jurisdiction IN ('eu','us','uk','un')),
  programme_slug text NOT NULL,
  section_key text NOT NULL CHECK (section_key IN ('legal-framework','restrictions','guidance','licensing','updates')),
  title text NOT NULL,
  body text NOT NULL,
  source_url text,
  published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (jurisdiction, programme_slug, section_key, title)
);
CREATE INDEX IF NOT EXISTS programme_premium_sections_lookup
  ON public.programme_premium_sections (jurisdiction, programme_slug, section_key);
ALTER TABLE public.programme_premium_sections ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.programme_premium_sections FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.programme_premium_sections TO authenticated;
GRANT ALL ON public.programme_premium_sections TO service_role;
DROP POLICY IF EXISTS "published sections for active members or admin preview" ON public.programme_premium_sections;
CREATE POLICY "published sections for active members or admin preview"
 ON public.programme_premium_sections FOR SELECT TO authenticated USING (
   private.has_role(auth.uid(), 'admin'::public.app_role)
   OR (published AND private.has_premium_access(auth.uid()))
 );
-- Publishing uses trusted server operations only, and drafts stay inaccessible to ordinary users.
