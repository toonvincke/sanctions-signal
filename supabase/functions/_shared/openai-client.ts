import { extractResponseText } from "./openai-response.ts";
import { validateIntelligenceDraft } from "./intelligence-draft.ts";

type Fetcher = typeof fetch;

export async function requestOpenAIText(apiKey: string, requestBody: Record<string, unknown>, fetcher: Fetcher = fetch): Promise<string> {
  let response: Response;
  try {
    response = await fetcher("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      body: JSON.stringify(requestBody),
    });
  } catch {
    throw new Error("AI provider network request failed");
  }
  if (!response.ok) throw new Error(`AI provider returned HTTP ${response.status}`);
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error("AI provider returned invalid JSON");
  }
  return extractResponseText(payload);
}

export async function requestIntelligenceDraft(apiKey: string, requestBody: Record<string, unknown>, fetcher: Fetcher = fetch): Promise<Record<string, unknown>> {
  const raw = await requestOpenAIText(apiKey, requestBody, fetcher);
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { throw new Error("AI draft response was not valid JSON"); }
  return validateIntelligenceDraft(parsed);
}
