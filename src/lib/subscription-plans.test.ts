import { describe, expect, it } from "vitest";
import { PREMIUM_PLAN, PREMIUM_PRICING, annualSavings, hasPremiumAccess } from "./subscription-plans";
describe("SS-025 subscription pricing and access", () => {
  it("exposes one Premium plan with monthly and annual billing", () => {
    expect(PREMIUM_PLAN.id).toBe("premium");
    expect(Object.keys(PREMIUM_PLAN.billing)).toEqual(["monthly", "annual"]);
    expect(PREMIUM_PLAN.priceStatus).toBe("provisional");
  });
  it("keeps monthly €25, yearly €270 and 10 percent discount", () => {
    expect(PREMIUM_PRICING.monthly * 12).toBe(300);
    expect(PREMIUM_PRICING.annualTotal).toBe(270);
    expect(annualSavings()).toBe(10);
  });
  it("denies free, missing, expired and past-due entitlements", () => {
    const now = new Date("2026-11-06T12:00:00Z");
    expect(hasPremiumAccess(null, null, now)).toBe(false);
    expect(hasPremiumAccess("past_due", "2027-01-01T00:00:00Z", now)).toBe(false);
    expect(hasPremiumAccess("active", "2026-11-05T00:00:00Z", now)).toBe(false);
    expect(hasPremiumAccess("active", null, now)).toBe(false);
  });
  it("accepts valid active entitlements in their paid period", () => {
    expect(hasPremiumAccess("active", "2026-12-01T00:00:00Z", new Date("2026-11-06T12:00:00Z"))).toBe(true);
  });
});
