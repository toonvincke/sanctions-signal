import { describe, expect, it } from "vitest";
import { PROGRAMME_DETAILS, OFFICIAL_LEGAL_PORTALS } from "./programme-detail";

describe("SS-024 source coverage", () => {
  it("all programme pages have unique jurisdiction/slug keys", () => {
    const keys = PROGRAMME_DETAILS.map((p) => p.jurisdiction + "/" + p.slug);
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys.length).toBeGreaterThan(0);
  });
  it("the UK domestic counter-terrorism page identifies the current sanctions regulations rather than a repealed act", () => {
    const item = PROGRAMME_DETAILS.find(p => p.jurisdiction === "uk" && p.slug === "domestic-counter-terrorism");
    expect(item?.programme.basis).toContain("Counter-Terrorism (Sanctions) (EU Exit) Regulations 2019");
    expect(item?.programme.basis).not.toContain("Terrorist Asset-Freezing");
  });
  it("all programmes have a jurisdiction-level official fallback without claiming programme verification", () => {
    for (const p of PROGRAMME_DETAILS) {
      const portal = OFFICIAL_LEGAL_PORTALS[p.jurisdiction];
      expect(portal.url).toMatch(/^https:\/\//);
      expect(portal.label).toBeTruthy();
    }
  });
  it("catalogue includes all four issuing jurisdictions", () => {
    expect(new Set(PROGRAMME_DETAILS.map(p => p.jurisdiction))).toEqual(new Set(["un","eu","uk","us"]));
  });
});
