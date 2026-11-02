import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const CRON_SECRET = Deno.env.get("SANCTIONS_CRON_SECRET")!;

function textOf(node: Element | null, selector: string) {
  return node?.querySelector(selector)?.textContent?.trim() ?? "";
}
function decodeXml(value: string) {
  return value.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}
function sha(value: string) {
  return crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)).then((b) =>
    Array.from(new Uint8Array(b), (x) => x.toString(16).padStart(2, "0")).join(""));
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  if (!CRON_SECRET || req.headers.get("authorization") !== `Bearer ${CRON_SECRET}`) return new Response("Unauthorized", { status: 401 });
  const { data: sources, error } = await db.from("sanctions_sources").select("code,name,source_url").eq("enabled", true).eq("source_type", "rss");
  if (error) return Response.json({ error: error.message }, { status: 500 });
  const results = [];
  for (const source of sources ?? []) {
    try {
      const response = await fetch(source.source_url, { headers: { "user-agent": "SanctionsSignal/1.0" } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const xml = await response.text();
      const doc = new DOMParser().parseFromString(xml, "text/xml");
      if (doc.querySelector("parsererror")) throw new Error("Invalid RSS/Atom XML");
      const items = [...doc.querySelectorAll("item")].map((item) => ({
        title: textOf(item, "title"), url: textOf(item, "link"), date: textOf(item, "pubDate"),
        description: decodeXml(textOf(item, "description")),
      })).concat([...doc.querySelectorAll("entry")].map((item) => ({
        title: textOf(item, "title"),
        url: item.querySelector("link[rel='alternate']")?.getAttribute("href") ?? item.querySelector("link")?.getAttribute("href") ?? "",
        date: textOf(item, "published") || textOf(item, "updated"),
        description: decodeXml(textOf(item, "summary") || textOf(item, "content")),
      })));
      let discovered = 0;
      for (const item of items) {
        if (!item.title || !item.url || !/^https:\/\//i.test(item.url)) continue;
        const contentHash = await sha([item.title, item.description].join("\n"));
        const { error: upsertError } = await db.from("intelligence_candidates").upsert({
          source_code: source.code, source_url: item.url, source_title: item.title,
          source_publisher: source.name, published_at: item.date ? new Date(item.date).toISOString() : null,
          content_hash: contentHash, extracted_text: item.description.slice(0, 20000),
        }, { onConflict: "source_url", ignoreDuplicates: true });
        if (upsertError) throw upsertError;
        discovered++;
      }
      results.push({ source: source.code, status: "succeeded", discovered });
    } catch (error) {
      results.push({ source: source.code, status: "failed", error: error instanceof Error ? error.message : String(error) });
    }
  }
  return Response.json({ results, checked_at: new Date().toISOString() });
});
