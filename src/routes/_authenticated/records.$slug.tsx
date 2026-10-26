import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Bookmark, BookmarkCheck, ExternalLink, Flag } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { bookmarksQuery, formatDate, formatMoney, LEGAL_STATUS_LABELS, recordQuery } from "@/lib/intel";
import { TypeBadge, VerificationBadge } from "@/components/intel/badges";

export const Route = createFileRoute("/_authenticated/records/$slug")({
  loader: async ({ context, params }) => {
    const [rec] = await Promise.all([
      context.queryClient.ensureQueryData(recordQuery(params.slug)),
      context.queryClient.ensureQueryData(bookmarksQuery),
    ]);
    if (!rec) throw notFound();
    return { headline: rec.headline };
  },
  head: ({ loaderData }) => ({ meta: [{ title: `${loaderData?.headline ?? "Record"} — Lexsanction` }] }),
  notFoundComponent: () => (
    <div className="p-10 text-center">
      Record not found. <Link to="/explorer" className="underline">Back to Explorer</Link>
    </div>
  ),
  component: RecordPage,
});

function List({ items }: { items: string[] }) {
  if (!items?.length) return <span className="text-muted-foreground">—</span>;
  return (
    <ul className="space-y-0.5">
      {items.map((i) => <li key={i}>{i}</li>)}
    </ul>
  );
}

function RecordPage() {
  const { slug } = Route.useParams();
  const { user } = Route.useRouteContext();
  const { data: r } = useSuspenseQuery(recordQuery(slug));
  const { data: bms } = useSuspenseQuery(bookmarksQuery);
  const qc = useQueryClient();
  const rec = r!;
  const saved = bms.find((b) => b.record_id === rec.id);

  const toggle = useMutation({
    mutationFn: async () => {
      if (saved) {
        const { error } = await supabase.from("bookmarks").delete().eq("id", saved.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("bookmarks").insert({ record_id: rec.id, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookmarks"] });
      toast.success(saved ? "Removed from bookmarks" : "Saved to bookmarks");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const meta: [string, React.ReactNode][] = [
    ["Jurisdiction", rec.jurisdiction?.name],
    ["Regime", rec.regime?.name],
    ["Authority", rec.authority?.name],
    ["Legal status", LEGAL_STATUS_LABELS[rec.legal_status]],
    ["Published", formatDate(rec.publication_date)],
    ["Event date", formatDate(rec.event_date)],
    ["Effective date", formatDate(rec.effective_date)],
    ["Reference", rec.case_number ? <span className="font-mono text-xs">{rec.case_number}</span> : "—"],
  ];
  if (rec.penalty_amount) meta.push(["Amount", <span className="font-mono text-brand">{formatMoney(rec.penalty_amount, rec.penalty_currency)}</span>]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <Link to="/explorer" className="text-xs text-muted-foreground hover:underline">← Intelligence Explorer</Link>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <TypeBadge type={rec.content_type} />
        {rec.priority && <span className="inline-flex items-center gap-1 text-xs text-brand"><Flag className="h-3 w-3" /> Priority</span>}
        <VerificationBadge status={rec.verification_status} />
      </div>
      <h1 className="mt-3 max-w-4xl text-4xl leading-tight">{rec.headline}</h1>
      {rec.source_title && <p className="mt-2 max-w-4xl text-sm italic text-muted-foreground">Source: {rec.source_title}</p>}
      <div className="mt-4 flex flex-wrap gap-3">
        <a href={rec.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90">
          View primary source <ExternalLink className="h-3.5 w-3.5" />
        </a>
        <button onClick={() => toggle.mutate()} disabled={toggle.isPending} className="inline-flex items-center gap-2 border px-4 py-2 text-sm hover:bg-secondary">
          {saved ? <BookmarkCheck className="h-4 w-4 text-brand" /> : <Bookmark className="h-4 w-4" />} {saved ? "Saved" : "Bookmark"}
        </button>
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_300px]">
        <article className="space-y-8">
          <section>
            <h2 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Executive summary</h2>
            <p className="mt-2 font-serif text-xl leading-relaxed">{rec.executive_summary}</p>
          </section>
          <section className="border-l-2 border-primary bg-card p-5">
            <h2 className="font-mono text-[10px] uppercase tracking-widest text-primary">Source facts — as stated by the authority or court</h2>
            <p className="mt-2 leading-relaxed">{rec.source_facts}</p>
          </section>
          {rec.detailed_analysis && (
            <section>
              <h2 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Context & analysis</h2>
              <p className="mt-2 leading-relaxed">{rec.detailed_analysis}</p>
            </section>
          )}
          {rec.practical_implications && (
            <section className="border-l-2 border-warning bg-accent/50 p-5">
              <h2 className="font-mono text-[10px] uppercase tracking-widest text-warning">Compliance implications — editorial analysis, not legal advice</h2>
              <p className="mt-2 leading-relaxed">{rec.practical_implications.replace(/^ANALYSIS\s+—\s+/, "")}</p>
            </section>
          )}
          {(rec.circumvention_methods.length > 0 || rec.control_failures.length > 0 || rec.violation) && (
            <section className="grid gap-6 md:grid-cols-3">
              {rec.violation && <div><h3 className="text-sm font-semibold">Conduct</h3><p className="mt-1 text-sm">{rec.violation}</p></div>}
              {rec.circumvention_methods.length > 0 && <div><h3 className="text-sm font-semibold">Circumvention methods</h3><div className="mt-1 text-sm"><List items={rec.circumvention_methods} /></div></div>}
              {rec.control_failures.length > 0 && <div><h3 className="text-sm font-semibold">Control failures</h3><div className="mt-1 text-sm"><List items={rec.control_failures} /></div></div>}
            </section>
          )}
        </article>
        <aside className="space-y-6 text-sm">
          <dl className="divide-y border bg-card">
            {meta.map(([k, v]) => (
              <div key={k} className="grid grid-cols-[110px_1fr] gap-2 px-3 py-2">
                <dt className="text-xs text-muted-foreground">{k}</dt>
                <dd>{v || "—"}</dd>
              </div>
            ))}
          </dl>
          <div><h3 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Legal provisions</h3><div className="mt-1"><List items={rec.legal_provisions} /></div></div>
          <div><h3 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Affected entities</h3><div className="mt-1"><List items={rec.affected_entities} /></div></div>
          <div><h3 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Sectors</h3><div className="mt-1"><List items={rec.affected_sectors} /></div></div>
          <div className="flex flex-wrap gap-1">
            {rec.record_categories.map((rc) => rc.category && (
              <Link key={rc.category.slug} to="/explorer" search={{ category: rc.category.slug }} className="border px-2 py-0.5 text-xs hover:bg-muted">{rc.category.name}</Link>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Source publisher: {rec.source_publisher ?? "—"} · Last updated {formatDate(rec.updated_at.slice(0, 10))}
          </p>
        </aside>
      </div>
    </div>
  );
}
