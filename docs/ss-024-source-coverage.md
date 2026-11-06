# SS-024 — source coverage, validation and staged rollout

## Inventory
- Staging catalogue: **99 programmes** (EU 43, US 24, UK 17, UN 15), confirmed 6 Nov 2026.
- The initial SS-024 migration marks every programme `needs_mapping` until a curator verifies a **programme-specific** official source.
- `scripts/ss-024-source-inventory.ts --json` emits a machine-readable, complete programme inventory with name, jurisdiction, existing legal-basis text and official **jurisdiction-wide** portal. It intentionally does not fabricate individual legal citations.
- The programme UI displays an explicit “Official programme source not yet linked” state when no validated programme document exists, with a clearly labeled jurisdiction-level portal.
- SS-023 already provides a source/document model, curator-approved feed-to-programme mapping, official-document metadata publication, deduplication, audit and public RLS. SS-024 reuses it.
- SS-024 adds explicit source mapping states, last checked time and link check states for future automated monitoring.

## Required next implementation steps
1. Collect official programme-specific primary-source URLs from each issuing authority; independently verify and record dates and legal status. Do not infer citations from a programme title or jurisdiction portal.
2. Implement a safe link monitor (HTTP status, redirect target, retry/backoff, request timeouts, SSRF-safe allowlist), and persist `last_checked_at`, `link_check_status` and programme `source_last_checked_at`.
3. Build a curated, reviewable bulk-import mapping. Add source-specific legal basis, guidance, licensing, enforcement references where available.
4. Enable only vetted programme-specific RSS feed rules; generic feeds must not be mapped automatically.
5. Run SQL/CI and full browser/Edge Function E2E in SS-018. Staging migration only, no production deployment.

## Security and status
The public `official_documents` table remains fail-closed by SS-023 RLS: only published and validated documents are readable. The explicit “needs mapping” fallback is not a verified programme-specific link.

This branch is based on `feat/ss-023-publication-policy`, not main. Its PR must target PR #42's branch until SS-023 is merged. Do not merge or deploy without owner approval.
