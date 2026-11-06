import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Check, LockKeyhole } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteChrome";
import { PREMIUM_PRICING, annualSavings } from "@/lib/subscription-plans";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Lexsanction" },
      { name: "description", content: "Explore free sanctions overviews and Premium sanctions intelligence plans from €25 per month." },
      { property: "og:title", content: "Pricing — Lexsanction" },
    ],
  }),
  component: Pricing,
});

const freeFeatures = [
  "EU, US, UK and UN sanctions programme overviews",
  "Programme names, scope and general information",
  "Public news headlines and previews",
  "Links to official public resources",
];
const premiumFeatures = [
  "Everything in Free",
  "Full programme detail pages",
  "Organised legal framework and source documents",
  "Guidance, FAQs, licensing and exemptions",
  "Published case law and enforcement intelligence",
  "Programme-specific updates and detailed analysis",
];
const teamFeatures = [
  "Multiple seats and organisation billing",
  "Central account management (planned)",
  "Team-oriented features as they become available",
];

function Pricing() {
  const [annual, setAnnual] = useState(true);
  return (
    <SiteLayout>
      <div className="mx-auto max-w-6xl px-6 py-16">
        <p className="font-mono text-xs uppercase tracking-widest text-brand">Simple, transparent pricing</p>
        <h1 className="mt-3 max-w-3xl font-serif text-5xl">Stay informed. Stay compliant.</h1>
        <p className="mt-5 max-w-2xl text-muted-foreground">
          Explore sanctions programmes for free. Unlock structured legal resources and in-depth sanctions intelligence with Premium.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium">Billing</span>
          <div role="group" aria-label="Billing period" className="inline-flex border bg-card p-1">
            <button type="button" aria-pressed={!annual} onClick={() => setAnnual(false)} className={`px-4 py-2 text-sm ${annual ? "text-muted-foreground" : "bg-navy text-navy-foreground"}`}>Monthly</button>
            <button type="button" aria-pressed={annual} onClick={() => setAnnual(true)} className={`px-4 py-2 text-sm ${annual ? "bg-navy text-navy-foreground" : "text-muted-foreground"}`}>Yearly</button>
          </div>
          <span className="text-sm font-medium text-success">Save {annualSavings()}% with annual billing</span>
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <section className="flex flex-col border bg-card p-7">
            <h2 className="font-serif text-2xl">Free</h2>
            <p className="mt-2 text-sm text-muted-foreground">Discover the coverage.</p>
            <p className="mt-7 font-serif text-4xl">€0</p>
            <p className="mt-2 text-xs text-muted-foreground">Free forever</p>
            <ul className="my-8 flex-1 space-y-3 text-sm">
              {freeFeatures.map((feature) => <li key={feature} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />{feature}</li>)}
            </ul>
            <Link to="/auth" search={{ mode: "signup" }} className="block border px-4 py-3 text-center text-sm font-medium hover:bg-secondary">Create free account</Link>
          </section>
          <section className="flex flex-col border-2 border-brand bg-card p-7">
            <div className="flex items-center justify-between gap-2"><h2 className="font-serif text-2xl">Premium</h2><span className="bg-brand px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-white">For professionals</span></div>
            <p className="mt-2 text-sm text-muted-foreground">Deeper programme and regulatory intelligence.</p>
            <p className="mt-7 font-serif text-4xl">€{annual ? PREMIUM_PRICING.annualTotal : PREMIUM_PRICING.monthly}<span className="ml-1 font-sans text-sm text-muted-foreground">/{annual ? "year" : "month"}</span></p>
            <p className="mt-2 text-xs text-muted-foreground">{annual ? `Equivalent to €${(PREMIUM_PRICING.annualTotal / 12).toFixed(2).replace(".", ",")}/month, billed yearly` : "Billed monthly"}</p>
            <ul className="my-8 flex-1 space-y-3 text-sm">
              {premiumFeatures.map((feature) => <li key={feature} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />{feature}</li>)}
            </ul>
            <Link to="/contact" className="block bg-primary px-4 py-3 text-center text-sm font-medium text-primary-foreground hover:bg-primary/90">Enquire about Premium</Link>
            <p className="mt-3 flex items-center justify-center gap-1 text-center text-xs text-muted-foreground"><LockKeyhole className="h-3.5 w-3.5" /> Checkout coming soon — no payment is taken.</p>
          </section>
          <section className="flex flex-col border bg-card p-7">
            <h2 className="font-serif text-2xl">Team & Enterprise</h2>
            <p className="mt-2 text-sm text-muted-foreground">For firms and compliance departments.</p>
            <p className="mt-7 font-serif text-3xl">Custom pricing</p>
            <p className="mt-3 text-xs text-muted-foreground">Contact us to discuss your needs</p>
            <ul className="my-8 flex-1 space-y-3 text-sm">
              {teamFeatures.map((feature) => <li key={feature} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />{feature}</li>)}
            </ul>
            <Link to="/contact" className="block border px-4 py-3 text-center text-sm font-medium hover:bg-secondary">Contact sales</Link>
          </section>
        </div>
        <p className="mt-5 text-xs text-muted-foreground">All prices exclude applicable VAT. Premium content and the daily digest are being rolled out; checkout is not yet available. Sanctions Signal provides information, not legal advice or sanctions screening.</p>
        <div className="mt-16 max-w-3xl space-y-5 border-t pt-10">
          <h2 className="font-serif text-3xl">Frequently asked questions</h2>
          <div><h3 className="font-medium">What is free?</h3><p className="mt-1 text-sm text-muted-foreground">Programme overviews, general scope information and public updates remain accessible without payment.</p></div>
          <div><h3 className="font-medium">What does Premium unlock?</h3><p className="mt-1 text-sm text-muted-foreground">Detailed programme resources and approved intelligence as they are published. Direct links to official source material remain independently available at the original authority.</p></div>
          <div><h3 className="font-medium">Can I subscribe today?</h3><p className="mt-1 text-sm text-muted-foreground">Not yet. Subscription checkout and self-service billing will be available after launch testing. Contact us for updates.</p></div>
          <div><h3 className="font-medium">Is this a sanctions screening service?</h3><p className="mt-1 text-sm text-muted-foreground">No. Sanctions Signal is a research and regulatory intelligence platform, not a substitute for legal advice or screening controls.</p></div>
        </div>
      </div>
    </SiteLayout>
  );
}
