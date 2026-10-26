import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteChrome";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Lexsanction" },
      { name: "description", content: "Plans for individual professionals, compliance teams and enterprises." },
      { property: "og:title", content: "Pricing — Lexsanction" },
      { property: "og:description", content: "Professional, Team and Enterprise plans for sanctions intelligence." },
    ],
  }),
  component: Pricing,
});

const plans = [
  { name: "Professional", price: "€149", unit: "per user / month", items: ["Full intelligence database", "Faceted search", "Bookmarks", "Weekly digest (planned)"] },
  { name: "Team", price: "€690", unit: "up to 5 users / month", items: ["Everything in Professional", "Shared folders (planned)", "Custom alerts (planned)", "Priority support"], featured: true },
  { name: "Enterprise", price: "Custom", unit: "annual agreement", items: ["SSO & user provisioning", "API access (planned)", "Dedicated analyst briefings", "Procurement & DPA support"] },
];

function Pricing() {
  return (
    <SiteLayout>
      <div className="mx-auto max-w-6xl px-6 py-16">
        <h1 className="text-5xl">Pricing</h1>
        <p className="mt-4 text-muted-foreground">Indicative pricing. Online checkout is not yet available — start a trial or contact us.</p>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {plans.map((p) => (
            <div key={p.name} className={`border bg-card p-6 ${p.featured ? "border-primary ring-1 ring-primary" : ""}`}>
              <h2 className="text-2xl">{p.name}</h2>
              <div className="mt-4 font-serif text-4xl">{p.price}</div>
              <div className="text-xs text-muted-foreground">{p.unit}</div>
              <ul className="mt-6 space-y-2 text-sm">
                {p.items.map((i) => (
                  <li key={i} className="flex gap-2"><Check className="h-4 w-4 text-success" />{i}</li>
                ))}
              </ul>
              <Link
                to={p.name === "Enterprise" ? "/contact" : "/auth"}
                search={p.name === "Enterprise" ? {} : { mode: "signup" }}
                className="mt-6 block bg-primary py-2 text-center text-sm text-primary-foreground hover:bg-primary/90"
              >
                {p.name === "Enterprise" ? "Contact sales" : "Start trial"}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </SiteLayout>
  );
}
