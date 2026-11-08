import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyStripeSignature } from "./stripe-signature";
const secret = "whsec_fixture";
const now = 1_794_136_800_000;
const raw = JSON.stringify({ id: "evt_test123", type: "customer.subscription.updated", livemode: false });
function sign(body: string, timestamp = now / 1000) {
  return `t=${timestamp},v1=${createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex")}`;
}
describe("Stripe Deno Web Crypto webhook signature", () => {
  it("accepts the signed raw body", async () => {
    expect(await verifyStripeSignature(raw, sign(raw), secret, now)).toBe(true);
  });
  it("rejects missing, forged, and modified signatures", async () => {
    expect(await verifyStripeSignature(raw, null, secret, now)).toBe(false);
    expect(await verifyStripeSignature(raw + " ", sign(raw), secret, now)).toBe(false);
    expect(await verifyStripeSignature(raw, "t=1794136800,v1=" + "0".repeat(64), secret, now)).toBe(false);
  });
  it("rejects replayed and future-dated signatures", async () => {
    expect(await verifyStripeSignature(raw, sign(raw, now / 1000 - 301), secret, now)).toBe(false);
    expect(await verifyStripeSignature(raw, sign(raw, now / 1000 + 301), secret, now)).toBe(false);
  });
});
