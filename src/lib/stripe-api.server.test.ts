import { describe, expect, it, vi } from "vitest";
import { createBillingPortal, createPremiumCheckout } from "./stripe-api.server";
import { readStripeBillingConfig } from "./stripe-billing-config";

const config = readStripeBillingConfig({
  STRIPE_SECRET_KEY: "sk_test_demo",
  STRIPE_WEBHOOK_SECRET: "whsec_demo",
  STRIPE_PRICE_MONTHLY: "price_month",
  STRIPE_PRICE_ANNUAL: "price_year",
});
describe("Stripe API in test mode", () => {
  it("creates monthly and annual checkout using only server-selected prices", async () => {
    const http = vi.fn(async () => new Response(JSON.stringify({ livemode: false, url: "https://checkout.stripe.com/c/pay/test" }), { status: 200 }));
    for (const [interval, expected] of [["monthly", "price_month"], ["annual", "price_year"]] as const) {
      await createPremiumCheckout(config, { interval, authenticatedUserId: "user_1", verifiedAppOrigin: "https://sanctions.example" }, http as typeof fetch);
      const body = new URLSearchParams(http.mock.lastCall![1]!.body as string);
      expect(body.get("line_items[0][price]")).toBe(expected);
      expect(body.get("mode")).toBe("subscription");
      expect(body.get("subscription_data[metadata][app_user_id]")).toBe("user_1");
    }
  });
  it("rejects arbitrary origins and unauthenticated users", async () => {
    const http = vi.fn();
    await expect(createPremiumCheckout(config, { interval: "monthly", authenticatedUserId: "", verifiedAppOrigin: "https://sanctions.example" }, http)).rejects.toThrow(/Authenticated/);
    await expect(createPremiumCheckout(config, { interval: "monthly", authenticatedUserId: "u", verifiedAppOrigin: "https://attacker.example/path" }, http)).rejects.toThrow(/origin/);
    expect(http).not.toHaveBeenCalled();
  });
  it("only allows server-resolved customer portal IDs and test redirects", async () => {
    const http = vi.fn(async () => new Response(JSON.stringify({ livemode: false, url: "https://billing.stripe.com/p/session/test" }), { status: 200 }));
    await expect(createBillingPortal(config, "forged", "https://sanctions.example", http as typeof fetch)).rejects.toThrow(/customer/);
    expect(await createBillingPortal(config, "cus_123", "https://sanctions.example", http as typeof fetch)).toContain("billing.stripe.com");
  });
  it("rejects live-mode API responses and wrong redirect hosts", async () => {
    const bad = vi.fn(async () => new Response(JSON.stringify({ livemode: true, url: "https://checkout.stripe.com/c/pay/test" }), { status: 200 }));
    await expect(createPremiumCheckout(config, { interval: "monthly", authenticatedUserId: "u", verifiedAppOrigin: "https://sanctions.example" }, bad as typeof fetch)).rejects.toThrow(/test-mode/);
    const attacker = vi.fn(async () => new Response(JSON.stringify({ livemode: false, url: "https://attacker.example/pay" }), { status: 200 }));
    await expect(createPremiumCheckout(config, { interval: "monthly", authenticatedUserId: "u", verifiedAppOrigin: "https://sanctions.example" }, attacker as typeof fetch)).rejects.toThrow(/host/);
  });
});
