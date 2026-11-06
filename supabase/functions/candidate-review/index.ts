import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validateIntelligenceDraft } from "../_shared/intelligence-draft.ts";

// Service-role key never leaves this edge function.
const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const respond = (body: unknown, status = 200) => Response.json(body, { status, headers: cors });
const approvedActions = ["approve", "reject", "correct", "withdraw"];

function cleanDraft(raw: unknown, correction: boolean) {
  const draft = validateIntelligenceDraft(raw);
  const cleaned: Record<string, unknown> = {};
  for (const key of ["content_type", "legal_status", "headline", "executive_summary",
    "source_facts", "detailed_analysis", "practical_implications"]) {
    cleaned[key] = typeof draft[key] === "string" ? (draft[key] as string).trim().slice(0, 20000) : draft[key];
  }
  for (const key of ["affected_entities", "affected_sectors", "legal_provisions", "tags"]) {
    cleaned[key] = (draft[key] as string[]).slice(0, 100).map((v) => v.slice(0, 300));
  }
  cleaned.priority = draft.priority;
  if (!correction) {
    const slugBase = (cleaned.headline as string).toLowerCase().normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 72) || "intelligence-update";
    cleaned.slug = slugBase.replace(/-+$/, "") + "-" + crypto.randomUUID().slice(0, 8);
  }
  return cleaned;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return respond({ error: "Method not allowed" }, 405);

  const auth = req.headers.get("authorization") ?? "";
  const match = auth.match(/^Bearer\s+(\S+)$/i);
  if (!match) return respond({ error: "Authentication required" }, 401);
  const { data: { user }, error: authError } = await db.auth.getUser(match[1]);
  if (authError || !user) return respond({ error: "Authentication required" }, 401);

  // Neither user_metadata nor client-provided roles authorize publication.
  const { data: role, error: roleError } = await db.from("user_roles")
    .select("id").eq("user_id", user.id).eq("role", "admin").maybeSingle();
  if (roleError) return respond({ error: "Unable to verify reviewer permissions" }, 500);
  if (!role) return respond({ error: "Admin access required" }, 403);

  if (Number(req.headers.get("content-length") ?? 0) > 300_000) {
    return respond({ error: "Payload too large" }, 413);
  }
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object" ||
      typeof body.candidate_id !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(body.candidate_id) ||
      !approvedActions.includes(body.decision)) {
    return respond({ error: "Valid candidate_id and decision required" }, 400);
  }
  const notes = typeof body.review_notes === "string" ? body.review_notes.trim().slice(0, 4000) : null;
  let record: Record<string, unknown> | null = null;
  if (body.decision === "approve" || body.decision === "correct") {
    try {
      record = cleanDraft(body.draft, body.decision === "correct");
    } catch {
      return respond({ error: "A complete, schema-valid, reviewed draft is required" }, 422);
    }
  }

  // A single database RPC locks the candidate and atomically publishes/withdraws,
  // updates its status, fires the public-preview trigger and inserts an audit event.
  const { data, error } = await db.rpc("finalize_intelligence_candidate", {
    p_candidate_id: body.candidate_id, p_decision: body.decision,
    p_actor: user.id, p_record: record, p_notes: notes,
  });
  if (error) {
    console.error("Editorial transaction failed:", error.code, error.message);
    const conflict = /already reviewed|Only published articles|not currently published|Candidate not found/i.test(error.message);
    return respond({ error: conflict ? "Candidate state changed; refresh the review queue." : "Could not complete editorial decision." }, conflict ? 409 : 500);
  }
  return respond(data);
});
