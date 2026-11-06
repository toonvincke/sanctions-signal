# SS-023 — Publication policy and review gates

## Rules
- Official source metadata may be automatically published **only after** verifying HTTPS, approved official publisher/host, source type, publication date, programme association and duplicate identity. A URL's host alone does not establish legal validity.
- AI summaries, legal interpretations and practical implications must remain unpublished until explicitly approved by an authorized human reviewer.
- Source facts and editorial analysis must be separate fields and separate public views.
- Draft, rejected and withdrawn analyses must not be returned from public endpoints, SSR loaders, search indexes or caches.
- A correction/withdrawal must be auditable; never silently overwrite published analysis.

## Current repository finding (2026-11-06)
The initial migration `drizzle/migrations/0000_migration.sql` grants authenticated users SELECT on **all** `intelligence_records` via RLS `using (true)`. That table combines `source_facts` with `executive_summary`, `detailed_analysis`, and `practical_implications`. A frontend-only review gate would therefore leak drafts. Later migrations and live Lovable Cloud policies must be checked before changing this policy.

## Implementation sequence (fail closed)
1. Read current migrations, public queries, ingestion code and live/staging RLS; inventory existing publication states and consumers.
2. Add a migration that separates validated public source metadata from private editorial content, with explicit publication/review states and actor/timestamp audit trail. Backfill existing records as non-public unless publication approval is established.
3. Replace unrestricted SELECT with narrow RLS and safe public views/RPC; admin review mutations are server-side only.
4. Implement an admin queue (pending, approve, reject, withdraw, correct) and clearly label source vs analysis in UI.
5. Add tests for anonymous/free/admin access, unapproved AI drafts, withdrawal, deduplication and publication atomicity. Verify against staging before production.

## Release constraints
No migration against production, deployment or merge without explicit approval. Coordinate SS-012 (#18), SS-022 (#30), SS-018 (#24), and premium boundary SS-025 (#36).
