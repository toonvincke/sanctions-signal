-- Read-only post-migration security assertions. Run AFTER 0008–0011 are applied.
-- These assertions deliberately do not modify data or grant any privileges.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='user_subscriptions' AND rowsecurity) THEN
    RAISE EXCEPTION 'Subscriptions table missing or RLS disabled';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='programme_premium_sections' AND rowsecurity) THEN
    RAISE EXCEPTION 'Premium section table missing or RLS disabled';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='intelligence_previews' AND rowsecurity) THEN
    RAISE EXCEPTION 'Safe preview table missing or RLS disabled';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='intelligence_records' AND qual = 'true') THEN
    RAISE EXCEPTION 'Unrestricted intelligence SELECT policy remains';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='intelligence_records'
    AND policyname = 'verified full intelligence for premium or admins') THEN
    RAISE EXCEPTION 'Premium intelligence RLS policy missing';
  END IF;
  IF has_table_privilege('anon', 'public.intelligence_records', 'SELECT') THEN
    RAISE EXCEPTION 'Anonymous users must not read full intelligence';
  END IF;
  IF has_table_privilege('authenticated', 'public.intelligence_records', 'TRUNCATE') OR
     has_table_privilege('anon', 'public.intelligence_records', 'TRUNCATE') THEN
    RAISE EXCEPTION 'TRUNCATE privilege must be revoked';
  END IF;
  IF has_table_privilege('authenticated', 'public.user_subscriptions', 'UPDATE') OR
     has_table_privilege('authenticated', 'public.user_subscriptions', 'INSERT') THEN
    RAISE EXCEPTION 'Users must never change their entitlement';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='intelligence_previews'
      AND column_name IN ('executive_summary','source_facts','detailed_analysis','practical_implications')) THEN
    RAISE EXCEPTION 'Premium article body leaked into the public preview table';
  END IF;
END $$;
