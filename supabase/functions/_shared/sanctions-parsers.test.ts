import { describe, expect, it } from "vitest";
import { parseSanctionsCsv, validateSnapshot } from "./sanctions-parsers";

const sdn = { code: "ofac_sdn", source_url: "https://example.org/sdn.csv" };
const nonSdn = { code: "ofac_non_sdn", source_url: "https://example.org/cons_prim.csv" };

describe("OFAC trailing sentinel", () => {
  it.each([sdn, nonSdn])("ignores only the terminal -0- marker for $code", (source) => {
    const entries = parseSanctionsCsv(source, "ent_num,name,sdn_type,program\n123,Example Person,individual,TEST\n-0-\n");
    expect(entries).toHaveLength(1);
    expect(entries[0].source_entry_id).toBe("123");
    expect(entries[0].subject_name).toBe("Example Person");
    validateSnapshot(entries, 1);
  });

  it("rejects an unexpected marker in the middle of the file", () => {
    expect(() => parseSanctionsCsv(sdn, "123,Example,individual,TEST\n-0-\n456,Another,entity,TEST\n"))
      .toThrow(/Malformed OFAC row 2/);
  });

  it("rejects malformed final rows other than the exact marker", () => {
    expect(() => parseSanctionsCsv(sdn, "123,Example,individual,TEST\nnot-an-id,Another,entity,TEST\n"))
      .toThrow(/Malformed OFAC row 2/);
  });

  it("rejects a marker with extra columns", () => {
    expect(() => parseSanctionsCsv(sdn, "123,Example,individual,TEST\n-0-,unexpected\n"))
      .toThrow(/Malformed OFAC row 2/);
  });

  it("rejects a file containing only the marker", () => {
    expect(() => parseSanctionsCsv(sdn, "-0-\n")).toThrow("OFAC CSV is empty");
  });
});

describe("UK source grouping", () => {
  const source = { code: "uk_sanctions", source_url: "https://example.org/uk.csv" };
  const header = "Unique ID,Name 1,Name 2,Name 3,Name 4,Name 5,Name 6,Name type,Regime Name";
  it("groups primary and alias rows without duplicating designations", () => {
    const csv = ["Report date: 2026-11-05", header,
      "UK1,Example,,,,,Person,Primary name,Regime A",
      "UK1,Alias,,,,,Person,Alias,Regime A",
      "UK2,Another,,,,,Entity,Primary name,Regime B"].join("\n");
    const entries = parseSanctionsCsv(source, csv);
    expect(entries).toHaveLength(2);
    expect(entries[0].aliases).toContain("Alias Person");
    validateSnapshot(entries, 2);
  });
  it("rejects missing UK designation IDs", () => {
    expect(() => parseSanctionsCsv(source, [header, ",Example,,,,,Person,Primary name,Regime A"].join("\n")))
      .toThrow(/Malformed UKSL CSV row 2/);
  });
});
