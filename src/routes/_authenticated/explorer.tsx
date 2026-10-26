import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { z } from "zod";
import { X } from "lucide-react";
import { facetsQuery, recordsQuery, CONTENT_TYPE_LABELS, type ContentType } from "@/lib/intel";
import { RecordTable } from "@/components/intel/RecordTable";
import { Input } from "@/components/ui/input";

const types = Object.keys(CONTENT_TYPE_LABELS) as [ContentType, ...ContentType[]];
const searchSchema = z.object({
  q: z.string().optional(),
  type: z.enum(types).optional(),
  jurisdiction: z.string().optional(),
  regime: z.string().optional(),
  authority: z.string().optional(),
  category: z.string().optional(),
});

export const Route = createFileRoute("/_authenticated/explorer")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Intelligence Explorer — Lexsanction" }, { name: "description", content: "Search and filter sanctions intelligence." }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(facetsQuery),
  component: Explorer,
});

type Key = "type" | "jurisdiction" | "regime" | "authority" | "category";

function Explorer() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/explorer" });
  const { data: facets } = useSuspenseQuery(facetsQuery);
  const { data, isFetching, error } = useQuery(recordsQuery(search));
  const [q, setQ] = useState(search.q ?? "");
  useEffect(() => setQ(search.q ?? ""), [search.q]);

  const set = (k: Key | "q", v: string | undefined) =>
    navigate({ search: (prev) => ({ ...prev, [k]: prev[k as keyof typeof prev] === v ? undefined : v || undefined }) });

  const groups: { key: Key; label: string; options: { value: string; label: string }[] }[] = [
    { key: "type", label: "Content type", options: types.map((t) => ({ value: t, label: CONTENT_TYPE_LABELS[t] })) },
    { key: "jurisdiction", label: "Jurisdiction", options: facets.jurisdictions.map((j) => ({ value: j.code, label: j.name })) },
    { key: "regime", label: "Regime", options: facets.regimes.map((r) => ({ value: r.slug, label: r.name })) },
    { key: "authority", label: "Authority", options: facets.authorities.map((a) => ({ value: a.slug, label: a.short_name })) },
    { key: "category", label: "Topic", options: facets.categories.map((c) => ({ value: c.slug, label: c.name })) },
  ];
  const active = groups.flatMap((g) => (search[g.key] ? [{ key: g.key, label: g.options.find((o) => o.value === search[g.key])?.label ?? search[g.key]! }] : []));

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <h1 className="text-3xl">Intelligence Explorer</h1>
      <form
        className="mt-4"
        onSubmit={(e) => {
          e.preventDefault();
          set("q", q.trim());
        }}
      >
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder='Search headlines, summaries, case numbers — e.g. "best efforts" or subsidiaries'
          className="h-11 rounded-none bg-card"
        />
      </form>
      <div className="mt-6 grid gap-8 lg:grid-cols-[220px_1fr]">
        <aside className="space-y-6">
          {groups.map((g) => (
            <div key={g.key}>
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{g.label}</div>
              <ul className="mt-2 space-y-0.5">
                {g.options.map((o) => {
                  const on = search[g.key] === o.value;
                  return (
                    <li key={o.value}>
                      <button
                        onClick={() => set(g.key, o.value)}
                        className={`w-full px-2 py-1 text-left text-sm ${on ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                      >
                        {o.label}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </aside>
        <section>
          <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted-foreground">{isFetching ? "Searching…" : `${data?.length ?? 0} results`}</span>
            {search.q && (
              <button onClick={() => set("q", undefined)} className="inline-flex items-center gap-1 border px-2 py-0.5 text-xs">
                “{search.q}” <X className="h-3 w-3" />
              </button>
            )}
            {active.map((a) => (
              <button key={a.key} onClick={() => set(a.key, undefined)} className="inline-flex items-center gap-1 border px-2 py-0.5 text-xs">
                {a.label} <X className="h-3 w-3" />
              </button>
            ))}
            {(active.length > 0 || search.q) && (
              <button onClick={() => navigate({ search: {} })} className="text-xs underline">Clear all</button>
            )}
          </div>
          {error ? <div className="text-sm text-destructive">Search failed: {(error as Error).message}</div> : <RecordTable records={data ?? []} />}
        </section>
      </div>
    </div>
  );
}
