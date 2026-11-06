# SS-025 — Lovable Cloud rollout log (6 November 2026)

## Current state
- GitHub: draft PR #37, feature branch `feature/ss-025-pricing-preview-paywall`; not merged.
- Lovable project: Sanctions Signal Atlas (`11cd0f68-3c90-4464-95f5-dc21b750a5e2`).
- Website has not been published; Lovable Cloud is a real, persistent database.
- No confirmed **current full restorable database backup** available through the connected tools. Previous backup must not be assumed current.

## Applied directly to Lovable Cloud (already live)
1. `drizzle/migrations/0008_premium_access.sql`: creates `user_subscriptions`, `programme_premium_sections`, private entitlement helper and RLS policies. Zero subscriptions, zero premium sections. **Applied outside Drizzle migration ledger**; reconcile before automatic migration/release. GitHub migration is now replay-safe for existing objects.
2. Interim RLS hardening: `ALTER POLICY "auth read" ON public.intelligence_records USING (verification_status='verified' OR private.has_role(auth.uid(),'admin'::public.app_role))`. This hides pending/unverified records but does **not yet** enforce the Premium paywall on approved full articles.
3. Interim least-privilege: `REVOKE TRUNCATE, TRIGGER, REFERENCES ON ALL TABLES IN SCHEMA public FROM anon, authenticated`.

All statements executed in transactions. No intelligence records changed or deleted.

## Verified against live database
- 13 intelligence records preserved (10 verified, 3 pending_review).
- `user_subscriptions` and `programme_premium_sections` exist, both empty.
- Anonymous access to full intelligence returns 0 rows.
- A simulated non-premium authenticated account returns only 10 verified records, no drafts.
- Anon/authenticated lack `TRUNCATE` on intelligence_records.
- Authenticated users lack `INSERT` and `UPDATE` on user_subscriptions.
- All four migrations `0008`–`0011` executed together successfully in a **rolled-back transaction** against the real schema, with 10 public headline previews.
- Replaying revised `0008` was tested successfully in a rollback transaction.

## Remaining rollout gates — do not treat as done
1. Confirm a **fresh recoverable backup** through Lovable project Cloud/database settings. Connected Lovable tools do not expose backup management.
2. Align Drizzle migration ledger and journal with the direct application of `0008` (avoid duplicate or missing migrations).
3. Coordinate new app/Edge Function deployment with `0009`–`0011` to avoid breaking existing intelligence views or exposing protected content through the old AI endpoint.
4. Apply remaining migrations within a controlled maintenance window, then run `supabase/tests/ss025_security_assertions.sql`.
5. Verify direct REST API, full programme detail routes, public article previews, admin review, expired subscriptions, and AI assistant with actual user tokens (anonymous/free/paid/expired/admin).
6. Regenerate Supabase types for new tables; check caching, browser logout/login transitions, and plan expiry.
7. Merge and publish only after security testing and sign-off. Checkout is separately disabled.

## Important
The currently deployed app still uses older code; full verified intelligence remains available to signed-in free users for backward compatibility until the coordinated paywall rollout. Do not claim that production paywall enforcement is finished.
