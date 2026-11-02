# Sanctions Signal automation — deployment and operator checklist

This branch adds the first implementation layer for the three-phase roadmap. It does not alter the existing public pages or existing intelligence-record schema.

## What is included

- **Phase 1 — list monitoring:** scheduled checks for OFAC SDN, OFAC consolidated non-SDN primary names, the UK Sanctions List CSV and the UN consolidated XML. CSV feeds and the UN XML are mapped into `sanctions_list_entries`; the EU export is not enabled until you provide its current download URL. Imports fail closed when rows cannot be mapped.
- **Phase 2 — intelligence discovery:** RSS/Atom discovery stores new publications as `pending_review` candidates and can generate structured AI drafts when `OPENAI_API_KEY` is configured. A separate `candidate-review` function lets an authenticated administrator approve or reject a candidate. No candidate is published automatically.
- **Phase 3 — research assistant foundation:** authenticated Edge Function retrieves only existing records marked `verification_status='verified'`, then generates a cited research answer. It is not a legal decision engine and must not be marketed as one. A database trigger snapshots previous record versions before updates.

## Required setup (you need to do these steps)

1. Open your Lovable project and confirm it is connected to Supabase project `zaxndzgkadanpctumyem`. The repository currently has Lovable Cloud/Supabase integration; these new migrations and Edge Functions are on this feature branch and must be merged before your normal `main`-based workflow uses them.
2. Apply both migrations, in order, to the linked project's SQL editor (or use Supabase CLI after linking the project): `202611020001_sanctions_monitoring.sql`, then `202611020002_intelligence_record_history.sql`. Review the SQL before applying it to a live database.
3. Deploy the four Edge Functions from this branch:
   - `sanctions-sync`
   - `intelligence-discover`
   - `assistant`
   With Supabase CLI: `supabase functions deploy sanctions-sync`, and repeat for the other two.
4. Set Edge Function secrets:
   - `SANCTIONS_CRON_SECRET`: generate a long random secret (at least 32 bytes).
   - `OPENAI_API_KEY`: enables AI draft generation and the research assistant.
   - `OPENAI_MODEL`: optional; defaults to `gpt-4.1-mini`. The same key enables AI draft generation in `intelligence-discover` and question answering in `assistant`.
   - `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are normally injected by Supabase for Edge Functions; verify they exist in the deployed function environment. Never put the service-role key in browser code or GitHub.
5. In GitHub → Settings → Secrets and variables → Actions, add:
   - `SUPABASE_FUNCTIONS_URL`: `https://zaxndzgkadanpctumyem.supabase.co/functions/v1`
   - `SANCTIONS_CRON_SECRET`: exactly the same value configured in Supabase.
   The GitHub Actions workflow runs every four hours and can also be started manually.
6. To enable EU consolidated financial-sanctions list imports, obtain the current XML download URL from the European Commission's Financial Sanctions Files portal and add a row to `sanctions_sources` with code `eu_financial_sanctions`, jurisdiction `EU`, source_type `sanctions_list`, and that URL. The EU list is a financial-sanctions list, not a complete representation of all EU restrictive measures. The Official Journal/legal acts remain authoritative.
7. Assign reviewer access by setting the user's Supabase Auth `app_metadata.role` to `admin`. Do not use editable user metadata for this role. Admin access is intentionally not inferred from an email address.

## Important limitations before production use

- The OFAC and UK CSV formats can change. Check import run counts and sample entries after the first manual run. The importer fails closed if it cannot identify names.
- The UN XML parser maps core individual/entity names, identifiers and selected identifying details. Validate its output against current official samples before relying on it operationally. EU XML requires a current access URL and a dedicated parser.
- The current importer upserts observed rows but does not yet mark absent rows as delisted. This avoids false delistings from partial or malformed downloads. A later reconciliation step must only mark removals after a complete validated snapshot.
- The discovery function requires RSS/Atom rows to be added to `sanctions_sources`; do not add generic HTML pages and expect it to crawl them.
- Phase 2 candidates are not yet surfaced in an editorial UI. Review candidate rows in the Supabase table editor and call the `candidate-review` function with `candidate_id`, `decision` (`approve` or `reject`) and optional `review_notes`. The authenticated user's `app_metadata.role` must equal `admin`.
- The assistant searches verified records only. It does not query raw list entries or independently interpret legislation. Add a subscription/entitlement check before exposing it to paying users.
- The migration assumes the existing `intelligence_records` table and `auth.users` table described by the repository's generated database types.
- A scheduled GitHub Actions workflow is not active until the two GitHub Actions secrets are configured and the branch is merged into the default branch.

## Official source references

- OFAC SLS and data files: https://ofac.treasury.gov/sanctions-list-service and https://sanctionslist.ofac.treas.gov/Home/ConsolidatedList
- UK Sanctions List (current official list; the old OFSI Consolidated List ceased updating on 28 January 2026): https://www.gov.uk/government/publications/the-uk-sanctions-list
- UN consolidated list: https://scsanctions.un.org/resources/xml/en/consolidated.xml
- EU consolidated financial sanctions list: https://data.europa.eu/data/datasets/consolidated-list-of-persons-groups-and-entities-subject-to-eu-financial-sanctions
- EU sanctions resources and legal acts: https://finance.ec.europa.eu/eu-and-world/sanctions-restrictive-measures/overview-sanctions-and-related-resources_en
