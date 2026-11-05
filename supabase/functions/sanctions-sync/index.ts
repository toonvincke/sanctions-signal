import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { parseUnConsolidated } from "../_shared/xml-feeds.ts";
import { parseSanctionsCsv, validateSnapshot, type SanctionsEntry } from "../_shared/sanctions-parsers.ts";

const url = Deno.env.get("SUPABASE_URL");
const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const CRON_SECRET = Deno.env.get("SANCTIONS_CRON_SECRET");
if (!url || !key) throw new Error("Missing Supabase server configuration");
const db = createClient(url, key, { auth: { persistSession: false } });

type Source = { id: string; code: string; name: string; source_url: string; jurisdiction: string };
const supported = new Set(["ofac_sdn", "ofac_non_sdn", "uk_sanctions", "un_consolidated"]);

async function hashText(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, "0")).join("");
}

async function reportFailure(source: Source, runId: string | undefined, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (runId) {
    const { error: cleanupError } = await db.from("sanctions_import_staging").delete().eq("run_id", runId);
    if (cleanupError) console.error("Could not clean failed staging run", runId, cleanupError.message);
    const { error: runError } = await db.from("sanctions_import_runs").update({
      status: "failed", finished_at: new Date().toISOString(), error_message: message.slice(0, 2000),
    }).eq("id", runId);
    if (runError) console.error("Could not save failure status", runId, runError.message);
  }
  const { error: sourceError } = await db.from("sanctions_sources").update({
    last_checked_at: new Date().toISOString(), last_error: message.slice(0, 2000),
  }).eq("id", source.id);
  if (sourceError) console.error("Could not save source failure", source.code, sourceError.message);
  return { source: source.code, status: "failed", error: message };
}

async function importOne(source: Source) {
  let runId: string | undefined;
  try {
    if (!supported.has(source.code)) throw new Error("Unsupported sanctions list source");
    if (!/^https:\/\//i.test(source.source_url)) throw new Error("List URL must use HTTPS");
    const { data: run, error: runError } = await db.from("sanctions_import_runs")
      .insert({ source_id: source.id, source_code: source.code, status: "running" }).select("id").single();
    if (runError || !run) throw new Error(`Cannot start import: ${runError?.message ?? "missing run"}`);
    runId = run.id;
    const response = await fetch(source.source_url, {
      headers: { "user-agent": "SanctionsSignal/1.0 (official sanctions monitoring)" },
      signal: AbortSignal.timeout(90_000),
    });
    if (!response.ok) throw new Error(`Official source returned HTTP ${response.status}`);
    const body = await response.text();
    if (body.length < 100) throw new Error("Unexpectedly empty source file");
    const contentHash = await hashText(body);
    const { data: current, error: stateError } = await db.from("sanctions_sources")
      .select("last_content_hash,last_success_at").eq("id", source.id).single();
    if (stateError) throw stateError;
    if (current?.last_success_at && current.last_content_hash === contentHash) {
      const now = new Date().toISOString();
      const { error: runUpdate } = await db.from("sanctions_import_runs").update({
        status: "unchanged", finished_at: now, http_status: response.status, content_hash: contentHash,
      }).eq("id", runId);
      if (runUpdate) throw runUpdate;
      const { error: sourceUpdate } = await db.from("sanctions_sources").update({
        last_checked_at: now, last_success_at: now, last_error: null,
      }).eq("id", source.id);
      if (sourceUpdate) throw sourceUpdate;
      return { source: source.code, status: "unchanged" };
    }
    const entries = source.code === "un_consolidated"
      ? parseUnConsolidated(source, body) : parseSanctionsCsv(source, body);
    validateSnapshot(entries);
    for (const entry of entries) {
      entry.content_hash = await hashText(JSON.stringify({
        name: entry.subject_name, type: entry.subject_type,
        programs: entry.programs, aliases: entry.aliases, details: entry.identifying_data,
      }));
    }
    // Stage without modifying the currently visible sanctions list.
    for (let offset = 0; offset < entries.length; offset += 250) {
      const batch = entries.slice(offset, offset + 250).map((entry) => ({
        ...entry, run_id: runId,
      }));
      const { error } = await db.from("sanctions_import_staging").insert(batch);
      if (error) throw new Error(`Staging failed at row ${offset}: ${error.message}`);
    }
    // Single database transaction validates counts, upserts changes, reconciles
    // missing entries, records import stats, and deletes staging rows.
    const { data: summary, error: finalError } = await db.rpc("finalize_sanctions_import", {
      p_run_id: runId, p_content_hash: contentHash, p_http_status: response.status,
    });
    if (finalError) throw new Error(`Finalization failed: ${finalError.message}`);
    return summary as { source: string; status: string; records: number; added: number; changed: number; removed: number };
  } catch (error) {
    return await reportFailure(source, runId, error);
  }
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
  if (!CRON_SECRET || request.headers.get("authorization") !== `Bearer ${CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  const { data: sources, error } = await db.from("sanctions_sources")
    .select("id,code,name,source_url,jurisdiction").eq("enabled", true).eq("source_type", "sanctions_list");
  if (error) return Response.json({ error: "Cannot list configured sanctions sources" }, { status: 500 });
  if (!sources?.length) return Response.json({ error: "No sanctions sources are enabled" }, { status: 503 });
  const body = await request.json().catch(() => ({}));
  const requested = typeof body?.source_code === "string" ? body.source_code : null;
  if (requested && !supported.has(requested)) {
    return Response.json({ error: "Unsupported source_code" }, { status: 400 });
  }
  // Prefer one source per invocation to stay within Edge Function runtime limits.
  const selected = requested ? (sources as Source[]).filter((item) => item.code === requested) : sources as Source[];
  if (!selected.length) return Response.json({ error: "Requested source is not enabled" }, { status: 404 });
  const results = [];
  for (const source of selected) results.push(await importOne(source));
  return Response.json({ results, checked_at: new Date().toISOString() }, {
    status: results.some((result) => result.status === "failed") ? 502 : 200,
  });
});
