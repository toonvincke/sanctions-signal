# Read-only validation report (7 Nov 2026)

Nothing was changed, deployed, migrated or published.

## 1. Code version and pages — OBSERVED
- Branch: `edit/edt-2e959578…` (a Lovable edit branch), commit `52b09daf` "Merge pull request #43 (feat/ss-024-official-source-coverage)".
- Preview HTTP status (server render, signed out):
  - `/` 200, `/sanctions/un` 200, `/sanctions/un/isil-da-esh-and-al-qaida` 200
  - `/login` **404**: no such page. Sign-in lives at `/auth`, which returns 200.
  - `/editorial` 200 and `/explorer` 200. Both sit inside the signed-in section, which only checks access in the browser, so the 200 only means the empty page shell loaded.
- `/editorial` code checks for an `admin` row in `user_roles` and shows "forbidden" otherwise. This is OBSERVED in the code only; it was NOT checked in a browser.
- Premium guard in the browser: NOT re-run this time (earlier anonymous run passed).

## 2. Database migrations 0012 / 0023 / 0024 — OBSERVED: NOT APPLIED
- The migration files exist in the code: 0012_programme_document_model, 0023_publication_review, 0024_official_source_coverage.
- The tables they would create are missing from the live database: `sanctions_programmes`, `programme_documents`, `official_documents`, `programme_intelligence`, `editorial_publication_events`, `official_document_source_rules`.
- Only 0008–0011 objects are present: `intelligence_previews` and `programme_premium_sections` (both with RLS on), plus `private.has_premium_access`, `private.has_role` and `private.sync_intelligence_preview`.
- Drizzle history table: the read role can't access it ("permission denied for schema drizzle"), so history is UNVERIFIED. The live schema shows the three migrations were never run.

## 3. Backend functions — OBSERVED (POST without auth)
- `candidate-review` 401: deployed, and auth is enforced.
- `intelligence-discover` 401: deployed, and auth is enforced.
- `assistant` 401: deployed, and auth is enforced.
- `official-source-check` **404: NOT deployed**, even though its code is in the repo.
- Whether the deployed versions match the current code is UNVERIFIED, because there's no version hash I can read. Git merges don't deploy functions on their own.

## 4. Permissions
- Public visitor: covered by the earlier run (REST 401 on private tables, previews only). Not repeated.
- Free, premium and admin: UNVERIFIED, because no test sessions were available.

## 5. Errors and configuration
- Latest build and runtime logs: no new errors shown.
- Mismatch: the merged code (PR #43 and the editorial UI) expects tables from 0012/0023/0024 and the `official-source-check` function. Both are missing, so the editorial and source-coverage features will fail at runtime until the migrations are applied and the function is deployed.

## Suggested next steps (need your approval, not done)
1. Confirm a backup.
2. Apply 0012, then 0023, then 0024, one at a time and checking after each.
3. Deploy `official-source-check`, then redeploy `candidate-review` and `intelligence-discover` from the current code.
4. Test `/editorial` as an admin and as a free user.
