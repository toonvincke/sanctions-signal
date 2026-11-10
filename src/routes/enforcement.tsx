import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteChrome";
import { RegimeHero } from "@/components/site/RegimeHero";
import { ENFORCEMENT_AUTHORITIES, PHOTOS, TYPOLOGIES } from "@/lib/sanctions-programs";

const TITLE = "Sanctions enforcement actions & penalties | Sanctions Signal";
const DESC =
  "How OFAC, BIS, DOJ, OFSI, OTSI, HMRC and EU member-state authorities enforce sanctions — and the circumvention typologies behind recent penalties.";

export const Route = createFileRoute("/enforcement")({
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
  component: Enforcement,
});

function Enforcement() {
  return (
    <SiteLayout>
      <RegimeHero
        eyebrow="Enforcement actions"
        title="Who enforces sanctions — and how"
        intro="Settlements, penalty notices, criminal convictions and allegations carry very different legal weight. Sanctions Signal records each enforcement action with its exact legal status, the control failures identified and the circumvention method used."
        photo={PHOTOS.us}
      />
      <div className="mx-auto max-w-6xl space-y-14 px-6 py-14">
        <section>
          <h2 className="border-b-2 border-navy pb-2 text-2xl">Enforcement authorities</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                <th className="py-2 pr-4 font-normal">Jurisdiction</th>
                <th className="py-2 pr-4 font-normal">Authority</th>
                <th className="hidden py-2 pr-4 font-normal md:table-cell">Powers</th>
                <th className="py-2 font-normal">Typical outcomes</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {ENFORCEMENT_AUTHORITIES.map((a) => (
                <tr key={a.authority} className="align-top">
                  <td className="py-3 pr-4 font-mono text-xs text-brand">{a.jurisdiction}</td>
                  <td className="py-3 pr-4 font-medium">{a.authority}</td>
                  <td className="hidden py-3 pr-4 text-muted-foreground md:table-cell">{a.powers}</td>
                  <td className="py-3">{a.outcomes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section className="grid gap-10 md:grid-cols-2">
          <div>
            <h2 className="border-b-2 border-navy pb-2 text-2xl">Recurring circumvention typologies</h2>
            <ul className="mt-4 space-y-2 text-sm">
              {TYPOLOGIES.map((t) => (
                <li key={t} className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 bg-brand" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-navy p-8 text-navy-foreground">
            <h2 className="text-2xl">Every penalty, structured</h2>
            <p className="mt-3 text-sm text-navy-muted">
              Subscribers can filter enforcement actions by authority, regime, penalty amount and legal status — with source
              facts kept separate from compliance lessons.
            </p>
            <Link
              to="/explorer"
              search={{ type: "enforcement_action" }}
              className="mt-6 inline-flex items-center gap-2 bg-navy-foreground px-4 py-2 text-sm font-medium text-navy hover:opacity-90"
            >
              Browse enforcement actions <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>
    </SiteLayout>
  );
}
