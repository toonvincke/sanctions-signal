# SS-002 — Daily monitoring runbook

The GitHub Actions workflow `.github/workflows/sanctions-monitor.yml` runs daily at **06:17 UTC** (07:17 CET / 08:17 CEST), or via **Actions → Sanctions monitoring → Run workflow**.

## Required repository secrets

Configure in **GitHub → repository Settings → Secrets and variables → Actions → New repository secret**:

- `SUPABASE_FUNCTIONS_URL`: HTTPS **base URL** for the deployed Edge Functions, without a function name or trailing query. For a standard Supabase deployment this is `https://<project-ref>.supabase.co/functions/v1`. For Lovable-hosted functions, obtain the actual public function base URL from the hosting provider; do **not** assume the Supabase URL format.
- `SANCTIONS_CRON_SECRET`: server-side bearer token configured identically in the deployed `sanctions-sync` and `intelligence-discover` functions. Generate a high-entropy random value and configure it on the function host and in GitHub. Do not put it in source control, frontend environment variables, issue comments, or workflow logs.

**Never paste secret values into ChatGPT or GitHub issues.** GitHub does not allow reading back stored secret values; if unsure, rotate the secret and update both sides.

## Deployment verification

1. Confirm that the deployed `sanctions-sync` and `intelligence-discover` endpoints exist at `<base-url>/sanctions-sync` and `<base-url>/intelligence-discover`. The GitHub workflow alone cannot deploy them.
2. Verify both functions accept the same cron bearer token, and that the backend database migrations and required backend environment variables are configured.
3. Set both GitHub repository secrets.
4. Trigger **Actions → Sanctions monitoring → Run workflow** on the default branch, after merging the workflow fix.
5. Confirm the validation step passes, all four sanctions sources return `succeeded` or `unchanged`, and intelligence discovery returns a valid `results` array. An empty results array means no configured feeds were checked, **not** proof of active news monitoring.
6. Check Edge Function logs for errors, without copying credentials or sensitive payloads. Confirm the next scheduled run also succeeds.

## Troubleshooting

- **Missing SUPABASE_FUNCTIONS_URL / SANCTIONS_CRON_SECRET**: configure the named GitHub Actions secret. GitHub secrets are not automatically populated from Lovable or the Edge Function host.
- **HTTP 401/403**: verify the cron bearer token matches the deployed function's expected authentication; rotate on both sides if needed.
- **HTTP 404**: verify the base URL and that each function is deployed.
- **HTTP 5xx / timeouts**: inspect server-side function logs, deployment status, database connectivity and upstream sources.
- **Discovery checks 0 RSS feeds**: configure publication sources separately (SS-013).
- **Scheduled run did not start**: check Actions is enabled and the workflow exists on the default branch; GitHub scheduled runs can be delayed.

The workflow intentionally does not echo credentials or full HTTP responses. Treat a green workflow as proof of successful execution, not as proof that new records were found.
