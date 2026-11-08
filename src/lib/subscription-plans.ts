/** One Premium subscription with two billing intervals. Provisional EUR prices excluding VAT.
 * Changing amounts here changes the public display only; when live, update Stripe
 * prices and server-only STRIPE_PRICE_* mappings together before publishing.
 */
export const PREMIUM_PLAN = {
  id: "premium",
  name: "Premium",
  currency: "EUR",
  pricesExcludeVat: true,
  priceStatus: "provisional",
  billing: {
    monthly: { amount: 25, months: 1 },
    annual: { amount: 270, months: 12 },
  },
} as const;

export const PREMIUM_PRICING = {
  monthly: PREMIUM_PLAN.billing.monthly.amount,
  annualTotal: PREMIUM_PLAN.billing.annual.amount,
} as const;

export function annualSavings() {
  return Math.round((1 - PREMIUM_PRICING.annualTotal / (PREMIUM_PRICING.monthly * 12)) * 100);
}
export type SubscriptionStatus = "active" | "trialing" | "past_due" | "canceled" | "expired";
export function hasPremiumAccess(status: SubscriptionStatus | null, end: string | null, now = new Date()): boolean {
  if (status !== "active" && status !== "trialing") return false;
  if (!end) return false;
  const expiry = new Date(end);
  return !Number.isNaN(expiry.getTime()) && expiry.getTime() > now.getTime();
}
