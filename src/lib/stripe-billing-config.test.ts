import { describe, expect, it } from "vitest";
import { readStripeBillingConfig, stripePriceForInterval } from "./stripe-billing-config";

const env = {
  STRIPE_SECRET_KEY: "sk_test_example",
  STRIPE_WEBHOOK_SECRET: "whsec_example",
  STRIPE_PRICE_MONTHLY: "price_month",
  STRIPE_PRICE_ANNUAL: "price_year",
};
describe("Stripe server billing configuration", () => {
  it("maps billing intervals to server-owned Stripe prices", () => {
    const config = readStripeBillingConfig(env);
    expect(stripePriceForInterval(config, "monthly")).toBe("price_month");
    expect(stripePriceForInterval(config, "annual")).toBe("price_year");
  });
  it("rejects live keys before explicit launch approval", () => {
    expect(() => readStripeBillingConfig({ ...env, STRIPE_SECRET_KEY: "sk_live_example" })).toThrow(/test mode/);
  });
  it("fails closed on missing configuration", () => {
    expect(() => readStripeBillingConfig({ ...env, STRIPE_WEBHOOK_SECRET: undefined })).toThrow(/STRIPE_WEBHOOK_SECRET/);
  });
  it("rejects duplicate prices and unknown billing intervals", () => {
    expect(() => readStripeBillingConfig({ ...env, STRIPE_PRICE_ANNUAL: "price_month" })).toThrow(/differ/);
    expect(() => stripePriceForInterval(readStripeBillingConfig(env), "weekly" as never)).toThrow(/Unsupported/);
  });
});
