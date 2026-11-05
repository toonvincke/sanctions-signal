import { describe, expect, it, vi } from "vitest";
import { requestOpenAIText, requestIntelligenceDraft } from "./openai-client.ts";

const draft = { content_type: "guidance", legal_status: "announced", headline: "Headline", executive_summary: "Summary", source_facts: "Facts", practical_implications: "Preliminary implications", detailed_analysis: "Analysis", affected_entities: [], affected_sectors: [], legal_provisions: [], tags: [], priority: false };
const raw = (text: string) => ({ status: "completed", output: [{ type: "message", status: "completed", content: [{ type: "output_text", text }] }] });
const fakeFetch = (response: Response) => vi.fn(async () => response) as unknown as typeof fetch;
describe("OpenAI request integration (mock HTTP, no live API)", () => {
  it("assistant extracts text and sends authenticated request", async () => {
    const fetcher = fakeFetch(Response.json(raw("Answer [S1]")));
    expect(await requestOpenAIText("test-key", { model: "test", input: [] }, fetcher)).toBe("Answer [S1]");
    expect(fetcher).toHaveBeenCalledWith("https://api.openai.com/v1/responses", expect.objectContaining({ method: "POST", headers: expect.objectContaining({ authorization: "Bearer test-key" }) }));
  });
  it("discovery extracts and validates structured draft", async () => {
    expect(await requestIntelligenceDraft("test-key", { model: "test" }, fakeFetch(Response.json(raw(JSON.stringify(draft)))))).toEqual(draft);
  });
  it("rejects HTTP errors", async () => {
    await expect(requestOpenAIText("test", {}, fakeFetch(new Response("", { status: 429 })))).rejects.toThrow("HTTP 429");
  });
  it("rejects refusal and incomplete responses", async () => {
    await expect(requestOpenAIText("test", {}, fakeFetch(Response.json({ status: "incomplete", output: [] })))).rejects.toThrow("incomplete");
    await expect(requestOpenAIText("test", {}, fakeFetch(Response.json({ status: "completed", output: [{ type: "message", content: [{ type: "refusal", refusal: "no" }] }] })))).rejects.toThrow("refused");
  });
  it("rejects malformed draft", async () => {
    await expect(requestIntelligenceDraft("test", {}, fakeFetch(Response.json(raw('{"headline":"incomplete"}'))))).rejects.toThrow("schema");
  });
  it("does not leak network error details", async () => {
    const failing = vi.fn(async () => { throw new Error("secret detail"); }) as unknown as typeof fetch;
    await expect(requestOpenAIText("test", {}, failing)).rejects.toThrow("network request failed");
  });
});
