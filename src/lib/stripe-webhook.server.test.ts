import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyStripeWebhook, classifyStripeEvent } from "./stripe-webhook.server";
const secret = "whsec_test";
const now = 1794132000;
const event = JSON.stringify({ id: "evt_123", type: "customer.subscription.updated", livemode: false });
function sign(payload: string, timestamp = now) {
  return `t=${timestamp},v1=${createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex")}`;
}
describe("Stripe webhook boundary", () => {
  it("accepts a valid raw-body signature and classifies reconciliation", () => {
    expect(classifyStripeEvent(verifyStripeWebhook(event, sign(event), secret, now))).toBe("subscription-reconcile");
  });
  it("rejects body tampering, missing signatures and replayed timestamps", () => {
    expect(() => verifyStripeWebhook(event + " ", sign(event), secret, now)).toThrow(/mismatch/);
    expect(() => verifyStripeWebhook(event, null, secret, now)).toThrow(/Missing/);
    expect(() => verifyStripeWebhook(event, sign(event, now - 301), secret, now)).toThrow(/tolerance/);
  });
  it("ignores live-mode and unrelated events", () => {
    expect(classifyStripeEvent({ id: "evt_1", type: "customer.subscription.updated", livemode: true })).toBe("ignore");
    expect(classifyStripeEvent({ id: "evt_1", type: "price.updated", livemode: false })).toBe("ignore");
  });
});
