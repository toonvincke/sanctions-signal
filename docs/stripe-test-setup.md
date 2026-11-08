# Stripe Billing: test-only setup

## Commercial scope
One product: **Premium**. Two billing intervals: **monthly** and **annual**.
Provisional display prices are stored in `src/lib/subscription-plans.ts`; the definitive Stripe Price IDs are server-side configuration. Updating public prices alone does not change Stripe billing.

## Stripe Dashboard (test mode)
1. Premium sandbox product and monthly/annual EUR prices were created on 2026-11-08; identifiers below. Do not create duplicate catalogue entries.
2. Securely configure `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_ANNUAL` in the future server host secret store. Never commit these values or put them in VITE_ variables.
3. Configure a customer portal, test-mode webhook endpoint, and VAT/tax rules before a live launch.
4. Reconcile `checkout.session.completed`, `customer.subscription.*`, and invoice events from verified, raw-body webhooks. Persist event IDs atomically with subscription changes for idempotency. Always retrieve provider subscription state if webhook ordering is ambiguous.
5. Only authenticated server endpoints may call the Stripe API. Resolve the user's customer ID and active subscription server-side. Never grant Premium based on redirect/session success or user-editable fields.

## VINT sandbox catalogue (test-mode only; public identifiers, NOT API secrets)
- Stripe account: `VINT sandbox` (`acct_1ULlRtLWBFq3YwoW`)
- Premium product ID: `prod_VaknoYnrmlrJ9i`
- `STRIPE_PRICE_MONTHLY=price_1UZZI7LWBFq3YwoW8eqtDtHQ` — €25/month, EUR recurring monthly
- `STRIPE_PRICE_ANNUAL=price_1UZZI9LWBFq3YwoWFywwKIVl` — €270/year, EUR recurring yearly

These are safe catalogue IDs and may be documented. Keep `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` out of source code. Both test prices have `tax_behavior=unspecified`; Stripe Tax and VAT registrations are deliberately **not** enabled pending the merchant's tax decision. Before enabling automatic tax calculations, configure an appropriate tax behavior for new prices or a compatible account default. Do not treat displayed 'excluding VAT' text as a finalized tax determination.

## Current status
The feature branch now contains Supabase Edge Function HTTP handlers:
- `stripe-checkout`: authenticated recurring Checkout (monthly or annual).
- `stripe-portal`: authenticated customer portal access.
- `stripe-webhook`: verified raw-body signature, test-mode Stripe retrieval, and event-ledger-backed entitlement reconciliation.
- `drizzle/migrations/0025_stripe_billing_events.sql`: **prepared, not deployed**.

The Stripe webhook endpoint must have gateway JWT verification disabled (see `supabase/config.toml`) because Stripe signs the request rather than sending a Supabase JWT.

**Deployment prerequisites:** review live Lovable Cloud schema and migration numbering, apply reviewed migration 0025, configure all Stripe test secrets and `STRIPE_APP_ORIGIN`, deploy the three functions, configure the test webhook URL in Stripe, and test a signed-in sandbox checkout, portal access, cancellation, renewals, and out-of-order webhook retries. Do not enable browser checkout or production keys before these steps pass. The real test-mode price IDs are documented above; do not paste API secrets into chat.

The GitHub tests use mocks and do not invoke Stripe. Lovable is not required for code changes or GitHub tests. Production use requires additional review of VAT/tax configuration, customer notification and invoice policies.
