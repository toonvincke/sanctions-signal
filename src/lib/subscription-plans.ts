/** Indicative launch prices (EUR excl. VAT). Checkout is intentionally disabled. */
export const PREMIUM_PRICING = { monthly: 25, annualTotal: 270 } as const;
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
