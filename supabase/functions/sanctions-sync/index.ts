import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CRON_SECRET = Deno.env.get("SANCTIONS_CRON_SECRET")!;
const db = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

type Source = { id: string; code: string; name: string; source_url: string; jurisdiction: string };
type Entry = { source_code: string; source_entry_id: string; subject_name: string; subject_type: string | null; programs: string[]; aliases: string[]; identifying_data: Record<string, unknown>; source_url: string; content_hash: string };

function csvRows(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], field = "", quoted = false;
  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (c === '"') {
      if (quoted && input[i + 1] === '"') { field += '"'; i++; }
      else quoted = !quoted;
    } else if (c === "," && !quoted) { row.push(field); field = ""; }
    else if ((c === "\n" || c === "\r") && !quoted) {
      if (c === "\r" && input[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some((v) => v.trim())) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((v) => v.trim())) rows.push(row);
  return rows;
}
function hashText(text: string): Promise<string> {
  return crypto.subtle.digest("SHA-256", new TextEncoder().encode(text))
    .then((digest) => Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join(""));
}
function pick(row: string[], headers: string[], candidates: string[]): string {
  const index = headers.findIndex((h) => candidates.includes(h.toLowerCase().replace(/[^a-z0-9]/g, "")));
  return index >= 0 ? (row[index] ?? "").trim() : "";
}
function mapCsvRows(source: Source, body: string): Entry[] {
  const rows = csvRows(body);
  if (!rows.length) return [];
  const firstHeaders = rows[0].map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ""));
  const hasHeader = firstHeaders.some((h) => ["uniqueidentifier","uniqueid","sdnname","name","name1","subjectname","fullname","referencenumber"].includes(h));
  const headers = hasHeader ? rows[0].map((h) => h.trim()) : [];
  const data = hasHeader ? rows.slice(1) : rows;
  return data.flatMap((row, index) => {
    // OFAC SDN CSV has no header: ent_num, name, type, program, title, call sign, vessel type, ...
    const id = hasHeader
      ? pick(row, headers, ["uniqueidentifier","uniqueid","id","reference","referencenumber","entnum"])
      : (row[0] ?? "").trim();
    const name = hasHeader
      ? pick(row, headers, ["name","name1","fullname","primaryname","subjectname","entityname","individualname"])
      : (row[1] ?? "").trim();
    if (!name) return [];
    const type = hasHeader ? pick(row, headers, ["type","subjecttype","entitytype","individualentityship"]) : (row[2] ?? "");
    const program = hasHeader ? pick(row, headers, ["program","regime","sanctionsprogram","regimename"]) : (row[3] ?? "");
    const raw = Object.fromEntries((headers.length ? headers : row.map((_, i) => String(i))).map((h, i) => [h, row[i] ?? ""]));
    return [{
      source_code: source.code, source_entry_id: id || `${source.code}:${index}:${name.toLowerCase()}`,
      subject_name: name, subject_type: type || null,
      programs: program ? program.split(/[;,|]/).map((v) => v.trim()).filter(Boolean) : [],
      aliases: [], identifying_data: raw, source_url: source.source_url, content_hash: "",
    }];
  });
}
function mapUnXml(source: Source, body: string): Entry[] {
  const doc = new DOMParser().parseFromString(body, "text/xml");
  if (doc.querySelector("parsererror")) throw new Error("UN XML could not be parsed");
  const result: Entry[] = [];
  for (const node of [...doc.querySelectorAll("INDIVIDUAL, ENTITY")]) {
    const isIndividual = node.tagName === "INDIVIDUAL";
    const get = (tag: string) => node.querySelector(tag)?.textContent?.trim() ?? "";
    const id = get(isIndividual ? "INDIVIDUAL_ID" : "ENTITY_ID") || get("REFERENCE_NUMBER");
    const name = isIndividual
      ? [get("FIRST_NAME"), get("SECOND_NAME"), get("THIRD_NAME"), get("FOURTH_NAME")].filter(Boolean).join(" ")
      : get("ENTITY_NAME");
    if (!id || !name) continue;
    const aliases = [...node.querySelectorAll("INDIVIDUAL_ALIAS ALIAS_NAME, ENTITY_ALIAS ALIAS_NAME")]
      .map((x) => x.textContent?.trim() ?? "").filter(Boolean);
    const programs = [get("UN_LIST_TYPE")].filter(Boolean);
    const identifying: Record<string, unknown> = {
      reference_number: get("REFERENCE_NUMBER"), listed_on: get("LISTED_ON"),
      comments: get("COMMENTS1"), nationality: [...node.querySelectorAll("NATIONALITY/VALUE")].map((x) => x.textContent?.trim()).filter(Boolean),
      date_of_birth: [...node.querySelectorAll("INDIVIDUAL_DATE_OF_BIRTH/DATE")].map((x) => x.textContent?.trim()).filter(Boolean),
    };
    result.push({
      source_code: source.code, source_entry_id: id, subject_name: name,
      subject_type: isIndividual ? "individual" : "entity", programs, aliases,
      identifying_data: identifying, source_url: source.source_url, content_hash: "",
    });
  }
  if (!result.length) throw new Error("UN XML parsed but no individual/entity records were mapped; refusing to mark source current");
  return result;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  if (!CRON_SECRET || req.headers.get("authorization") !== `Bearer ${CRON_SECRET}`) return new Response("Unauthorized", { status: 401 });
  const { data: sources, error: sourceError } = await db.from("sanctions_sources")
    .select("id,code,name,source_url,jurisdiction").eq("enabled", true).eq("source_type", "sanctions_list");
  if (sourceError) return Response.json({ error: sourceError.message }, { status: 500 });

  const results = [];
  for (const source of (sources ?? []) as Source[]) {
    const { data: run } = await db.from("sanctions_import_runs")
      .insert({ source_id: source.id, source_code: source.code, status: "running" }).select("id").single();
    try {
      const response = await fetch(source.source_url, { headers: { "user-agent": "SanctionsSignal/1.0 (+automated compliance data monitoring)" } });
      if (!response.ok) throw new Error(`Source returned HTTP ${response.status}`);
      const body = await response.text();
      if (!body.trim()) throw new Error("Source returned an empty file");
      const contentHash = await hashText(body);
      const { data: current } = await db.from("sanctions_sources").select("last_content_hash").eq("id", source.id).single();
      if (current?.last_content_hash === contentHash) {
        await db.from("sanctions_import_runs").update({ status: "unchanged", finished_at: new Date().toISOString(), http_status: response.status, content_hash: contentHash }).eq("id", run?.id);
        await db.from("sanctions_sources").update({ last_checked_at: new Date().toISOString(), last_success_at: new Date().toISOString(), last_error: null }).eq("id", source.id);
        results.push({ source: source.code, status: "unchanged" });
        continue;
      }
      let entries: Entry[];
      if (source.code === "un_consolidated") entries = mapUnXml(source, body);
      else if (source.source_url.toLowerCase().endsWith(".xml")) {
        throw new Error("No validated XML parser is configured for this source yet");
      } else entries = mapCsvRows(source, body);
      if (!entries.length) throw new Error("No entries could be mapped; refusing to mark this source current");
      for (const entry of entries) entry.content_hash = await hashText(JSON.stringify(entry.identifying_data));
      const { error: upsertError } = await db.from("sanctions_list_entries").upsert(entries, { onConflict: "source_code,source_entry_id" });
      if (upsertError) throw upsertError;
      await db.from("sanctions_import_runs").update({
        status: "succeeded", finished_at: new Date().toISOString(), http_status: response.status,
        content_hash: contentHash, records_seen: entries.length, metadata: { format: source.source_url.toLowerCase().endsWith(".xml") ? "xml" : "csv" },
      }).eq("id", run?.id);
      await db.from("sanctions_sources").update({
        last_checked_at: new Date().toISOString(), last_success_at: new Date().toISOString(),
        last_content_hash: contentHash, last_error: null,
      }).eq("id", source.id);
      results.push({ source: source.code, status: "succeeded", records: entries.length });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await db.from("sanctions_import_runs").update({ status: "failed", finished_at: new Date().toISOString(), error_message: message }).eq("id", run?.id);
      await db.from("sanctions_sources").update({ last_checked_at: new Date().toISOString(), last_error: message }).eq("id", source.id);
      results.push({ source: source.code, status: "failed", error: message });
    }
  }
  return Response.json({ results, checked_at: new Date().toISOString() });
});
