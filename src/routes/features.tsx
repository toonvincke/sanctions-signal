import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteChrome";

export const Route = createFileRoute("/features")({
  head: () => ({
    meta: [
      { title: "Features — Lexsanction" },
      { name: "description", content: "Intelligence Explorer, faceted search, structured enforcement and case-law records, and bookmarks." },
      { property: "og:title", content: "Features — Lexsanction" },
      { property: "og:description", content: "What the Lexsanction sanctions intelligence platform does today and what is coming next." },
    ],
  }),
  component: Features,
});

const live = [
  ["Intelligence Explorer", "Full-text search with facets for content type, jurisdiction, regime, authority and topic."],
  ["Structured records", "Dates (publication, event, effective), provisions, case numbers, penalty amounts, circumvention methods and control failures."],
  ["Sanctions developments", "EU packages, OFAC actions and UK measures with announcement and effective dates kept separate."],
  ["Case law", "CJEU, General Court and UK judgments with document type (final, interim, AG opinion) shown explicitly."],
  ["Enforcement & penalties", "OFAC, OFSI and BIS actions, distinguishing settlements, penalty notices and allegations."],
  ["Bookmarks", "Save records to a personal reading list for later review."],
];
const next = ["Custom alerts and email digests", "Team workspaces and shared folders", "Automated ingestion from official feeds", "Source-cited AI research assistant", "Regime comparison (EU / UK / US)"];

function Features() {
  return (
    <SiteLayout>
      <div className="mx-auto max-w-6xl px-6 py-16">
        <h1 className="text-5xl">Features</h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">Available now in the portal:</p>
        <div className="mt-10 grid gap-px border bg-border md:grid-cols-2">
          {live.map(([t, b]) => (
            <div key={t} className="bg-background p-6">
              <h2 className="text-xl">{t}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{b}</p>
            </div>
          ))}
        </div>
        <h2 className="mt-16 text-2xl">On the roadmap</h2>
        <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
          {next.map((n) => (
            <li key={n} className="flex gap-3">
              <span className="font-mono text-[10px] uppercase tracking-widest text-warning">Planned</span>
              {n}
            </li>
          ))}
        </ul>
      </div>
    </SiteLayout>
  );
}
