-- SS-013: manual, idempotent EU feed registration for Atlas.
-- Not automatically applied; keep disabled until ingestion (#28) is validated.
-- Schema verified on 2026-11-11: public.sanctions_sources
INSERT INTO public.sanctions_sources
  (code, name, jurisdiction, source_type, source_url, enabled)
VALUES
  ('eu_eurlex_oj_l_rss', 'EUR-Lex Official Journal L RSS', 'EU', 'rss',
   'https://eur-lex.europa.eu/EN/display-feed.rss?rssId=222', false)
ON CONFLICT (code) DO NOTHING;

-- Verify manually:
-- SELECT code, source_url, source_type, enabled
-- FROM public.sanctions_sources
-- WHERE code = 'eu_eurlex_oj_l_rss';
