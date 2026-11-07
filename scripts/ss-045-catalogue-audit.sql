-- SS-045 — Read-only catalogue audit, run against Atlas or staging.
-- Deliberately no INSERT, UPDATE, DELETE, publication or credential changes.
-- A passing release check requires all 14 rows to report passed=true.
-- Mapped means a source *reference exists*, not that the link was recently checked
-- or that the cited original legislation is still the consolidated law.
WITH checks AS (
 SELECT 'row_count' AS test, (SELECT count(*)=99 FROM public.sanctions_programmes) AS passed
 UNION ALL SELECT 'unique_keys',(SELECT count(*)=count(DISTINCT (jurisdiction,slug)) FROM public.sanctions_programmes)
 UNION ALL SELECT 'eu_43',(SELECT count(*)=43 FROM public.sanctions_programmes WHERE jurisdiction='eu')
 UNION ALL SELECT 'us_24',(SELECT count(*)=24 FROM public.sanctions_programmes WHERE jurisdiction='us')
 UNION ALL SELECT 'uk_17',(SELECT count(*)=17 FROM public.sanctions_programmes WHERE jurisdiction='uk')
 UNION ALL SELECT 'un_15',(SELECT count(*)=15 FROM public.sanctions_programmes WHERE jurisdiction='un')
 UNION ALL SELECT 'mapped_97',(SELECT count(*)=97 FROM public.sanctions_programmes WHERE source_mapping_status='mapped' AND official_programme_url IS NOT NULL AND official_programme_label IS NOT NULL AND official_programme_source IS NOT NULL)
 UNION ALL SELECT 'umbrella_us',(SELECT count(*)=1 FROM public.sanctions_programmes WHERE jurisdiction='us' AND slug='other-country-programmes' AND source_mapping_status='needs_mapping' AND official_programme_url IS NULL)
 UNION ALL SELECT 'umbrella_uk',(SELECT count(*)=1 FROM public.sanctions_programmes WHERE jurisdiction='uk' AND slug='country-and-conflict-regimes' AND source_mapping_status='needs_mapping' AND official_programme_url IS NULL)
 UNION ALL SELECT 'no_invalid_urls',(SELECT count(*)=0 FROM public.sanctions_programmes WHERE official_programme_url IS NOT NULL AND official_programme_url !~ '^https://[^[:space:]]+$')
 UNION ALL SELECT 'no_invalid_slugs',(SELECT count(*)=0 FROM public.sanctions_programmes WHERE slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$')
 UNION ALL SELECT 'catalogue_rls',(SELECT relrowsecurity FROM pg_class WHERE oid='public.sanctions_programmes'::regclass)
 UNION ALL SELECT 'documents_rls',(SELECT relrowsecurity FROM pg_class WHERE oid='public.official_documents'::regclass)
 UNION ALL SELECT 'links_rls',(SELECT relrowsecurity FROM pg_class WHERE oid='public.programme_documents'::regclass)
)
SELECT test,passed FROM checks ORDER BY test;
