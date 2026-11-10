import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Candidate = {
  id: string; source_title: string; source_url: string; source_publisher: string | null;
  discovered_at: string; status: string; ai_draft: unknown;
  review_notes: string | null; published_record_id: string | null;
};

export const Route = createFileRoute("/_authenticated/editorial")({
  ssr: false,
  head: () => ({ meta: [{ title: "Editorial review — Sanctions Signal" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: EditorialQueue,
});

function EditorialQueue() {
  const { user } = Route.useRouteContext();
  const [access, setAccess] = useState<"loading" | "admin" | "forbidden">("loading");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [draft, setDraft] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const { data: role, error: roleError } = await supabase.from("user_roles")
      .select("id").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (roleError) throw roleError;
    if (!role) {
      setAccess("forbidden");
      setCandidates([]);
      return;
    }
    setAccess("admin");
    const { data, error: candidatesError } = await supabase.from("intelligence_candidates")
      .select("id,source_title,source_url,source_publisher,discovered_at,status,ai_draft,review_notes,published_record_id")
      .order("discovered_at", { ascending: false }).limit(100);
    if (candidatesError) throw candidatesError;
    setCandidates((data ?? []) as Candidate[]);
  }, [user.id]);

  useEffect(() => {
    void load().catch(() => {
      setError("Could not load the review queue. Access remains restricted.");
      setAccess("forbidden");
    });
  }, [load]);

  const active = candidates.find((item) => item.id === selected);
  function selectCandidate(item: Candidate) {
    setSelected(item.id);
    setDraft(JSON.stringify(item.ai_draft ?? {}, null, 2));
    setNotes(item.review_notes ?? "");
    setError("");
    setMessage("");
  }

  async function decide(decision: "approve" | "reject" | "withdraw" | "correct") {
    if (!active || busy) return;
    if ((decision === "approve" || decision === "correct") &&
        !window.confirm("Confirm that you have checked this analysis against the original official source?")) return;
    if (decision === "withdraw" &&
        !window.confirm("Withdraw this publication immediately? Its public preview will be removed.")) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      let reviewedDraft: unknown = null;
      if (decision === "approve" || decision === "correct") {
        try { reviewedDraft = JSON.parse(draft); }
        catch { throw new Error("The edited draft must be valid JSON."); }
      }
      const { data: session, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session.session?.access_token) throw new Error("Please sign in again.");
      const { data, error: reviewError } = await supabase.functions.invoke("candidate-review", {
        headers: { Authorization: `Bearer ${session.session.access_token}` },
        body: {
          candidate_id: active.id, decision, review_notes: notes,
          ...(reviewedDraft ? { draft: reviewedDraft } : {}),
        },
      });
      if (reviewError) throw reviewError;
      if (!data || data.error) throw new Error(data?.error || "Could not save the decision.");
      setMessage("Decision recorded: " + data.status);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not complete the decision.");
    } finally {
      setBusy(false);
    }
  }

  if (access === "loading") return <div className="p-8" role="status">Checking administrator permissions…</div>;
  if (access === "forbidden") return <div className="p-8" role="alert">Administrator access required. {error}</div>;

  const pending = candidates.filter((item) => item.status === "pending_review");
  const history = candidates.filter((item) => item.status !== "pending_review");

  return <main className="mx-auto max-w-6xl space-y-6 px-6 py-8">
    <header>
      <h1 className="font-serif text-3xl">Editorial review</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        AI drafts stay private until an administrator checks the source and explicitly approves publication.
        Official metadata and editorial interpretation are separate.
      </p>
    </header>
    {error && <p className="border border-destructive p-3 text-sm text-destructive" role="alert">{error}</p>}
    {message && <p className="border p-3 text-sm" role="status">{message}</p>}
    <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
      <section aria-label="Candidate queue" className="space-y-4">
        <h2 className="font-serif text-xl">Pending review ({pending.length})</h2>
        {pending.length === 0 && <p className="border border-dashed p-4 text-sm text-muted-foreground">No pending candidates.</p>}
        <ul className="space-y-2">
          {pending.map((item) => <li key={item.id}>
            <button type="button" onClick={() => selectCandidate(item)}
              className={"w-full border p-3 text-left text-sm hover:border-brand " + (selected === item.id ? "border-brand" : "")}>
              <strong className="block">{item.source_title}</strong>
              <span className="mt-1 block text-xs text-muted-foreground">{item.source_publisher ?? "Publisher unknown"}</span>
              {!item.ai_draft && <span className="block text-xs text-warning">No AI draft available — provide a complete reviewed JSON draft below</span>}
            </button>
          </li>)}
        </ul>
        <h2 className="pt-4 font-serif text-xl">Reviewed and published</h2>
        <ul className="max-h-64 space-y-2 overflow-y-auto">
          {history.map((item) => <li key={item.id}>
            <button type="button" onClick={() => selectCandidate(item)}
              className={"w-full border p-3 text-left text-sm hover:border-brand " + (selected === item.id ? "border-brand" : "")}>
              <span className="font-mono text-xs uppercase text-muted-foreground">{item.status}</span>
              <strong className="block">{item.source_title}</strong>
            </button>
          </li>)}
        </ul>
      </section>
      <section className="min-w-0 border bg-card p-5" aria-label="Review details">
        {!active ? <p className="text-sm text-muted-foreground">Choose an item to review its official source and draft.</p> :
          <>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-serif text-xl">{active.source_title}</h2>
              <span className="font-mono text-xs uppercase">{active.status}</span>
            </div>
            <p className="text-sm">Original source: <a className="break-all text-brand underline"
              href={active.source_url} target="_blank" rel="noopener noreferrer">{active.source_url}</a></p>
            <p className="mt-2 text-xs text-muted-foreground">The source is evidence; any summary or implication below is editorial analysis.</p>
            <label htmlFor="editorial-draft" className="mt-5 block text-sm font-medium">AI draft / corrected analysis (JSON)</label>
            <textarea id="editorial-draft" value={draft} onChange={(e) => setDraft(e.target.value)}
              rows={18} spellCheck={false} className="mt-2 w-full rounded-sm border bg-background p-3 font-mono text-xs"
              aria-describedby="draft-notice" />
            <p id="draft-notice" className="text-xs text-muted-foreground">Verify every factual and legal claim against the original document. JSON must match the draft schema.</p>
            <label htmlFor="editorial-notes" className="mt-4 block text-sm font-medium">Review reason / correction note</label>
            <textarea id="editorial-notes" value={notes} onChange={(e) => setNotes(e.target.value)}
              rows={3} className="mt-2 w-full rounded-sm border bg-background p-3 text-sm" />
            <div className="mt-5 flex flex-wrap gap-3">
              {active.status === "pending_review" && <>
                <button disabled={busy} onClick={() => void decide("approve")}
                  className="bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50">Approve and publish</button>
                <button disabled={busy} onClick={() => void decide("reject")}
                  className="border px-4 py-2 text-sm disabled:opacity-50">Reject</button>
              </>}
              {active.status === "published" && <>
                <button disabled={busy} onClick={() => void decide("correct")}
                  className="bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50">Approve correction</button>
                <button disabled={busy} onClick={() => void decide("withdraw")}
                  className="border border-destructive px-4 py-2 text-sm text-destructive disabled:opacity-50">Withdraw publication</button>
              </>}
            </div>
          </>
        }
      </section>
    </div>
  </main>;
}
