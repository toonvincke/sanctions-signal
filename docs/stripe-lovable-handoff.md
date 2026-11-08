# Sanctions Signal Atlas — minimal Lovable Cloud Stripe webhook handoff

## Scope and status
- Repository: `toonvincke/sanctions-signal`; **draft PR #51** / branch `feat/stripe-billing-foundation`.
- This handoff is **test mode only**. No public website publishing, no production Stripe keys, no live checkout.
- Verified on the existing Lovable Cloud database: `public.user_subscriptions` exists (0 rows at verification), `private` schema exists, but `private.stripe_processed_events` and `public.apply_stripe_subscription_event` do not yet exist.
- GitHub CI for the branch previously passed including Stripe validation. The SQL migration has **not** been applied.
- `supabase/config.toml` already declares `[functions.stripe-webhook] verify_jwt = false`; the function itself checks Stripe's raw-body HMAC signature.
- The inbound webhook no longer requires `STRIPE_APP_ORIGIN`. That setting is required later for checkout/portal only.
- The Stripe test catalogue and price IDs are in `docs/stripe-test-setup.md`.
- **Important:** GitHub branch code is not automatically deployed by Lovable Git sync. Before asking Lovable to deploy, ensure the exact reviewed webhook files are present in the branch that Lovable syncs. Do not merge the draft PR without explicit approval.

## Actions for the final Lovable deploy
1. Verify the synced Lovable project **Sanctions Signal Atlas** contains the exact current webhook code from PR #51, including:
   - `supabase/functions/stripe-webhook/index.ts`
   - `supabase/functions/_shared/stripe-runtime.ts`
   - `supabase/functions/_shared/stripe-signature.ts`
   - `supabase/config.toml`
   If absent, **STOP** and report the branch mismatch. Do not rewrite the code.
2. Inspect `drizzle/migrations/0025_stripe_billing_events.sql` against the live schema. Apply it **once** only if safe, and verify the event table and RPC exist. The migration is not applied simply by Git sync.
3. Deploy **only** the `stripe-webhook` Edge Function, with gateway JWT verification disabled for this function. It must still reject unsigned or invalidly signed requests with HTTP 400. Never disable the HMAC check.
4. Confirm `STRIPE_SECRET_KEY` (test key) and the two test Price ID secrets are configured. **Do not print secret values**. The webhook secret `STRIPE_WEBHOOK_SECRET` is obtained only after creating a Stripe test webhook destination, so initial function deployment may precede setting it. Without the signing secret, real events must not be accepted.
5. Return the **exact deployed function URL** and its status. Do not invent a URL, register a Stripe endpoint, publish the website, enable Stripe Tax, or activate live payments.

## After Lovable returns the URL (ChatGPT + Stripe; no Lovable AI)
1. In Stripe sandbox, register that HTTPS function URL as a webhook destination for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
2. Obtain the new endpoint's `whsec_...` signing secret in Stripe. Enter it **directly** as `STRIPE_WEBHOOK_SECRET` in Lovable Cloud Secrets. Never paste it into chat or GitHub.
3. Send a signed sandbox event. Confirm valid events are accepted and duplicate events do not double-write; invalid signatures must fail. Inspect function logs and the database ledger. Only then proceed to checkout/portal deployment and end-to-end payment tests.

## Lovable prompt — paste only after code is on the synced branch

Deploy the existing Stripe test webhook for Sanctions Signal Atlas. The code is already prepared in GitHub PR #51. First verify that the synced branch contains `supabase/functions/stripe-webhook/index.ts` and its two `_shared` dependencies. If not, STOP and tell me; do not generate replacement code. Review and apply `drizzle/migrations/0025_stripe_billing_events.sql` once if safe, then deploy ONLY `stripe-webhook` with `verify_jwt=false` while preserving the raw-body Stripe signature check. Do not change other code, publish the site, use live Stripe keys, or activate payments. Confirm the migration, deployment status, and exact webhook endpoint URL. Do not display secret values.
