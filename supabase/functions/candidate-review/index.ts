import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const contentTypes = ["sanctions_development","case_law","enforcement_action","guidance","legislation","circumvention"];
const legalStatuses = ["final_judgment","interim","ag_opinion","settlement","penalty_notice","conviction","allegation","in_force","announced","not_applicable"];

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.replace(/^Bearer\s+/i, "");
  if (!token || token === auth) return new Response("Unauthorized", { status: 401 });
  const { data: { user }, error: authError } = await db.auth.getUser(token);
  if (authError || !user) return new Response("Unauthorized", { status: 401 });
  // Admin permission comes only from public.user_roles (single source of truth).
  const { data: adminRole, error: roleError } = await db.from("user_roles")
    .select("id").eq("user_id", user.id).eq("role", "admin").maybeSingle();
  if (roleError) return new Response("Could not verify permissions", { status: 500 });
  if (!adminRole) return new Response("Forbidden", { status: 403 });

  const body = await req.json().catch(() => ({}));
  const candidateId = typeof body.candidate_id === "string" ? body.candidate_id : "";
  const decision = body.decision;
  const notes = typeof body.review_notes === "string" ? body.review_notes.slice(0, 4000) : null;
  if (!candidateId || !["approve","reject"].includes(decision)) return Response.json({ error: "candidate_id and decision (approve/reject) are required." }, { status: 400 });

  const { data: candidate, error: candidateError } = await db.from("intelligence_candidates")
    .select("*").eq("id", candidateId).single();
  if (candidateError || !candidate) return Response.json({ error: "Candidate not found." }, { status: 404 });
  if (candidate.status !== "pending_review") return Response.json({ error: "Only pending candidates can be reviewed." }, { status: 409 });

  if (decision === "reject") {
    const { error } = await db.from("intelligence_candidates").update({
      status: "rejected", reviewer_id: user.id, reviewed_at: new Date().toISOString(), review_notes: notes,
    }).eq("id", candidateId);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ status: "rejected" });
  }

  const draft = candidate.ai_draft;
  if (!draft || !contentTypes.includes(draft.content_type) || !legalStatuses.includes(draft.legal_status) ||
      !draft.headline || !draft.executive_summary || !draft.source_facts || !draft.practical_implications) {
    return Response.json({ error: "Candidate has no complete, schema-valid AI draft. Add or correct the draft before approval." }, { status: 422 });
  }

  const slugBase = String(draft.headline).toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 72) || "intelligence-update";
  const slug = `${slugBase}-${crypto.randomUUID().slice(0, 8)}`;
  const record = {
    slug, content_type: draft.content_type, headline: String(draft.headline).slice(0, 300),
    executive_summary: String(draft.executive_summary).slice(0, 5000),
    detailed_analysis: typeof draft.detailed_analysis === "string" ? draft.detailed_analysis : null,
    source_facts: String(draft.source_facts), practical_implications: String(draft.practical_implications),
    source_url: candidate.source_url, source_title: candidate.source_title,
    source_publisher: candidate.source_publisher, publication_date: candidate.published_at?.slice(0,10) ?? new Date().toISOString().slice(0,10),
    legal_status: draft.legal_status, verification_status: "verified",
    affected_entities: Array.isArray(draft.affected_entities) ? draft.affected_entities.slice(0,100) : [],
    affected_sectors: Array.isArray(draft.affected_sectors) ? draft.affected_sectors.slice(0,100) : [],
    legal_provisions: Array.isArray(draft.legal_provisions) ? draft.legal_provisions.slice(0,100) : [],
    tags: Array.isArray(draft.tags) ? draft.tags.slice(0,100) : [],
    priority: Boolean(draft.priority), retrieved_at: new Date().toISOString(),
  };
  const { data: inserted, error: insertError } = await db.from("intelligence_records").insert(record).select("id,slug").single();
  if (insertError || !inserted) return Response.json({ error: insertError?.message ?? "Could not publish record." }, { status: 500 });

  const { error: candidateUpdateError } = await db.from("intelligence_candidates").update({
    status: "published", reviewer_id: user.id, reviewed_at: new Date().toISOString(),
    review_notes: notes, published_record_id: inserted.id,
  }).eq("id", candidateId);
  if (candidateUpdateError) {
    // Keep the created record traceable; flag the candidate so an administrator can reconcile it.
    return Response.json({ error: "Record was created but candidate status could not be updated.", record: inserted }, { status: 500 });
  }
  return Response.json({ status: "published", record: inserted });
});
