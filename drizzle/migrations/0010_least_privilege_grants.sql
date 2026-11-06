-- SS-025: remove legacy default broad SQL grants. RLS does not protect TRUNCATE.
-- Preserve the intentional operations already defined by published RLS policies.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC, anon, authenticated;

-- Read-only public headlines, with only approved items populated by trigger.
GRANT SELECT ON public.intelligence_previews TO anon, authenticated;

-- Non-sensitive catalogues (public HTML uses a static programme catalogue).
GRANT SELECT ON public.jurisdictions, public.regimes, public.authorities, public.categories TO authenticated;

-- Confidential intelligence: the SELECT RLS policy requires verified+premium or admin.
GRANT SELECT ON public.intelligence_records, public.record_categories TO authenticated;

-- Protected premium content and read-only subscription status for its owner.
GRANT SELECT ON public.user_subscriptions, public.programme_premium_sections TO authenticated;

-- Personal user data: update only the display name field.
GRANT SELECT ON public.profiles, public.user_roles TO authenticated;
GRANT UPDATE (full_name) ON public.profiles TO authenticated;

-- Personal bookmarks and assistant feedback remain supported.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookmarks TO authenticated;
GRANT SELECT, INSERT ON public.assistant_feedback TO authenticated;

-- Admin-only candidates have their own existing admin RLS ALL policy.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.intelligence_candidates TO authenticated;
GRANT SELECT ON public.intelligence_record_versions, public.sanctions_import_runs TO authenticated;

-- Existing authenticated sanctions list feature (not the programme legal-content paywall).
GRANT SELECT ON public.sanctions_sources, public.sanctions_list_entries TO authenticated;

-- Service-role backend duties and jobs remain supported. Never expose this key to browsers.
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- ALL role grants removed above include TRUNCATE, TRIGGER and REFERENCES.
-- Check future tables' default privileges separately; restrict them on creation.
