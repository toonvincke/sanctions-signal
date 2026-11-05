import { strict as assert } from "node:assert";
import { requestOpenAIText, requestIntelligenceDraft } from "./openai-client.ts";
const draft = { content_type: "guidance", legal_status: "announced", headline: "Headline", executive_summary: "Summary", source_facts: "Facts", practical_implications: "Preliminary implications", detailed_analysis: "Analysis", affected_entities: [], affected_sectors: [], legal_provisions: [], tags: [], priority: false };
const raw = (text: string) => ({ status: "completed", output: [{ type: "message", status: "completed", content: [{ type: "output_text", text }] }] });
const fakeFetch = (response: Response): typeof fetch => (async () => response) as typeof fetch;
Deno.test("assistant extracts text and authenticates request", async () => {
  let url = "", headers: HeadersInit | undefined;
  const fetcher = (async (input: string | URL | Request, init?: RequestInit) => { url = String(input); headers = init?.headers; return Response.json(raw("Answer [S1]")); }) as typeof fetch;
  assert.equal(await requestOpenAIText("test-key", { model: "test" }, fetcher), "Answer [S1]");
  assert.equal(url, "https://api.openai.com/v1/responses");
  assert.equal(new Headers(headers).get("authorization"), "Bearer test-key");
});
Deno.test("discovery parses and validates JSON draft", async () => {
  assert.deepEqual(await requestIntelligenceDraft("test", { model: "test" }, fakeFetch(Response.json(raw(JSON.stringify(draft))))), draft);
});
Deno.test("rejects HTTP errors", async () => {
  await assert.rejects(requestOpenAIText("test", {}, fakeFetch(new Response("", { status: 429 }))), /HTTP 429/);
});
Deno.test("rejects refusal and incomplete responses", async () => {
  await assert.rejects(requestOpenAIText("test", {}, fakeFetch(Response.json({ status: "incomplete", output: [] }))), /incomplete/);
  await assert.rejects(requestOpenAIText("test", {}, fakeFetch(Response.json({ status: "completed", output: [{ type: "message", content: [{ type: "refusal", refusal: "no" }] }] }))), /refused/);
});
Deno.test("rejects malformed draft", async () => {
  await assert.rejects(requestIntelligenceDraft("test", {}, fakeFetch(Response.json(raw('{"headline":"incomplete"}')))), /schema/);
});
Deno.test("does not leak network error details", async () => {
  const failing = (async () => { throw new Error("secret detail"); }) as typeof fetch;
  await assert.rejects(requestOpenAIText("test", {}, failing), /network request failed/);
});
