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
Pure server-side API helper, webhook signature validator and tests implemented. HTTP endpoints, verified Supabase session mapping, database webhook event ledger and entitlement updates are **not yet connected**; no real or test checkout is exposed to users. No Lovable dependency is required for these GitHub CI unit tests.
