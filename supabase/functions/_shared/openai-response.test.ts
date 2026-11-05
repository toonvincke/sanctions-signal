import { strict as assert } from "node:assert";
import { extractResponseText } from "./openai-response.ts";
const message = (content: unknown[]) => ({ type: "message", status: "completed", content });
Deno.test("extracts raw REST output text", () => {
  assert.equal(extractResponseText({ status: "completed", output: [message([{ type: "output_text", text: "Hello" }])] }), "Hello");
});
Deno.test("joins output parts and ignores reasoning", () => {
  assert.equal(extractResponseText({ status: "completed", output: [{ type: "reasoning", summary: [] }, message([{ type: "output_text", text: "First" }, { type: "output_text", text: "Second" }]), message([{ type: "output_text", text: "Third" }])] }), "First\nSecond\nThird");
});
Deno.test("rejects invalid, refused, and incomplete responses", () => {
  for (const payload of [
    { status: "incomplete", incomplete_details: { reason: "max_output_tokens" }, output: [] },
    { status: "failed", error: { message: "failed" }, output: [] },
    { status: "in_progress", output: [] },
    { status: "completed", output: [message([{ type: "refusal", refusal: "No" }])] },
    { status: "completed", output: [] },
    { output_text: "SDK-only property" },
  ]) assert.throws(() => extractResponseText(payload));
});
