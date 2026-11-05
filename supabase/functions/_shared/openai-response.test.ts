import { describe, expect, it } from "vitest";
import { extractResponseText } from "./openai-response";

const message = (content: unknown[]) => ({ type: "message", status: "completed", content });
describe("extractResponseText", () => {
  it("extracts raw REST output text", () => {
    expect(extractResponseText({ status: "completed", output: [message([{ type: "output_text", text: "Hello" }])] })).toBe("Hello");
  });
  it("joins multiple output text parts and messages", () => {
    expect(extractResponseText({ status: "completed", output: [
      { type: "reasoning", summary: [] },
      message([{ type: "output_text", text: "First" }, { type: "output_text", text: "Second" }]),
      message([{ type: "output_text", text: "Third" }]),
    ] })).toBe("First\nSecond\nThird");
  });
  it.each([
    { status: "incomplete", incomplete_details: { reason: "max_output_tokens" }, output: [] },
    { status: "failed", error: { message: "failed" }, output: [] },
    { status: "in_progress", output: [] },
    { status: "completed", output: [message([{ type: "refusal", refusal: "No" }])] },
    { status: "completed", output: [] },
    { output_text: "SDK-only property" },
  ])("rejects invalid, refused or incomplete responses", (payload) => {
    expect(() => extractResponseText(payload)).toThrow();
  });
});
