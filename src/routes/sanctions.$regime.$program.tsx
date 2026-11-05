import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteChrome";
import { REGIMES } from "@/lib/sanctions-programs";
import { getProgrammeDetail, OFFICIAL_LEGAL_PORTALS } from "@/lib/programme-detail";

export const Route = createFileRoute("/sanctions/$regime/$program")({
  loader: ({ params }) => {
    const detail = getProgrammeDetail(params.regime, params.program);
    if (!detail) throw notFound();
    return { jurisdiction: detail.jurisdiction, slug: detail.slug };
  },
  head: ({ loaderData }) => {
    const detail = loaderData && getProgrammeDetail(loaderData.jurisdiction, loaderData.slug);
    if (!detail) return { meta: [{ title: "Programme not found | Lexsanction" }] };
    const title = `${detail.programme.name} — ${REGIMES[detail.jurisdiction].label} | Lexsanction`;
    const description = `Overview of ${detail.programme.name}: measures, legal framework and official sources.`;
    return { meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "article" },
    ] };
  },
  notFoundComponent: () => (
    <SiteLayout><main className="mx-auto max-w-6xl px-6 py-20">
      <h1 className="text-3xl">Sanctions programme not found</h1>
      <Link to="/" className="mt-4 inline-block text-brand underline">Back to home</Link>
    </main></SiteLayout>
  ),
  component: ProgrammePage,
});

const sections = [
  ["overview", "Overview"],
  ["legal-framework", "Legal framework"],
  ["restrictions", "Restrictions"],
  ["guidance", "Guidance / FAQs"],
  ["licensing", "Licensing / Exemptions"],
  ["updates", "Latest Updates"],
] as const;

function EmptyState({ text }: { text: string }) {
  return <p className="rounded-sm border border-dashed bg-secondary/40 px-4 py-5 text-sm text-muted-foreground">{text}</p>;
}

function ProgrammePage() {
  const { jurisdiction, slug } = Route.useLoaderData();
  const detail = getProgrammeDetail(jurisdiction, slug);
  if (!detail) return null;
  const { programme, group } = detail;
  const regime = REGIMES[jurisdiction];
  const portal = OFFICIAL_LEGAL_PORTALS[jurisdiction];
  return (
    <SiteLayout>
      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-6 sm:py-14">
        <nav aria-label="Breadcrumb" className="mb-7 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-brand">Home</Link><span aria-hidden="true">/</span>
          <Link to="/sanctions/$regime" params={{ regime: jurisdiction }} className="hover:text-brand">{regime.label}</Link>
          <span aria-hidden="true">/</span><span className="text-foreground">{programme.name}</span>
        </nav>
        <div className="border-b-2 border-navy pb-8">
          <p className="mb-3 font-mono text-xs uppercase tracking-widest text-brand">{regime.label} · {group}</p>
          <h1 className="max-w-4xl font-serif text-4xl leading-tight text-foreground sm:text-5xl">{programme.name}</h1>
          <p className="mt-5 max-w-3xl text-base text-muted-foreground">{programme.scope}</p>
          {programme.note && <p className="mt-3 text-sm text-warning">{programme.note}</p>}
          <Link to="/sanctions/$regime" params={{ regime: jurisdiction }} className="mt-6 inline-block text-sm font-medium text-brand underline underline-offset-4">
            ← All {regime.label.toLowerCase()} programmes
          </Link>
        </div>
        <div className="mt-9 grid gap-10 lg:grid-cols-[minmax(0,1fr)_17rem]">
          <div className="min-w-0 space-y-10">
            <nav aria-label="Page sections" className="flex flex-wrap gap-2">
              {sections.map(([id, label]) => <a key={id} href={`#${id}`} className="border px-3 py-2 text-xs hover:border-brand hover:text-brand">{label}</a>)}
            </nav>
            <section id="overview" className="scroll-mt-6">
              <h2 className="mb-4 border-b pb-2 font-serif text-2xl">Overview</h2>
              <dl className="grid gap-4 text-sm sm:grid-cols-2">
                <div><dt className="text-muted-foreground">Jurisdiction</dt><dd className="mt-1 font-medium">{regime.label}</dd></div>
                <div><dt className="text-muted-foreground">Programme category</dt><dd className="mt-1 font-medium">{group}</dd></div>
                <div className="sm:col-span-2"><dt className="text-muted-foreground">Responsible authority / authorities</dt>
                  <dd className="mt-1">{regime.authorities.map((a) => a.name).join(" · ")}</dd>
                </div>
              </dl>
              <p className="mt-4 text-sm text-muted-foreground">This is a concise overview of information currently recorded in the programme catalogue, not a complete legal assessment.</p>
            </section>
            <section id="legal-framework" className="scroll-mt-6">
              <h2 className="mb-4 border-b pb-2 font-serif text-2xl">Legal framework</h2>
              {programme.basis ? <p className="text-sm"><span className="font-medium">Referenced legal basis:</span> {programme.basis}</p> :
                <EmptyState text="No programme-specific legal instrument is recorded yet." />}
              <p className="mt-3 text-xs text-muted-foreground">The legal reference is catalogue information and has not been independently checked for completeness or current amendments.</p>
              <a href={portal.url} rel="noopener noreferrer" target="_blank" className="mt-3 inline-block text-sm text-brand underline underline-offset-4">{portal.label} ↗</a>
            </section>
            <section id="restrictions" className="scroll-mt-6">
              <h2 className="mb-4 border-b pb-2 font-serif text-2xl">Restrictions</h2>
              {programme.scope ? <p className="text-sm">{programme.scope}</p> :
                <EmptyState text="No measures have been recorded yet." />}
              <p className="mt-3 text-xs text-muted-foreground">Summary only. Check the operative legal text, exceptions and amendments before relying on these measures.</p>
            </section>
            <section id="guidance" className="scroll-mt-6">
              <h2 className="mb-4 border-b pb-2 font-serif text-2xl">Guidance / FAQs</h2>
              <EmptyState text="No programme-specific guidance or FAQ has been verified and linked yet. Consult the official authority resources below." />
            </section>
            <section id="licensing" className="scroll-mt-6">
              <h2 className="mb-4 border-b pb-2 font-serif text-2xl">Licensing / Exemptions</h2>
              <EmptyState text="Programme-specific licences, derogations and exemptions have not yet been documented here. Consult the applicable legislation and competent authority." />
            </section>
            <section id="updates" className="scroll-mt-6">
              <h2 className="mb-4 border-b pb-2 font-serif text-2xl">Latest Updates</h2>
              <EmptyState text="No verified programme-specific updates have been linked yet." />
            </section>
          </div>
          <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
            <div className="border bg-card p-5">
              <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Source verification</h2>
              <p className="mt-3 text-sm font-medium">Not yet verified at programme level</p>
              <p className="mt-1 text-xs text-muted-foreground">Last checked: not recorded. The publication date is not a source-verification date.</p>
            </div>
            <div className="border bg-card p-5">
              <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Official reference sources</h2>
              <p className="my-3 text-xs text-muted-foreground">Jurisdiction-level official entry points; not direct citations establishing every measure above.</p>
              <ul className="space-y-3 text-sm">
                <li><a href={portal.url} target="_blank" rel="noopener noreferrer" className="text-brand underline underline-offset-4">{portal.label} ↗</a></li>
                {regime.sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer" className="text-brand underline underline-offset-4">{source.label} ↗</a></li>)}
              </ul>
            </div>
          </aside>
        </div>
      </main>
    </SiteLayout>
  );
}
