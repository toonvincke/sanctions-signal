# SS-022 — additive programme/document data model

The feature branch does **not** deploy to production. Lovable Cloud is the source of truth for the live schema. Migration 0012 was applied **only to the isolated staging Lovable Cloud database** on 2026-11-06; production still requires separate approval.

## Model
- `sanctions_programmes`: UUID identity plus unique existing `(jurisdiction, slug)`. Existing static catalogue and routes remain unchanged.
- `official_documents`: canonical HTTPS URL (unique), document type, authority, dates, status, last check. One document can belong to multiple programmes.
- `programme_documents`: many-to-many association.
- `programme_intelligence`: many-to-many association to existing `intelligence_records`; does not change their existing `regime_id` or RLS.

## Rollout
1. Confirm schema, backups, current migration journal, and existing RLS in the **target** Lovable Cloud environment.
2. Apply 0012 in staging only, after reviewing its DDL. Do not apply through GitHub merge automatically.
3. Generate catalogue seed with `bun run scripts/ss-022-seed.ts > /tmp/ss-022-seed.sql`; inspect the output and execute it on staging. Re-running is safe for existing keys. This deliberately does not delete removed programmes.
4. Run `scripts/ss-022-staging-smoke.sql` in staging: it tests constraints and joins in a transaction that rolls back. This passed on 2026-11-06. Verify count/keys against `PROGRAMME_DETAILS`, foreign keys, duplicate URL rejection, and permission denials for anon/authenticated. Check existing public routes and premium gating.
5. Run the application test suite, confirm seed generation works, and verify end-to-end access control with actual test accounts. These are **not yet verified**. Only then plan production rollout with separate approval.

## Boundaries
No documents or intelligence are auto-published by this migration. Canonical URL normalization and official-source validation belong to ingestion (SS-024/SS-023). No existing table is renamed, dropped or rewritten. Public access policies for document metadata must be designed separately; never expose intelligence content by joining directly to a publicly readable association table.

## Rollback
No data-destructive rollback is provided. If staging validation fails, stop; remove only the newly created objects after reviewing any inserted data and dependencies.
