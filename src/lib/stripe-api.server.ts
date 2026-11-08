import { stripePriceForInterval, type BillingInterval, type StripeBillingConfig } from "./stripe-billing-config";

/** Stripe API calls run on the server only. The caller MUST authenticate the user,
 * look up their Stripe customer ID server-side and reject existing subscriptions.
 * Never accept a customer ID, amount, or redirect URL directly from the browser.
 */
export type StripeHttp = typeof fetch;
export type CheckoutInput = {
  interval: BillingInterval;
  authenticatedUserId: string;
  customerId?: string | null;
  verifiedAppOrigin: string;
};
function assertOrigin(origin: string): string {
  const url = new URL(origin);
  if (url.username || url.password || url.search || url.hash || url.pathname !== "/" ||
      (url.protocol !== "https:" && !(url.protocol === "http:" && url.hostname === "localhost"))) {
    throw new Error("Application origin must be a trusted HTTPS origin");
  }
  return url.origin;
}
async function stripePost(path: string, values: URLSearchParams, secretKey: string, http: StripeHttp) {
  if (!secretKey.startsWith("sk_test_")) throw new Error("Stripe test-mode key required");
  const response = await http(`https://api.stripe.com/v1/${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${secretKey}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: values.toString(),
  });
  const payload: unknown = await response.json();
  if (!response.ok || !payload || typeof payload !== "object") {
    throw new Error(`Stripe request failed (${response.status})`);
  }
  const value = payload as { url?: unknown; livemode?: unknown };
  if (value.livemode !== false || typeof value.url !== "string" || !value.url.startsWith("https://")) {
    throw new Error("Stripe did not return a test-mode HTTPS redirect");
  }
  const redirect = new URL(value.url);
  if (redirect.hostname !== "checkout.stripe.com" && redirect.hostname !== "billing.stripe.com") {
    throw new Error("Unexpected Stripe redirect host");
  }
  return value.url;
}

export async function createPremiumCheckout(config: StripeBillingConfig, input: CheckoutInput, http: StripeHttp = fetch) {
  if (!input.authenticatedUserId.trim()) throw new Error("Authenticated user is required");
  const origin = assertOrigin(input.verifiedAppOrigin);
  const values = new URLSearchParams({
    mode: "subscription",
    "line_items[0][price]": stripePriceForInterval(config, input.interval),
    "line_items[0][quantity]": "1",
    client_reference_id: input.authenticatedUserId,
    "subscription_data[metadata][app_user_id]": input.authenticatedUserId,
    success_url: `${origin}/pricing?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/pricing?checkout=cancel`,
  });
  if (input.customerId) values.set("customer", input.customerId);
  return stripePost("checkout/sessions", values, config.secretKey, http);
}

/** Only pass customerId resolved from the authenticated user's server-side billing record. */
export async function createBillingPortal(config: StripeBillingConfig, customerId: string, verifiedAppOrigin: string, http: StripeHttp = fetch) {
  if (!/^cus_[a-zA-Z0-9]+$/.test(customerId)) throw new Error("Invalid Stripe customer ID");
  const origin = assertOrigin(verifiedAppOrigin);
  return stripePost("billing_portal/sessions", new URLSearchParams({ customer: customerId, return_url: `${origin}/pricing` }), config.secretKey, http);
}
