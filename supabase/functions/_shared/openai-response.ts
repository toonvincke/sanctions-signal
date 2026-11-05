/** Extract text from the raw OpenAI Responses REST API response (not the SDK convenience property). */
export function extractResponseText(payload: unknown): string {
  if (!payload || typeof payload !== "object") throw new Error("Invalid OpenAI response payload");
  const data = payload as Record<string, unknown>;
  if (data.error) throw new Error("OpenAI response contains an error");
  if (data.status === "failed" || data.status === "cancelled") throw new Error(`OpenAI response status: ${data.status}`);
  if (data.status === "incomplete" || data.incomplete_details) throw new Error("OpenAI response is incomplete");
  if (data.status && data.status !== "completed") throw new Error(`OpenAI response not completed: ${data.status}`);
  if (!Array.isArray(data.output)) throw new Error("OpenAI response has no output array");
  const texts: string[] = [];
  for (const item of data.output) {
    if (!item || typeof item !== "object" || item.type !== "message") continue;
    if (item.status && item.status !== "completed") throw new Error("OpenAI message is incomplete");
    if (!Array.isArray(item.content)) continue;
    for (const part of item.content) {
      if (part?.type === "refusal") throw new Error("OpenAI refused the request");
      if (part?.type === "output_text" && typeof part.text === "string") texts.push(part.text);
    }
  }
  const text = texts.join("\n").trim();
  if (!text) throw new Error("OpenAI response contained no output text");
  return text;
}
