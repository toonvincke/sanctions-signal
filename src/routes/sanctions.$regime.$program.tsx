import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteChrome";
import { OfficialProgrammeSources } from "@/components/site/OfficialProgrammeSources";
import { LockKeyhole } from "lucide-react";
import { usePremiumAccess } from "@/hooks/use-premium-access";
import { REGIMES, type RegimeSlug } from "@/lib/sanctions-programs";
import { getProgrammeDetail, OFFICIAL_LEGAL_PORTALS } from "@/lib/programme-detail";

export const Route = createFileRoute("/sanctions/$regime/$program")({
  loader: ({ params }): { jurisdiction: RegimeSlug; slug: string } => {
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
  ["official-documents", "Official documents"],
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
  const { jurisdiction, slug } = Route.useLoaderData() as { jurisdiction: RegimeSlug; slug: string };
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
            <section id="official-documents" className="scroll-mt-6">
              <h2 className="mb-4 border-b pb-2 font-serif text-2xl">Official documents</h2>
              <OfficialProgrammeSources jurisdiction={jurisdiction} slug={slug} />
            </section>
            <PremiumProgrammeContent jurisdiction={jurisdiction} slug={slug} />

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

/** Static catalogue scope and jurisdiction remain free, as on the public overview.
 * All newly authored premium records live in a separate RLS-protected table.
 */
function PremiumProgrammeContent({ jurisdiction, slug }: { jurisdiction: string; slug: string }) {
  const { state, sections: premiumSections, isPremium } = usePremiumAccess(jurisdiction, slug);
  return (
    <>
      {!isPremium && (
        <div role="region" aria-label="Premium access" className="border-2 border-brand bg-card p-6 sm:p-8">
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-brand"><LockKeyhole className="h-4 w-4" /> Premium programme research</div>
          <h2 className="mt-4 font-serif text-2xl">Unlock detailed sanctions intelligence</h2>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground">
            Explore structured legal instruments, guidance, licensing information and programme-specific developments as they are published.
          </p>
          {state === "unavailable" && <p role="status" className="mt-3 text-sm text-warning">Subscription verification is temporarily unavailable. Premium content remains protected.</p>}
          {state === "loading" && <p role="status" className="mt-3 text-sm text-muted-foreground">Checking subscription access…</p>}
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Link to="/pricing" className="bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90">View Premium plans</Link>
            {state === "anonymous" && <Link to="/auth" search={{ mode: "signin" }} className="text-sm text-brand underline underline-offset-4">Already subscribed? Sign in</Link>}
          </div>
        </div>
      )}
      {sections.filter(([id]) => id !== "overview" && id !== "official-documents").map(([id, label]) => {
        const entries = isPremium ? premiumSections.filter((entry) => entry.section_key === id) : [];
        return (
          <section key={id} id={id} className="scroll-mt-6">
            <h2 className="mb-4 flex items-center gap-2 border-b pb-2 font-serif text-2xl">
              {label}{!isPremium && <LockKeyhole className="h-4 w-4 text-muted-foreground" aria-label="Premium section" />}
            </h2>
            {!isPremium ? (
              <p className="border border-dashed bg-secondary/40 px-4 py-5 text-sm text-muted-foreground">This section is available with Premium. <Link to="/pricing" className="text-brand underline">See plans</Link>.</p>
            ) : entries.length ? entries.map((entry) => (
              <article key={`${entry.section_key}:${entry.title}`} className="mb-4 border bg-card p-5">
                <h3 className="font-medium">{entry.title}</h3>
                <p className="mt-3 whitespace-pre-line text-sm">{entry.body}</p>
                {entry.source_url && <a href={entry.source_url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm text-brand underline">Original source ↗</a>}
              </article>
            )) : <EmptyState text="No reviewed programme-specific items have been published in this section yet." />}
          </section>
        );
      })}
    </>
  );
}
