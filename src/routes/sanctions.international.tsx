import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteChrome";
import { RegimeHero, SourceBox } from "@/components/site/RegimeHero";
import { COUNTRIES, INTERNATIONAL } from "@/lib/sanctions-programs";

const TITLE = "International sanctions — national frameworks | Sanctions Signal";
const DESC =
  "Sanctions laws and authorities in France, the Netherlands, Germany, Italy, Czech Republic, Bulgaria, Hungary, Slovakia, Hong Kong, Singapore and China.";

export const Route = createFileRoute("/sanctions/international")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: International,
});

function International() {
  const all = COUNTRIES.flatMap((r) => r.countries);
  return (
    <SiteLayout>
      <RegimeHero
        eyebrow={INTERNATIONAL.label}
        title={INTERNATIONAL.title}
        intro={INTERNATIONAL.intro}
        photo={INTERNATIONAL.photo}
      />
      <div className="border-b bg-secondary/60">
        <div className="mx-auto flex max-w-6xl flex-wrap gap-2 px-6 py-4">
          {all.map((c) => (
            <a key={c.code} href={`#${c.code}`} className="border bg-background px-2.5 py-1 text-xs hover:border-navy">
              <span className="mr-1.5 font-mono text-brand">{c.code}</span>
              {c.name}
            </a>
          ))}
        </div>
      </div>
      <div className="mx-auto max-w-6xl space-y-14 px-6 py-14">
        {COUNTRIES.map((region) => (
          <section key={region.region}>
            <h2 className="border-b-2 border-navy pb-2 text-2xl">{region.region}</h2>
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              {region.countries.map((c) => (
                <article key={c.code} id={c.code} className="scroll-mt-6 border bg-card">
                  <header className="flex items-center justify-between bg-navy px-5 py-3 text-navy-foreground">
                    <h3 className="text-xl">{c.name}</h3>
                    <span className="font-mono text-xs text-navy-accent">{c.code}</span>
                  </header>
                  <div className="space-y-4 p-5 text-sm">
                    <p>{c.approach}</p>
                    <div>
                      <h4 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Legal basis</h4>
                      <ul className="mt-1.5 list-disc space-y-1 pl-4">
                        {c.legalBasis.map((l) => (
                          <li key={l}>{l}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Authorities</h4>
                      <dl className="mt-1.5 space-y-1.5">
                        {c.authorities.map((a) => (
                          <div key={a.name}>
                            <dt className="inline font-medium">{a.name}</dt>
                            <dd className="inline text-muted-foreground"> — {a.role}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                    <div className="border-l-2 border-brand bg-secondary/60 px-3 py-2">
                      <h4 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                        Autonomous / national measures
                      </h4>
                      <p className="mt-1">{c.autonomous}</p>
                    </div>
                    <div className="text-xs">
                      {c.sources.map((s) => (
                        <a key={s.url} href={s.url} target="_blank" rel="noreferrer" className="text-brand hover:underline">
                          {s.label} ↗
                        </a>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
        <div className="max-w-md">
          <SourceBox sources={[{ label: "EU Sanctions Map — national competent authorities", url: "https://www.sanctionsmap.eu/" }]} />
        </div>
      </div>
    </SiteLayout>
  );
}
