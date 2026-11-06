# SS-024 — Official programme source coverage and release control

## Implemented in stacked PR #43
- Lovable staging catalogue: **99 programmes**: EU 43, US 24, UK 17, UN 15 (6 November 2026).
- **75 programmes have explicitly mapped official references**:
  - 21 US: OFAC programme index entry pages;
  - 15 UK: GOV.UK sanctions guidance pages;
  - 15 UN: Security Council sanctions-committee pages;
  - 24 EU: EUR-Lex ELI links to the **original** explicitly identified Council Regulation. Original texts may be amended or repealed; no claim of current consolidated legal status.
- Remaining **24 programmes** show an explicit unmapped state and a clearly labeled jurisdiction-level portal, not a fabricated programme citation.
- Source-of-truth curated mapping in `scripts/ss-024-curated-sources.ts`; checked-in repeatable mapping SQL in `scripts/ss-024-curated-source-backfill.sql`. Do not overwrite curator-changed mappings.
- `drizzle/migrations/0024_official_source_coverage.sql`: additive programme source status, official landing page URL/label/issuer and link health metadata. Migration applied and successfully replayed in isolated staging.
- Programme UI separates official landing references, published dated source documents and Premium legal analyses. SS-023 provides RLS for published documents; AI content requires editorial approval.
- Link monitoring: `supabase/functions/_shared/official-link-check.ts` rejects unsafe URLs/redirects, uses bounded timeouts and distinguishes confirmed 404/410 from 403, rate limiting and temporary outages.
- `supabase/functions/official-source-check/index.ts` uses server-only cron secret and service-role access to check curated URLs in bounded batches. It updates programme check timestamps and marks links broken **only** after an explicit 404/410; a blocked request cannot automatically withdraw a source.
- A **manual-only** GitHub Action `.github/workflows/official-source-check.yml` exists. Do not enable schedule or invoke it against production until staging deployment and runtime check.
- CI now includes SQL migrations, editorial workflow and RLS integration test `tests/sql/ss018_publication_integration.sql` (plus existing SS-025 tests), frontend catalogue/tests, Deno checks, and mapping inventory validation.

## Verified (6 November 2026)
- 0024 migration applied in separate Lovable staging project `c83df1e5-0838-4ae4-80dd-3e1426118c05`, **not production**. Both rollback-only SS-023 and SS-024 staging SQL smoke tests passed.
- Staging database: 75 mapped; 24 awaiting source mapping. No pending candidates, official document entries or audit events (no editorial test data persisted).
- GitHub Actions: publication-integration, database, parser, XML, OpenAI, Premium RLS, frontend and catalogue validation green on last confirmed PR head (see latest PR checks).
- Existing Lovable preview projects have **not** received the featurebranch frontend/Edge Functions.

## Remaining acceptance checks under SS-018 (#24)
1. Deploy the exact reviewed code to **the separate Lovable staging app**, including the `candidate-review`, `intelligence-discover` and `official-source-check` Edge Functions; preserve database schema history and keys.
2. Run real authenticated admin/free/premium/anonymous browser and network tests. Confirm queue visibility, approval, rejection, correction, withdrawal, audit history, publication preview, and correct route refresh.
3. Perform bounded HTTP link checks for all mapped entries. Existing staging mapping timestamps are **not** evidence of reachability: they are null until the checker runs. Confirm redirects and special publisher behavior; correct 404s and ensure 403/429 do not mark legally valid sources broken.
4. Enrich remaining 24 programmes with verified primary source links where available. Coverage remains transparent until then.
5. Enable daily source update monitoring only when trusted feeder rules are curated and tested. Further official guidance/licensing document-level enrichment should follow validated programme mapping.
6. Inspect whether a merge to `main` triggers Lovable deployment or GitHub Actions jobs before merging. No production rollout without owner consent.

The open 24 mappings and runtime E2E are not silently marked completed. This branch is stacked on SS-023 PR #42; merge order is #42 then #43 after QA, with an explicit check for deployment side effects.
