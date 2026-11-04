# Sanctions Signal — monitoring deployment checklist

**Active environment:** Lovable Cloud attached to the existing Sanctions Signal app.
Existing users and intelligence records must remain unchanged.
The older instructions pointing to a separate, empty Supabase project are obsolete.
Do not link, migrate or deploy to that separate project.

## Deployment order (important)

1. Take/verify a restorable Lovable Cloud database backup. Do **not** replay Drizzle
   0000–0005, or the duplicate `supabase/migrations` versions of the core schema.
2. Apply **only** the new Drizzle migration
   `drizzle/migrations/0006_atomic_sanctions_import.sql` to the existing Lovable
   Cloud database using its native migration tooling. Confirm the table
   `public.sanctions_import_staging` exists and `public.finalize_sanctions_import`
   is executable **only** by the server-side service role. Verify the migration
   is recorded once in Drizzle's journal.
3. Deploy updated `supabase/functions/sanctions-sync/index.ts` and shared module
   `supabase/functions/_shared/sanctions-parsers.ts` into the **same** Lovable
   Cloud project. GitHub changes alone do not prove an Edge Function was deployed.
   Configure the `sanctions-sync` endpoint to accept the dedicated cron secret
   without Supabase gateway JWT verification, subject to Lovable's support.
4. In Lovable Cloud server-side function secrets, configure
   `SANCTIONS_CRON_SECRET` to a securely generated random value (32+ bytes).
   Keep `SUPABASE_SERVICE_ROLE_KEY` server-side; never commit, log, or share
   its value. Check that `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
   already point to the **active** Lovable Cloud backend.
5. In GitHub repository Settings → Secrets and variables → Actions, configure:
   - `SUPABASE_FUNCTIONS_URL`: **active Lovable Cloud** functions base URL,
     ending in `/functions/v1` if using the standard Supabase route.
   - `SANCTIONS_CRON_SECRET`: the **same** secret as the Cloud function.
   Do not reuse an old external Supabase project URL.
6. Run a single, authorized manual import; verify the run log shows four source
   results and no failures. Inspect actual entries, counts, aliases, active flags,
   and three changes (addition, edit, removal) in a **separate test environment**.
   Production imports should not inject or fabricate sanctions data.
7. Enable the GitHub workflow `.github/workflows/sanctions-monitor.yml`
   (four-hour schedule) only after successful manual validation. Confirm the
   next scheduled run and review `sanctions_import_runs` and function logs.
   Configure GitHub Actions failure notifications to an appropriate operator.

## Quality and safety rules

- Official sources: OFAC SDN and Non-SDN, UK Sanctions List, UN Consolidated List.
- UKSL uses one designation ID across several name/alias rows. The importer
  consolidates those rows by Unique ID. This is **not** the historical OFSI
  Consolidated List (retired as an updating source on 28 January 2026).
- The importer stages all rows and finalizes atomically. If staging, validation,
  or finalization fails, the current list is left unchanged and the run fails.
- Unusually large (over 2%) source-level contractions are blocked for human
  review; this is a safety guard, not a guarantee that all delistings are correct.
- Only fully validated snapshots are permitted to mark missing entries inactive.
  Delisted entries remain in the database for history with `active = false`.
- Changes to raw list entries do not automatically create verified intelligence
  articles. The editorial review process is separate.
- The EU list and RSS news discovery are **not production-validated** by this
  import release and require separate source verification.
- A passing parser unit test is not equivalent to a successful live import.

## How to confirm success

```sql
select code, enabled, last_success_at, last_error
from public.sanctions_sources
where source_type = 'sanctions_list'
order by code;

select source_code, status, started_at, records_seen,
       records_added, records_changed, records_removed, error_message
from public.sanctions_import_runs
order by started_at desc
limit 12;

select source_code, active, count(*)
from public.sanctions_list_entries
group by source_code, active
order by source_code, active;
```

All four configured sanctions-list sources should show recent successful runs,
and the schedule must continue running. **Never claim monitoring is live solely
because GitHub code is merged.**

## Official format references

- OFAC SLS: https://ofac.treasury.gov/sanctions-list-service
- UKSL format: https://www.gov.uk/guidance/format-guide-for-the-uk-sanctions-list
- UKSL current downloads: https://www.gov.uk/government/publications/the-uk-sanctions-list
- UN: https://scsanctions.un.org/resources/xml/en/consolidated.xml
