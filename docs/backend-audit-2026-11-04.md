# Backend audit — 2026-11-04

## Evidence
User-provided semicolon-separated SQL exports from Lovable Cloud:
- 9 public tables, 66 public columns, all nine tables have RLS enabled.
- 15 policies across those nine tables.
- One trigger returned by an information_schema query restricted to public: profiles_touch_updated_at. **This does not prove that auth.users triggers are absent**, because auth.users is outside public.
- Monitoring tables are absent from the exported public schema: sanctions_sources, sanctions_import_runs, sanctions_list_entries, intelligence_candidates, intelligence_record_versions, assistant_feedback.

## Confirmed source-code discrepancies
1. Monitoring and history migrations exist in supabase/migrations but are not reflected in the exported live schema.
2. Core Drizzle and Supabase SQL migrations overlap. Drizzle profiles/roles migration has no equivalent in the Supabase migration sequence although the live schema contains both tables.
3. Candidate review and monitoring policies use app_metadata.role, while the app reads user_roles. These can disagree.
4. sanctions-sync upserts list entries but does not mark missing entries inactive or maintain last_seen_at consistently; avoid presenting its dataset as complete/current until corrected.
5. Candidate approval marks AI output verified without a separate source-verification step.
6. Monitoring workflow depends on secrets and deployed functions that were not independently verified.
7. Seed configuration contains OFAC/UK/UN but no EU list source.
8. Assistant lacks evident per-user rate limiting.

## Implementation gates
1. **Inventory live deployment:** inspect Supabase migration history, function deployment, auth.users triggers and actual environment ownership. Do not run the original core schema migrations on this populated database.
2. **Reconcile schema:** apply the existing monitoring/history migrations only after checking applied versions and backups; verify six tables and history trigger. Backfill and align migration history without replaying core seed inserts.
3. **Unify roles:** use user_roles/has_role as the sole source of truth in candidate-review and editorial RLS. Do not promote users through user-editable metadata.
4. **Improve ingestion:** implement validated per-source parsing, change/removal reconciliation with transactional safety, source health alerts, and test fixtures for OFAC/UK/UN. Keep source-specific import statuses.
5. **Add EU:** identify and validate a legally reusable official EU source and parser.
6. **AI:** separate approval from verification, add rate limits and structured citation validation.
7. **Scheduling:** verify existing workflow secrets and endpoint ownership before changing jobs.
8. **Operations:** run RLS tests, smoke tests, restore tests, monitoring alerts, and deployment verification.

## Limitations
GitHub source was reviewed, not executed. The connected Supabase tool returned no accessible projects. No SQL migration or function was deployed to the live Lovable Cloud database. This audit is not a production penetration test.
