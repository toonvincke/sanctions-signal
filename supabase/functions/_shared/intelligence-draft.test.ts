import { strict as assert } from "node:assert";
import { validateIntelligenceDraft } from "./intelligence-draft.ts";
const valid = { content_type: "guidance", legal_status: "announced", headline: "Headline", executive_summary: "Summary", source_facts: "Facts", practical_implications: "Preliminary analysis", detailed_analysis: "Analysis", affected_entities: [], affected_sectors: [], legal_provisions: [], tags: [], priority: false };
Deno.test("accepts complete draft", () => assert.deepEqual(validateIntelligenceDraft(valid), valid));
Deno.test("rejects missing required fields", () => assert.throws(() => validateIntelligenceDraft({ ...valid, detailed_analysis: undefined })));
Deno.test("rejects incorrect array types", () => assert.throws(() => validateIntelligenceDraft({ ...valid, tags: ["ok", 1] })));
Deno.test("rejects invalid enums", () => assert.throws(() => validateIntelligenceDraft({ ...valid, legal_status: "unknown" })));
Deno.test("rejects invalid boolean", () => assert.throws(() => validateIntelligenceDraft({ ...valid, priority: "yes" })));
