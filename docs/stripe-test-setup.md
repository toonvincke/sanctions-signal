# Stripe Billing: test-only setup

## Commercial scope
One product: **Premium**. Two billing intervals: **monthly** and **annual**.
Provisional display prices are stored in `src/lib/subscription-plans.ts`; the definitive Stripe Price IDs are server-side configuration. Updating public prices alone does not change Stripe billing.

## Stripe Dashboard (test mode)
1. Create a Premium product with monthly and annual recurring EUR prices.
2. Securely configure `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_ANNUAL` in the future server host secret store. Never commit these values or put them in VITE_ variables.
3. Configure a customer portal, test-mode webhook endpoint, and VAT/tax rules before a live launch.
4. Reconcile `checkout.session.completed`, `customer.subscription.*`, and invoice events from verified, raw-body webhooks. Persist event IDs atomically with subscription changes for idempotency. Always retrieve provider subscription state if webhook ordering is ambiguous.
5. Only authenticated server endpoints may call the Stripe API. Resolve the user's customer ID and active subscription server-side. Never grant Premium based on redirect/session success or user-editable fields.

## Current status
The feature branch now contains Supabase Edge Function HTTP handlers:
- `stripe-checkout`: authenticated recurring Checkout (monthly or annual).
- `stripe-portal`: authenticated customer portal access.
- `stripe-webhook`: verified raw-body signature, test-mode Stripe retrieval, and event-ledger-backed entitlement reconciliation.
- `drizzle/migrations/0025_stripe_billing_events.sql`: **prepared, not deployed**.

The Stripe webhook endpoint must have gateway JWT verification disabled (see `supabase/config.toml`) because Stripe signs the request rather than sending a Supabase JWT.

**Deployment prerequisites:** review live Lovable Cloud schema and migration numbering, apply reviewed migration 0025, configure all Stripe test secrets and `STRIPE_APP_ORIGIN`, deploy the three functions, configure the test webhook URL in Stripe, and test a signed-in sandbox checkout, portal access, cancellation, renewals, and out-of-order webhook retries. Do not enable browser checkout or production keys before these steps pass. Stripe Dashboard must provide the real test-mode Price IDs; do not paste API secrets into chat.

The GitHub tests use mocks and do not invoke Stripe. Lovable is not required for code changes or GitHub tests. Production use requires additional review of VAT/tax configuration, customer notification and invoice policies.
