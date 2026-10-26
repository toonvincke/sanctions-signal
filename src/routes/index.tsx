import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Scale, Landmark, Building2, Briefcase } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteChrome";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lexsanction — Sanctions intelligence for compliance teams" },
      {
        name: "description",
        content:
          "Searchable, source-linked intelligence on sanctions developments, case law, enforcement actions and regulatory guidance across the EU, UK and US.",
      },
      { property: "og:title", content: "Lexsanction — Sanctions intelligence for compliance teams" },
      {
        property: "og:description",
        content: "Source-linked sanctions intelligence: developments, judgments, enforcement and guidance.",
      },
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

function Landing() {
  return (
    <SiteLayout>
      <section className="border-b">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-[1.3fr_1fr]">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-brand">Sanctions · Enforcement · Case law</p>
            <h1 className="mt-4 text-5xl font-medium leading-[1.05] md:text-6xl">
              Scattered regulatory signals, turned into intelligence you can cite.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              Lexsanction monitors EU, UK and US authorities and courts, and delivers concise, original analysis — every
              record traceable to its primary source, with facts and implications kept strictly apart.
            </p>
            <div className="mt-8 flex gap-3">
              <Link
                to="/auth"
                search={{ mode: "signup" }}
                className="inline-flex items-center gap-2 bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Start free trial <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/features" className="border px-5 py-2.5 text-sm font-medium hover:bg-secondary">
                See the platform
              </Link>
            </div>
          </div>
          <div className="border bg-card">
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
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-3xl">Built for the people who sign off</h2>
        <div className="mt-8 grid gap-px border bg-border md:grid-cols-4">
          {personas.map((p) => (
            <div key={p.title} className="bg-background p-6">
              <p.icon className="h-5 w-5 text-brand" />
              <h3 className="mt-4 text-lg">{p.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y bg-secondary/50">
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
