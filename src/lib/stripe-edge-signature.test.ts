import { createHmac, webcrypto } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { verifyStripeSignature } from "../../supabase/functions/_shared/stripe-signature";

beforeAll(() => vi.stubGlobal("crypto", webcrypto));
afterAll(() => vi.unstubAllGlobals());
const secret = "whsec_fixture";
const now = 1_794_136_800_000;
const raw = JSON.stringify({ id: "evt_test123", type: "customer.subscription.updated", livemode: false });
function sign(body: string, timestamp = now / 1000) {
  return `t=${timestamp},v1=${createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex")}`;
}
describe("Stripe Edge webhook HMAC verification", () => {
  it("accepts authentic signatures", async () => {
    expect(await verifyStripeSignature(raw, sign(raw), secret, now)).toBe(true);
  });
  it("rejects forged or tampered payloads", async () => {
    expect(await verifyStripeSignature(raw + " ", sign(raw), secret, now)).toBe(false);
    expect(await verifyStripeSignature(raw, null, secret, now)).toBe(false);
    expect(await verifyStripeSignature(raw, "t=1794136800,v1=" + "0".repeat(64), secret, now)).toBe(false);
  });
  it("rejects signatures outside timestamp tolerance", async () => {
    expect(await verifyStripeSignature(raw, sign(raw, now / 1000 - 301), secret, now)).toBe(false);
    expect(await verifyStripeSignature(raw, sign(raw, now / 1000 + 301), secret, now)).toBe(false);
  });
});
