import type { ReactNode } from "react";
import type { Photo } from "@/lib/sanctions-programs";
import { PhotoCredit } from "./SiteChrome";

export function RegimeHero({ eyebrow, title, intro, photo }: { eyebrow: string; title: string; intro: string; photo: Photo }) {
  return (
    <section className="relative isolate overflow-hidden bg-navy text-navy-foreground">
      <img src={photo.url} alt={photo.alt} className="absolute inset-0 -z-20 h-full w-full object-cover" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-navy via-navy/90 to-navy/40" />
      <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
        <p className="font-mono text-xs uppercase tracking-widest text-navy-accent">{eyebrow}</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-medium md:text-5xl">{title}</h1>
        <p className="mt-5 max-w-2xl text-navy-muted">{intro}</p>
        <p className="mt-10 text-[11px] text-navy-muted/80">
          <PhotoCredit credit={photo.credit} url={photo.creditUrl} />
        </p>
      </div>
    </section>
  );
}

export function SourceBox({ sources, children }: { sources: { label: string; url: string }[]; children?: ReactNode }) {
  return (
    <aside className="border bg-card p-5">
      <h2 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Official sources</h2>
      <ul className="mt-3 space-y-2 text-sm">
        {sources.map((s) => (
          <li key={s.url}>
            <a href={s.url} target="_blank" rel="noreferrer" className="text-brand underline-offset-2 hover:underline">
              {s.label} ↗
            </a>
          </li>
        ))}
      </ul>
      {children}
      <p className="mt-4 border-t pt-3 text-xs text-muted-foreground">
        Programme lists change frequently. Always confirm current scope against the official source.
      </p>
    </aside>
  );
}
