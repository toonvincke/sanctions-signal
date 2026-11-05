import { describe, expect, it } from "vitest";
import { REGIMES } from "@/lib/sanctions-programs";
import { getProgrammeDetail, PROGRAMME_DETAILS, programmeSlug, OFFICIAL_LEGAL_PORTALS } from "@/lib/programme-detail";

describe("SS-021: programme detail catalogue", () => {
  it("covers every listed programme for every jurisdiction", () => {
    const count = Object.values(REGIMES).reduce((total, regime) =>
      total + regime.groups.reduce((sum, group) => sum + group.programs.length, 0), 0);
    expect(PROGRAMME_DETAILS).toHaveLength(count);
    for (const entry of PROGRAMME_DETAILS) {
      expect(getProgrammeDetail(entry.jurisdiction, entry.slug)?.programme).toBe(entry.programme);
      expect(entry.slug).toBe(programmeSlug(entry.programme.name));
    }
  });

  it("uses unique, non-empty, URL-safe keys within each jurisdiction", () => {
    const keys = PROGRAMME_DETAILS.map((p) => `${p.jurisdiction}/${p.slug}`);
    expect(new Set(keys).size).toBe(keys.length);
    for (const entry of PROGRAMME_DETAILS) expect(entry.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  });

  it("does not resolve unknown jurisdictions or programme URLs", () => {
    expect(getProgrammeDetail("unknown", "russia")).toBeUndefined();
    expect(getProgrammeDetail("eu", "not-an-existing-programme")).toBeUndefined();
  });

  it.each(["eu", "us", "uk", "un"] as const)("provides a valid official portal for %s", (jurisdiction) => {
    const portal = OFFICIAL_LEGAL_PORTALS[jurisdiction];
    expect(new URL(portal.url).protocol).toBe("https:");
    expect(portal.label.length).toBeGreaterThan(0);
    expect(PROGRAMME_DETAILS.some((detail) => detail.jurisdiction === jurisdiction)).toBe(true);
  });
});
