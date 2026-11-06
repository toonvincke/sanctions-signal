import { createFileRoute, getRouteApi, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteChrome";
import { RegimeHero, SourceBox } from "@/components/site/RegimeHero";
import { REGIMES } from "@/lib/sanctions-programs";
import { programmeSlug } from "@/lib/programme-detail";

const regimeRoute = getRouteApi("/sanctions/$regime");

export const Route = createFileRoute("/sanctions/$regime/")({
  head: ({ params }) => {
    const r = (REGIMES as Record<string, (typeof REGIMES)[keyof typeof REGIMES]>)[params.regime];
    if (!r) return { meta: [{ title: "Sanctions programmes — Lexsanction" }] };
    const title = `${r.label} — programme overview | Lexsanction`;
    const description = `Overview of ${r.title.toLowerCase()}: legal basis, scope and responsible authorities, with links to the official lists.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: RegimePage,
});

function RegimePage() {
  const { slug } = regimeRoute.useLoaderData();
  const r = REGIMES[slug];
  const count = r.groups.reduce((n, g) => n + g.programs.length, 0);
  return (
    <SiteLayout>
      <RegimeHero eyebrow={r.label} title={r.title} intro={r.intro} photo={r.photo} />
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-12">
          {r.groups.map((g) => (
            <section key={g.heading}>
              <div className="flex items-baseline justify-between border-b-2 border-navy pb-2">
                <h2 className="text-2xl">{g.heading}</h2>
                <span className="font-mono text-[11px] text-muted-foreground">{g.programs.length} programmes</span>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    <th className="py-2 pr-4 font-normal">Programme</th>
                    <th className="hidden py-2 pr-4 font-normal md:table-cell">Legal basis</th>
                    <th className="py-2 font-normal">Measures</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {g.programs.map((p) => (
                    <tr key={p.name} className="align-top">
                      <td className="py-3 pr-4 font-medium">
                        <Link
                          to="/sanctions/$regime/$program"
                          params={{ regime: slug, program: programmeSlug(p.name) }}
                          className="text-brand underline-offset-4 hover:underline focus-visible:underline"
                        >
                          {p.name}
                        </Link>
                        <div className="mt-1 font-mono text-[11px] font-normal text-muted-foreground md:hidden">{p.basis}</div>
                      </td>
                      <td className="hidden py-3 pr-4 font-mono text-[12px] text-muted-foreground md:table-cell">{p.basis ?? "—"}</td>
                      <td className="py-3">
                        {p.scope}
                        {p.note && <div className="mt-1 text-xs text-warning">{p.note}</div>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ))}
        </div>
        <div className="space-y-6">
          <div className="bg-navy p-5 text-navy-foreground">
            <div className="font-mono text-[10px] uppercase tracking-widest text-navy-muted">Programmes listed</div>
            <div className="mt-1 font-serif text-4xl">{count}</div>
          </div>
          <div className="border bg-card p-5">
            <h2 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Who does what</h2>
            <dl className="mt-3 space-y-3 text-sm">
              {r.authorities.map((a) => (
                <div key={a.name}>
                  <dt className="font-medium">{a.name}</dt>
                  <dd className="text-muted-foreground">{a.role}</dd>
                </div>
              ))}
            </dl>
          </div>
          <SourceBox sources={r.sources} />
        </div>
      </div>
    </SiteLayout>
  );
}
