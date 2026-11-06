import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { probeOfficialLink, type LinkResult } from "../_shared/official-link-check.ts";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const secret = Deno.env.get("SANCTIONS_CRON_SECRET") ?? "";
const allowedResults = new Set(["ok", "redirected", "broken", "blocked", "unavailable"]);

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`)
    return new Response("Unauthorized", { status: 401 });

  const body = await req.json().catch(() => ({}));
  const offset = Number(body?.offset ?? 0);
  const count = Number(body?.batch_size ?? 20);
  if (!Number.isInteger(offset) || offset < 0 || offset > 10000 ||
      !Number.isInteger(count) || count < 1 || count > 25)
    return Response.json({ error: "Invalid batch parameters" }, { status: 400 });

  // Check only previously curated public mappings. A reachable EU legal act
  // is not automatically evidence that it belongs to the right programme.
  const { data: programmes, error: listError } = await db.from("sanctions_programmes")
    .select("id,source_mapping_status,official_programme_url")
    .in("source_mapping_status", ["mapped", "link_broken"])
    .not("official_programme_url", "is", null)
    .order("id")
    .range(offset, offset + count - 1);
  if (listError) return Response.json({ error: "Programme query failed" }, { status: 500 });

  // A URL can belong to more than one programme; probe each unique URL once.
  const cache = new Map<string, LinkResult>();
  const results: { status: string; error?: string }[] = [];
  for (const programme of programmes ?? []) {
    try {
      const url = programme.official_programme_url as string;
      let check = cache.get(url);
      if (!check) {
        check = await probeOfficialLink(url);
        cache.set(url, check);
      }
      if (!allowedResults.has(check.status)) throw new Error("Invalid check status");
      const valid = check.status === "ok" || check.status === "redirected";
      const confirmedBroken = check.status === "broken" && [404,410].includes(check.http_status ?? 0);
      const note = [check.status, check.http_status, check.redirect].filter(Boolean).join(" · ").slice(0,300);
      const { error } = await db.from("sanctions_programmes").update({
        source_last_checked_at: check.checked_at,
        source_check_note: note,
        ...(confirmedBroken ? { source_mapping_status: "link_broken" } :
          valid && programme.source_mapping_status === "link_broken" ? { source_mapping_status: "mapped" } : {}),
      }).eq("id", programme.id).eq("official_programme_url", url);
      if (error) throw error;
      results.push({ status: check.status });
    } catch (error) {
      console.error("Programme source check failed:", error instanceof Error ? error.message : "Unknown error");
      results.push({ status: "error" });
    }
  }
  return Response.json({
    checked: results.length, offset, has_more: results.length === count,
    statuses: results.reduce<Record<string, number>>((acc, item) => {
      acc[item.status] = (acc[item.status] ?? 0) + 1; return acc;
    }, {}),
  }, { status: results.some(x => x.status === "error") ? 502 : 200 });
});
