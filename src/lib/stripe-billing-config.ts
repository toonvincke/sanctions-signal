/** Server-side Stripe billing configuration. Never import into browser bundles. */
export type BillingInterval = "monthly" | "annual";
export type StripeBillingConfig = {
  secretKey: string;
  webhookSecret: string;
  monthlyPriceId: string;
  annualPriceId: string;
};
export function readStripeBillingConfig(env: Record<string, string | undefined>): StripeBillingConfig {
  const keys = ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "STRIPE_PRICE_MONTHLY", "STRIPE_PRICE_ANNUAL"] as const;
  for (const key of keys) {
    if (!env[key]?.trim()) throw new Error(`Missing required server billing configuration: ${key}`);
  }
  if (!env["STRIPE_SECRET_KEY"]!.startsWith("sk_test_")) {
    throw new Error("Stripe billing is restricted to test mode until production rollout is approved");
  }
  if (!env["STRIPE_WEBHOOK_SECRET"]!.startsWith("whsec_")) throw new Error("Invalid Stripe webhook secret format");
  for (const key of ["STRIPE_PRICE_MONTHLY", "STRIPE_PRICE_ANNUAL"] as const) {
    if (!env[key]!.startsWith("price_")) throw new Error(`Invalid Stripe price ID: ${key}`);
  }
  if (env["STRIPE_PRICE_MONTHLY"] === env["STRIPE_PRICE_ANNUAL"]) throw new Error("Monthly and annual Stripe prices must differ");
  return {
    secretKey: env["STRIPE_SECRET_KEY"]!,
    webhookSecret: env["STRIPE_WEBHOOK_SECRET"]!,
    monthlyPriceId: env["STRIPE_PRICE_MONTHLY"]!,
    annualPriceId: env["STRIPE_PRICE_ANNUAL"]!,
  };
}
export function stripePriceForInterval(config: StripeBillingConfig, interval: BillingInterval): string {
  if (interval === "monthly") return config.monthlyPriceId;
  if (interval === "annual") return config.annualPriceId;
  throw new Error("Unsupported billing interval");
}
