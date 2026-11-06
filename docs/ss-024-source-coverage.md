# SS-024 — Official programme source coverage and release control

## Implemented in stacked PR #43
- Lovable staging catalogue: **99 programmes**: EU 43, US 24, UK 17, UN 15 (6 November 2026).
- **97 programmes have explicitly mapped official references**:
  - 23 US: OFAC programme index entry pages;
  - 16 UK: GOV.UK / legislation.gov.uk sanctions guidance pages;
  - 15 UN: Security Council sanctions-committee pages;
  - 43 EU: EUR-Lex ELI links to original identified Council Regulations or CFSP Decisions. Original texts may be amended or repealed; no claim of current consolidated legal status.
- Remaining **2 programmes** show an explicit unmapped state and a clearly labeled jurisdiction-level portal, not a fabricated programme citation.
- Source-of-truth curated mapping in `scripts/ss-024-curated-sources.ts`; checked-in repeatable mapping SQL in `scripts/ss-024-curated-source-backfill.sql`. Do not overwrite curator-changed mappings.
- `drizzle/migrations/0024_official_source_coverage.sql`: additive programme source status, official landing page URL/label/issuer and link health metadata. Migration applied and successfully replayed in isolated staging.
- Programme UI separates official landing references, published dated source documents and Premium legal analyses. SS-023 provides RLS for published documents; AI content requires editorial approval.
- Link monitoring: `supabase/functions/_shared/official-link-check.ts` rejects unsafe URLs/redirects, uses bounded timeouts and distinguishes confirmed 404/410 from 403, rate limiting and temporary outages.
- `supabase/functions/official-source-check/index.ts` uses server-only cron secret and service-role access to check curated URLs in bounded batches. It updates programme check timestamps and marks links broken **only** after an explicit 404/410; a blocked request cannot automatically withdraw a source.
- A **manual-only** GitHub Action `.github/workflows/official-source-check.yml` exists. Do not enable schedule or invoke it against production until staging deployment and runtime check.
- CI now includes SQL migrations, editorial workflow and RLS integration test `tests/sql/ss018_publication_integration.sql` (plus existing SS-025 tests), frontend catalogue/tests, Deno checks, and mapping inventory validation.

## Verified (6 November 2026)
- 0024 migration applied in separate Lovable staging project `c83df1e5-0838-4ae4-80dd-3e1426118c05`, **not production**. Both rollback-only SS-023 and SS-024 staging SQL smoke tests passed.
- Staging database: 97 mapped; 2 awaiting source mapping after evidence-based EU legal act enrichment. No pending candidates, official document entries or audit events (no editorial test data persisted).
- GitHub Actions: publication-integration, database, parser, XML, OpenAI, Premium RLS, frontend and catalogue validation green on last confirmed PR head (see latest PR checks).
- The isolated Lovable staging preview received a file-exact sync of the PR #42/#43 code, and the three staging Edge Functions were deployed. No production deployment. Signed-in browser E2E is still unverified because staging test-user sign-in requires an approval flow unavailable to the agent.

## Remaining acceptance checks under SS-018 (#24)
1. Reconcile the separate staging project's copied source files with the latest PR head, and keep the staging Edge Functions in sync with any later security fixes. This preview is a file-level copy, not a Git branch switch.
2. Run real authenticated admin/free/premium/anonymous browser and network tests. Rollback-only DB role-matrix publishing tests already passed, and all three staging Edge Functions returned 401 for unauthorized calls; this does NOT replace real authenticated E2E. Confirm queue visibility, approval, rejection, correction, withdrawal, audit history, publication preview, and correct route refresh.
3. Perform bounded HTTP link checks for all mapped entries. A read-only GitHub Actions check of the initial 75 mappings returned 39 direct HTTP 200 results, 15 UN HTTP 202 and 20 OFAC timeouts (74 distinct links); 202 is now explicitly treated as inconclusive, not 'verified'. Rerun for the expanded 94 mappings. Existing staging mapping timestamps are **not** evidence of reachability: they are null until the checker runs. Confirm redirects and special publisher behavior; correct 404s and ensure 403/429 do not mark legally valid sources broken.
4. Enrich remaining 2 programmes with verified primary source links where available. Coverage remains transparent until then.
5. Enable daily source update monitoring only when trusted feeder rules are curated and tested. Further official guidance/licensing document-level enrichment should follow validated programme mapping.
6. Inspect whether a merge to `main` triggers Lovable deployment or GitHub Actions jobs before merging. No production rollout without owner consent.

The open 24 mappings and runtime E2E are not silently marked completed. This branch is stacked on SS-023 PR #42; merge order is #42 then #43 after QA, with an explicit check for deployment side effects.

## Follow-on legal-catalogue corrections
- EU: original EUR-Lex legal bases mapped for all 43 listed regimes; originals are not substitutes for current consolidated text.
- UK domestic counter-terrorism: replaced repealed 2010 Terrorist Asset-Freezing Act citation with Counter-Terrorism (Sanctions) (EU Exit) Regulations 2019, S.I. 2019/577 (verified from legislation.gov.uk and GOV.UK guidance).
- US Syria: official OFAC revocation notice (effective July 1, 2025), distinctly labeled historical; not represented as an active Syria programme.
- US Foreign Sanctions Evaders: OFAC current list directory, explicitly noted empty as of 18 Dec 2025 but potentially repopulated.
- Remaining two unlinked catalogue entries are umbrella groups (US 'Other country programmes' and UK 'Country and conflict regimes'), not distinct legal sanctions regimes. They provide a jurisdiction-level official portal rather than an invented single programme citation.
