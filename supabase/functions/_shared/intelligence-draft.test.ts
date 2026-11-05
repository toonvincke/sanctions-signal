import { describe, expect, it } from "vitest";
import { validateIntelligenceDraft } from "./intelligence-draft";
const valid = { content_type: "guidance", legal_status: "announced", headline: "Headline", executive_summary: "Summary", source_facts: "Facts", practical_implications: "Preliminary analysis", detailed_analysis: "Analysis", affected_entities: [], affected_sectors: [], legal_provisions: [], tags: [], priority: false };
describe("validateIntelligenceDraft", () => {
  it("accepts a complete draft", () => expect(validateIntelligenceDraft(valid)).toEqual(valid));
  it("rejects missing required fields", () => expect(() => validateIntelligenceDraft({ ...valid, detailed_analysis: undefined })).toThrow());
  it("rejects incorrect array types", () => expect(() => validateIntelligenceDraft({ ...valid, tags: ["ok", 1] })).toThrow());
  it("rejects invalid enum values", () => expect(() => validateIntelligenceDraft({ ...valid, legal_status: "unknown" })).toThrow());
  it("rejects invalid boolean", () => expect(() => validateIntelligenceDraft({ ...valid, priority: "yes" })).toThrow());
});
