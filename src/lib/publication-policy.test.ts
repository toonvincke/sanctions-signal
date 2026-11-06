import { describe, expect, it } from "vitest";
import { canPublishEditorial, validateOfficialSource } from "./publication-policy";

const valid = {
  url: "https://eur-lex.europa.eu/eli/reg/2024/1745/oj",
  publisher: "EUR-Lex",
  sourceType: "legislation" as const,
  sourceDate: "2024-06-25",
  programmeSlug: "russia",
  title: "Council Regulation",
};
describe("SS-023 publication policy", () => {
  it("accepts structurally valid official metadata", () => expect(validateOfficialSource(valid)).toBe(true));
  it.each([
    "http://eur-lex.europa.eu/eli/reg/2024/1745/oj",
    "https://eur-lex.europa.eu.evil.example/item",
    "https://evil.example/item",
    "https://user:pass@eur-lex.europa.eu/item",
  ])("rejects untrusted URL %s", url => expect(validateOfficialSource({ ...valid, url })).toBe(false));
  it("rejects invalid dates", () => expect(validateOfficialSource({ ...valid, sourceDate: "2026-02-30" })).toBe(false));
  it("rejects missing source fields", () => expect(validateOfficialSource({ ...valid, title: "" })).toBe(false));
  it("requires explicit editorial approval", () => {
    expect(canPublishEditorial("draft", "reviewer", "2026-11-06")).toBe(false);
    expect(canPublishEditorial("approved", null, "2026-11-06")).toBe(false);
    expect(canPublishEditorial("approved", "reviewer", null)).toBe(false);
    expect(canPublishEditorial("approved", "reviewer", "2026-11-06")).toBe(true);
  });
});
