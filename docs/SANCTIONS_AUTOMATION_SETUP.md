# Sanctions Signal automation — deployment and operator checklist

This branch contains the first implementation layer for the three-phase roadmap. It does not alter the existing public pages.

## Target Supabase project

- Project name: `sanctions-signal`
- Project ref: `hhweignwwtpcqpulcttk`
- Region: Frankfurt (EU)
- Project URL: `https://hhweignwwtpcqpulcttk.supabase.co`

This is a newly created, empty project. It currently has no application tables, database migrations, or Edge Functions. **Do not apply the monitoring migrations yet:** the first monitoring migration assumes that the existing application table `public.intelligence_records` (and its related tables and enums) already exists. The original project was not accessible during setup, so its database schema and data have not been copied. Restore/create the core application schema first, then apply the monitoring migrations in order.

## What is included

- **Phase 1 — list monitoring:** scheduled checks for OFAC SDN, OFAC consolidated non-SDN primary names, the UK Sanctions List CSV and the UN consolidated XML. The EU export is not enabled until a current download URL and parser are configured.
- **Phase 2 — intelligence discovery:** RSS/Atom discovery stores new publications as `pending_review` candidates and can generate structured AI drafts when `OPENAI_API_KEY` is configured. A separate `candidate-review` function lets an authenticated administrator approve or reject a candidate. No candidate is published automatically.
- **Phase 3 — research assistant foundation:** an authenticated Edge Function retrieves only existing records marked `verification_status='verified'`, then generates a cited research answer. It is not a legal decision engine. A database trigger snapshots previous record versions before updates.

## Required setup

1. Connect the Lovable application to the new Supabase project. Set the browser-safe environment variables in the Lovable project:
   - `VITE_SUPABASE_URL=https://hhweignwwtpcqpulcttk.supabase.co`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`: copy the publishable key from Supabase Project Settings → API Keys. It is intended for browser use; never use the service-role key here.
2. Create/restore the core application schema (including `intelligence_records`, `jurisdictions`, `regimes`, `authorities`, `categories`, `bookmarks`, `record_categories`, and the `content_type`, `legal_status`, and `verification_status` enums). Verify its RLS policies before exposing the new project to users.
3. Apply the monitoring migrations in order only after the core schema exists:
   - `202611020001_sanctions_monitoring.sql`
   - `202611020002_intelligence_record_history.sql`
4. Deploy all four Edge Functions from this branch:
   - `sanctions-sync`
   - `intelligence-discover`
   - `candidate-review`
   - `assistant`
5. Set Edge Function secrets in Supabase:
   - `SANCTIONS_CRON_SECRET`: a long random secret (at least 32 bytes).
   - `OPENAI_API_KEY`: enables AI draft generation and the research assistant.
   - `OPENAI_MODEL`: optional; defaults to `gpt-4.1-mini`.
   - Supabase normally injects `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`; verify they exist in the deployed function environment. Never put the service-role key in browser code or GitHub.
6. In GitHub → Settings → Secrets and variables → Actions, add:
   - `SUPABASE_FUNCTIONS_URL=https://hhweignwwtpcqpulcttk.supabase.co/functions/v1`
   - `SANCTIONS_CRON_SECRET`: exactly the same value configured in Supabase.
   The workflow runs every four hours and can also be started manually after it is merged into the default branch.
7. Configure official RSS/Atom sources in `sanctions_sources`. To enable the EU consolidated financial-sanctions list, obtain the current download URL from the European Commission's Financial Sanctions Files portal and configure a dedicated, validated parser. The consolidated financial-sanctions list is not a complete representation of all EU restrictive measures; the Official Journal/legal acts remain authoritative.
8. Assign reviewer access by setting the user's Supabase Auth `app_metadata.role` to `admin`. Do not use editable user metadata for this role.

## Important limitations before production use

- The OFAC and UK CSV formats can change. Check import run counts and sample entries after the first manual run.
- The UN XML parser maps core individual/entity names, identifiers and selected identifying details. Validate its output against current official samples before relying on it operationally.
- The current importer upserts observed rows but does not yet mark absent rows as delisted. A reconciliation step must only mark removals after a complete validated snapshot.
- The discovery function requires RSS/Atom rows; it does not crawl arbitrary HTML pages.
- Phase 2 candidates are not yet surfaced in an editorial UI. Review candidate rows in Supabase and call `candidate-review` with `candidate_id`, `decision` (`approve` or `reject`) and optional `review_notes`. The authenticated user's `app_metadata.role` must equal `admin`.
- The assistant searches verified records only. It does not query raw list entries or independently interpret legislation. Add a subscription/entitlement check before exposing it to paying users.
- The scheduled GitHub Actions workflow is not active until both repository secrets are configured and the branch is merged into the default branch.
- This setup does not copy data from the inaccessible previous Supabase project. Existing records and user accounts will need a separate, authorized migration if they are to be preserved.

## Official source references

- OFAC SLS and data files: https://ofac.treasury.gov/sanctions-list-service and https://sanctionslist.ofac.treas.gov/Home/ConsolidatedList
- UK Sanctions List: https://www.gov.uk/government/publications/the-uk-sanctions-list
- UN consolidated list: https://scsanctions.un.org/resources/xml/en/consolidated.xml
- EU consolidated financial-sanctions list: https://data.europa.eu/data/datasets/consolidated-list-of-persons-groups-and-entities-subject-to-eu-financial-sanctions
- EU sanctions resources and legal acts: https://finance.ec.europa.eu/eu-and-world/sanctions-restrictive-measures/overview-sanctions-and-related-resources_en
