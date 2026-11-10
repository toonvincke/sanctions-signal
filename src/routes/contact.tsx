import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteChrome";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Sanctione Compass" },
      { name: "description", content: "Talk to the Sanctione Compass team about enterprise access, trials and partnerships." },
      { property: "og:title", content: "Contact — Sanctione Compass" },
      { property: "og:description", content: "Get in touch about enterprise access and trials." },
    ],
  }),
  component: Contact,
});

const EMAIL = "hello@example.com";

function Contact() {
  return (
    <SiteLayout>
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 md:grid-cols-2">
        <div>
          <h1 className="text-5xl">About & contact</h1>
          <p className="mt-6 text-muted-foreground">
            Sanctione Compass was founded by a sanctions compliance practitioner to give compliance, legal and financial crime
            teams reliable, source-traceable intelligence — without the noise.
          </p>
        </div>
        <div className="border bg-card p-6">
          <h2 className="text-2xl">Get in touch</h2>
          <p className="mt-2 text-sm text-muted-foreground">For enterprise access, trials or partnerships, email us directly:</p>
          <a href={`mailto:${EMAIL}?subject=Sanctione Compass enquiry`} className="mt-6 inline-block bg-primary px-5 py-2.5 text-sm text-primary-foreground hover:bg-primary/90">
            {EMAIL}
          </a>
          <p className="mt-4 text-xs text-muted-foreground">A contact form with ticketing is planned for a later milestone.</p>
        </div>
      </div>
    </SiteLayout>
  );
}
