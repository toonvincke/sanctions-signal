import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { OFFICIAL_LEGAL_PORTALS } from "@/lib/programme-detail";
import type { RegimeSlug } from "@/lib/sanctions-programs";

type PublicDocument = {
  canonical_url: string;
  title: string;
  issuing_authority: string | null;
  publication_date: string | null;
  document_type: string;
  link_check_status?: string | null;
  last_checked_at?: string | null;
};
type ProgrammeSource = {
  mapping: string;
  url: string | null;
  label: string | null;
  provenance: string | null;
  lastChecked: string | null;
};
const initial: ProgrammeSource = {
  mapping: "needs_mapping", url: null, label: null, provenance: null, lastChecked: null,
};

export function OfficialProgrammeSources({ jurisdiction, slug }: { jurisdiction: string; slug: string }) {
  const [items, setItems] = useState<PublicDocument[]>([]);
  const [coverage, setCoverage] = useState<ProgrammeSource>(initial);
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable">("loading");

  useEffect(() => {
    let active = true;
    setItems([]);
    setCoverage(initial);
    setStatus("loading");

    async function load() {
      const { data: programme, error: pError } = await supabase.from("sanctions_programmes" as never)
        .select("id,source_mapping_status,source_last_checked_at,official_programme_url,official_programme_label,official_programme_source")
        .eq("jurisdiction", jurisdiction).eq("slug", slug).maybeSingle();
      if (pError) throw pError;
      if (!programme) return [];
      const row = programme as {
        id: string; source_mapping_status?: string; source_last_checked_at?: string | null;
        official_programme_url?: string | null; official_programme_label?: string | null;
        official_programme_source?: string | null;
      };
      if (active) setCoverage({
        mapping: row.source_mapping_status ?? "needs_mapping",
        url: row.official_programme_url ?? null,
        label: row.official_programme_label ?? null,
        provenance: row.official_programme_source ?? null,
        lastChecked: row.source_last_checked_at ?? null,
      });
      const { data, error } = await supabase.from("programme_documents" as never)
        .select("document:official_documents(canonical_url,title,issuing_authority,publication_date,document_type,link_check_status,last_checked_at)")
        .eq("programme_id", row.id);
      if (error) throw error;
      return (data ?? []).flatMap((entry) => {
        const doc = (entry as unknown as { document: PublicDocument | null }).document;
        return doc ? [doc] : [];
      });
    }

    void load().then((docs) => {
      if (active) { setItems(docs); setStatus("ready"); }
    }).catch(() => { if (active) setStatus("unavailable"); });
    return () => { active = false; };
  }, [jurisdiction, slug]);

  if (status === "loading") return <p role="status" className="text-sm text-muted-foreground">Loading official sources…</p>;
  if (status === "unavailable") return <p role="status" className="text-sm text-muted-foreground">Official source references are temporarily unavailable. No unverified content is displayed.</p>;

  const mapped = coverage.mapping === "mapped" && !!coverage.url;
  const proposed = coverage.mapping === "review_required" && !!coverage.url;
  const portal = OFFICIAL_LEGAL_PORTALS[jurisdiction as RegimeSlug];
  return <div className="space-y-5">
    <p className="text-xs text-muted-foreground">Source references only. The authority's original page governs. Links are not legal conclusions, and publication dates are not link-verification dates.</p>
    {mapped ? <div className="border bg-card p-4">
      <p className="mb-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">Official programme entry point</p>
      <a href={coverage.url!} target="_blank" rel="noopener noreferrer"
        className="break-words font-medium text-brand underline underline-offset-4">{coverage.label}</a>
      <p className="mt-2 text-xs text-muted-foreground">
        Source mapping: {coverage.provenance?.replaceAll("_", " ")}
        {coverage.lastChecked ? " · Link last checked " + new Date(coverage.lastChecked).toLocaleDateString() : " · Automated link check pending"}
      </p>
    </div> : <div className="space-y-2 border border-dashed bg-secondary/40 p-4 text-sm">
      <p className="font-medium">{proposed ? "Programme source candidate awaiting verification" : "Official programme source not yet linked"}</p>
      <p className="text-muted-foreground">No programme-specific source has been confirmed for publication. The jurisdiction portal below is a general starting point, not a citation for this programme.</p>
      {proposed && <p className="text-xs text-muted-foreground">A possible official legal reference has been identified but is withheld until verification.</p>}
      {portal && <a className="text-brand underline underline-offset-4" href={portal.url} target="_blank" rel="noopener noreferrer">{portal.label}</a>}
    </div>}
    {items.length > 0 && <section aria-label="Published official documents">
      <h3 className="mb-3 font-medium">Published official documents</h3>
      <ul className="space-y-3">
        {items.map((doc) => <li className="border bg-card p-4" key={doc.canonical_url}>
          <a href={doc.canonical_url} target="_blank" rel="noopener noreferrer"
            className="break-words font-medium text-brand underline underline-offset-4">{doc.title}</a>
          <p className="mt-2 text-xs text-muted-foreground">
            {doc.issuing_authority ?? "Official source"} · {doc.document_type.replace(/_/g, " ")}
            {doc.publication_date ? " · Published " + doc.publication_date : ""}
            {doc.link_check_status === "broken" ? " · Link may be broken" : ""}
            {doc.last_checked_at ? " · Link checked " + new Date(doc.last_checked_at).toLocaleDateString() : ""}
          </p>
        </li>)}
      </ul>
    </section>}
  </div>;
}
