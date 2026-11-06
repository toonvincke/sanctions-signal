# SS-023 — Publication policy, architecture and rollout

## Product policy
1. **Official source metadata** (direct URL, title, authority, document type and publication date) may go public automatically after both structural validation and an explicitly enabled mapping to an existing programme. These facts are not legal analysis.
2. **AI summaries, legal opinions and compliance implications** must remain private in `intelligence_candidates` until an administrator has verified the official source and explicitly approved an edited draft.
3. **Withdrawn/rejected items** never appear in public preview responses. Editorial correction requires a fresh human approval, with event history.
4. **Programme previews** remain publicly accessible; premium content remains controlled by SS-025. No client-supplied admin claims.

## Existing structures reused
- `intelligence_candidates` — pending editor queue (including AI drafts).
- `intelligence_records` — approved full editorial content.
- `intelligence_previews` — public headlines, synchronized by the existing DB trigger on verified records.
- `sanctions_programmes`, `official_documents`, `programme_documents` — SS-022 metadata model.
- `user_roles` — authoritative admin membership via server role lookup.

## SS-023 additions
- `0023_publication_review.sql`: published/withdrawn state on official documents; curated disabled-by-default source-to-programme rules; public metadata RLS; private append-only editorial audit; server-only atomic review and official-source publication RPCs.
- `candidate-review` Edge Function: verifies JWT and admin membership against `user_roles`, validates reviewed draft and calls one atomic transactional RPC for approve, reject, correct or withdraw.
- `intelligence-discover`: automatically publishes **metadata only** for individual RSS items that match an enabled rule and trusted HTTPS publisher; AI drafts remain pending as before.
- `/editorial` authenticated admin page: source link, editable AI draft, review notes, approval/rejection/correction/withdrawal buttons. Access is enforced by RLS and Edge Functions, not by hiding a navigation link.
- `OfficialProgrammeSources`: separate public programme section restricted to validated, published official document metadata.
- Tests: frontend validation tests, Deno function checks in GitHub Actions and rollback-only staging SQL smoke tests.

## Staging verification — 6 November 2026
- Dedicated Lovable staging project `c83df1e5-0838-4ae4-80dd-3e1426118c05` verified to use an independent Supabase-backed database.
- Current original intelligence RLS verified: only admins or verified premium users may read full records; the old broad initial policy is no longer active.
- Applied SS-023 migration **to staging only**. Its replay test inside a rolled-back transaction succeeded.
- Ran `scripts/ss-023-staging-smoke.sql` against staging, with a transaction rolled back. Verified failed incomplete approval, atomic publication + preview, prevention of duplicate approvals, correction, withdrawal + preview removal, audit trail, rejection, official-source deduplication, unapproved URL rejection, withdrawal non-republication and anonymous document hiding.
- Staging had **zero configured RSS feeds** and no official document records at the time of the initial audit. Automatic publishing remains fail-closed until a curated rule and an RSS source are enabled.
- Final browser/Edge Function runtime verification requires deploying the matching function/code to **staging**. Do not infer runtime success from database smoke tests alone.

## Deployment prerequisites
1. Review GitHub PR #42 CI outcomes and diff. Do not deploy or merge merely because migration SQL tests pass.
2. Ensure migration 0012 is already applied and database history is consistent. Staging has SS-023 applied by SQL; record that in the staging migration tracker before using any automated migration system. The migration itself is replay-safe but should not be double-counted.
3. Deploy the reviewed `candidate-review` and `intelligence-discover` functions with project secrets in a dedicated staging environment. Avoid production keys, avoid public service-role keys.
4. Verify admin queue, submitted edited draft, retry and races, free and anonymous access, stale session, published/withdrawn docs and premium views in a browser.
5. Configure only individually approved, dedicated RSS feeds and exact document URL prefixes. Generic global feeds must not be auto-mapped to programmes. No configured rules = no auto-publication. Validate journal and daily publication scheduler under its separate monitoring ticket.
6. Production rollout, merger and any wider publication require explicit owner approval.

## Operational notes
- Admin correction/withdrawal uses `candidate-review`, never direct client writes to `intelligence_records`.
- Published articles retain their previous snapshots through the existing `intelligence_record_versions` trigger.
- Public source metadata is clearly labeled separately from paid, human-reviewed editorial content.
- If a feed fails validation or attribution, keep the item in the review queue. Do not silently infer its destination.
