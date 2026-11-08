import { createHmac, timingSafeEqual } from "node:crypto";

/** Verify the exact raw request body before parsing JSON or updating entitlements. */
export function verifyStripeWebhook(raw: string, signatureHeader: string | null, secret: string, nowSeconds = Math.floor(Date.now() / 1000)): unknown {
  if (!secret.startsWith("whsec_") || !signatureHeader) throw new Error("Missing webhook signature configuration");
  const entries = signatureHeader.split(",").map((value) => value.trim().split("="));
  const timestampValue = entries.find(([key]) => key === "t")?.[1];
  const signatures = entries.filter(([key]) => key === "v1").map(([, value]) => value);
  if (!timestampValue || !/^\d+$/.test(timestampValue) || signatures.length === 0) throw new Error("Invalid Stripe signature header");
  const timestamp = Number(timestampValue);
  if (!Number.isSafeInteger(timestamp) || Math.abs(nowSeconds - timestamp) > 300) throw new Error("Stripe webhook timestamp outside tolerance");
  const digest = createHmac("sha256", secret).update(`${timestampValue}.${raw}`, "utf8").digest();
  const valid = signatures.some((signature) => {
    if (!/^[0-9a-f]{64}$/i.test(signature)) return false;
    const supplied = Buffer.from(signature, "hex");
    return supplied.length === digest.length && timingSafeEqual(supplied, digest);
  });
  if (!valid) throw new Error("Stripe webhook signature mismatch");
  return JSON.parse(raw) as unknown;
}

/** A webhook handler must persist the Stripe event ID atomically with any entitlement
 * update, and re-fetch subscription status where necessary to handle out-of-order events.
 * This classifier intentionally never grants premium access directly.
 */
export function classifyStripeEvent(event: unknown): "subscription-reconcile" | "ignore" {
  if (!event || typeof event !== "object") return "ignore";
  const value = event as { id?: unknown; type?: unknown; livemode?: unknown };
  if (value.livemode !== false || typeof value.id !== "string" || !value.id.startsWith("evt_")) return "ignore";
  return [
    "checkout.session.completed",
    "customer.subscription.created",
    "customer.subscription.updated",
    "customer.subscription.deleted",
    "invoice.paid",
    "invoice.payment_failed",
  ].includes(String(value.type)) ? "subscription-reconcile" : "ignore";
}
