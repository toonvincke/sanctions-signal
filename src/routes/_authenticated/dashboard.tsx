import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { recordsQuery, formatDate, formatMoney, CONTENT_TYPE_LABELS, type ContentType } from "@/lib/intel";
import { RecordTable } from "@/components/intel/RecordTable";
import { TypeBadge } from "@/components/intel/badges";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Lexsanction" }, { name: "description", content: "Recent sanctions developments and priority alerts." }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(recordsQuery({})),
  component: Dashboard,
});

function Dashboard() {
  const { data } = useSuspenseQuery(recordsQuery({}));
  const priority = data.filter((r) => r.priority);
  const counts = data.reduce<Record<string, number>>((a, r) => ((a[r.content_type] = (a[r.content_type] ?? 0) + 1), a), {});
  const totalPenalties = data.filter((r) => r.penalty_currency === "USD").reduce((s, r) => s + (r.penalty_amount ?? 0), 0);
  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="text-3xl">Dashboard</h1>
      <p className="text-sm text-muted-foreground">{data.length} records across {Object.keys(counts).length} content types</p>

      <div className="mt-6 grid gap-px border bg-border sm:grid-cols-3 lg:grid-cols-6">
        {(Object.keys(CONTENT_TYPE_LABELS) as ContentType[]).map((t) => (
          <Link key={t} to="/explorer" search={{ type: t }} className="bg-card p-4 hover:bg-muted/50">
            <div className="font-serif text-3xl">{counts[t] ?? 0}</div>
            <div className="text-xs text-muted-foreground">{CONTENT_TYPE_LABELS[t]}</div>
          </Link>
        ))}
      </div>

      <section className="mt-8">
        <h2 className="flex items-center gap-2 text-xl"><AlertTriangle className="h-4 w-4 text-brand" /> Priority alerts</h2>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          {priority.map((r) => (
            <Link key={r.id} to="/records/$slug" params={{ slug: r.slug }} className="block border-l-2 border-brand bg-card p-4 hover:bg-muted/40">
              <div className="flex items-center justify-between gap-2">
                <TypeBadge type={r.content_type} />
                <span className="font-mono text-xs text-muted-foreground">{r.jurisdiction?.code} · {formatDate(r.publication_date)}</span>
              </div>
              <div className="mt-2 font-medium leading-snug">{r.headline}</div>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{r.executive_summary}</p>
              {r.penalty_amount && <div className="mt-2 font-mono text-xs text-brand">{formatMoney(r.penalty_amount, r.penalty_currency)}</div>}
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl">Recent developments</h2>
          <span className="font-mono text-xs text-muted-foreground">USD penalties tracked: {formatMoney(totalPenalties, "USD")}</span>
        </div>
        <div className="mt-3"><RecordTable records={data.slice(0, 8)} /></div>
        <Link to="/explorer" className="mt-3 inline-block text-sm underline-offset-4 hover:underline">Open Intelligence Explorer →</Link>
      </section>
    </div>
  );
}
