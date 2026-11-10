import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Scale, Landmark, Building2, Briefcase } from "lucide-react";
import { SiteLayout, PhotoCredit } from "@/components/site/SiteChrome";
import { PHOTOS } from "@/lib/sanctions-programs";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sanctione Compass — Sanctions intelligence for compliance teams" },
      {
        name: "description",
        content:
          "Searchable, source-linked intelligence on sanctions developments, case law, enforcement actions and regulatory guidance across the EU, UK and US.",
      },
      { property: "og:title", content: "Sanctione Compass — Sanctions intelligence for compliance teams" },
      {
        property: "og:description",
        content: "Source-linked sanctions intelligence: developments, judgments, enforcement and guidance.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const ticker = [
  ["EU", "Reg. (EU) 2025/395", "16th Russia package — shadow fleet vessel listings"],
  ["US", "OFAC Enf. 2024-06-12", "GVA Capital — $215,988,868 penalty notice"],
  ["UK", "[2025] UKSC 30", "Shvidler — designation appeal dismissed"],
  ["EU", "C-351/22", "Neves 77 — CJEU jurisdiction over CFSP penalties"],
];

const personas = [
  { icon: Landmark, title: "Banks & financial institutions", body: "Track correspondent risk, secondary sanctions exposure and new transaction bans before they hit operations." },
  { icon: Scale, title: "Legal & regulatory teams", body: "Read judgments and legislation with structured holdings, provisions and links to the official text." },
  { icon: Building2, title: "Corporate compliance", body: "Understand export restrictions, best-efforts duties and circumvention red flags relevant to your supply chain." },
  { icon: Briefcase, title: "Consultancies & law firms", body: "Brief clients faster with original summaries that separate source facts from compliance analysis." },
];

const regimeCards = [
  { regime: "un", label: "UN sanctions", sub: "Security Council regimes", photo: PHOTOS.un },
  { regime: "eu", label: "EU sanctions", sub: "Restrictive measures", photo: PHOTOS.eu },
  { regime: "uk", label: "UK sanctions", sub: "SAMLA 2018 regimes", photo: PHOTOS.uk },
  { regime: "us", label: "US sanctions", sub: "OFAC programmes", photo: PHOTOS.us },
] as const;

function Landing() {
  return (
    <SiteLayout>
      <section className="relative isolate overflow-hidden bg-navy text-navy-foreground">
        <img
          src={PHOTOS.hero.url}
          alt={PHOTOS.hero.alt}
          className="absolute inset-0 -z-20 h-full w-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-navy via-navy/90 to-navy/50" />
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-[1.3fr_1fr]">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-navy-accent">Sanctions · Enforcement · Case law</p>
            <h1 className="mt-4 text-5xl font-medium leading-[1.05] md:text-6xl">
              Scattered regulatory signals, turned into intelligence you can cite.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-navy-muted">
              Sanctione Compass monitors UN, EU, UK, US and national authorities and courts, and delivers concise, original
              analysis — every record traceable to its primary source, with facts and implications kept strictly apart.
            </p>
            <div className="mt-8 flex gap-3">
              <Link
                to="/auth"
                search={{ mode: "signup" }}
                className="inline-flex items-center gap-2 bg-navy-foreground px-5 py-2.5 text-sm font-medium text-navy hover:opacity-90"
              >
                Start free trial <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/features" className="border border-navy-border px-5 py-2.5 text-sm font-medium hover:bg-navy-deep">
                See the platform
              </Link>
            </div>
          </div>
          <div className="self-center border border-navy-border bg-card text-card-foreground">
            <div className="border-b px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Latest in the database
            </div>
            <ul className="divide-y">
              {ticker.map(([j, ref, title]) => (
                <li key={ref} className="grid grid-cols-[2.5rem_1fr] gap-3 px-4 py-3">
                  <span className="font-mono text-xs font-medium text-brand">{j}</span>
                  <div>
                    <div className="font-mono text-[11px] text-muted-foreground">{ref}</div>
                    <div className="text-sm">{title}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="mx-auto max-w-6xl px-6 pb-3 text-[11px] text-navy-muted/80">
          <PhotoCredit credit={PHOTOS.hero.credit} url={PHOTOS.hero.creditUrl} />
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="flex items-baseline justify-between border-b-2 border-navy pb-2">
          <h2 className="text-3xl">Sanctions programmes by authority</h2>
          <Link to="/sanctions/international" className="text-sm text-brand hover:underline">
            National frameworks →
          </Link>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {regimeCards.map((c) => (
            <Link
              key={c.regime}
              to="/sanctions/$regime"
              params={{ regime: c.regime }}
              className="group relative isolate block aspect-[4/5] overflow-hidden bg-navy text-navy-foreground"
            >
              <img
                src={c.photo.url}
                alt={c.photo.alt}
                loading="lazy"
                className="absolute inset-0 -z-20 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 -z-10 bg-gradient-to-t from-navy via-navy/50 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <div className="font-mono text-[10px] uppercase tracking-widest text-navy-accent">{c.sub}</div>
                <div className="mt-1 font-serif text-2xl">{c.label}</div>
              </div>
            </Link>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">
          Photos:{" "}
          {regimeCards.map((c, i) => (
            <span key={c.regime}>
              {i > 0 && " · "}
              <a href={c.photo.creditUrl} target="_blank" rel="noreferrer" className="hover:underline">
                {c.photo.credit}
              </a>
            </span>
          ))}
        </p>
      </section>

      <section className="bg-navy text-navy-foreground">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-3xl">Built for the people who sign off</h2>
          <div className="mt-8 grid gap-px border border-navy-border bg-navy-border md:grid-cols-4">
            {personas.map((p) => (
              <div key={p.title} className="bg-navy p-6">
                <p.icon className="h-5 w-5 text-navy-accent" />
                <h3 className="mt-4 text-lg">{p.title}</h3>
                <p className="mt-2 text-sm text-navy-muted">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b bg-secondary/50">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-3">
          {[
            ["Source first", "Each record links to EUR-Lex, CURIA, OFAC, OFSI or the relevant court. Verification status is always shown."],
            ["Facts vs. analysis", "What the authority said is presented separately from what it means for your organisation."],
            ["Legal status explicit", "Settlements, penalty notices, allegations, judgments and AG opinions are never conflated."],
          ].map(([t, b]) => (
            <div key={t}>
              <h3 className="text-xl">{t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{b}</p>
            </div>
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}
