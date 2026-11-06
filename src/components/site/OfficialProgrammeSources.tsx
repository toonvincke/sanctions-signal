import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { OFFICIAL_LEGAL_PORTALS } from "@/lib/programme-detail";
import type { RegimeSlug } from "@/lib/sanctions-programs";

type PublicDocument = {
  canonical_url: string; title: string; issuing_authority: string | null;
  publication_date: string | null; document_type: string;
  link_check_status?: string | null; last_checked_at?: string | null;
};

/** Client-only, public and explicitly field-limited queries; RLS denies draft sources. */
export function OfficialProgrammeSources({ jurisdiction, slug }: { jurisdiction: string; slug: string }) {
  const [items, setItems] = useState<PublicDocument[]>([]);
  const [coverage, setCoverage] = useState<{ mapping: string; lastChecked: string | null }>({ mapping: "needs_mapping", lastChecked: null });
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable">("loading");

  useEffect(() => {
    let active = true;
    setItems([]);
    setCoverage({ mapping: "needs_mapping", lastChecked: null });
    setStatus("loading");
    async function load() {
      const { data: programme, error: pError } = await supabase.from("sanctions_programmes" as never)
        .select("id,source_mapping_status,source_last_checked_at").eq("jurisdiction", jurisdiction).eq("slug", slug).maybeSingle();
      if (pError) throw pError;
      if (!programme) return [];
      const row = programme as { id: string; source_mapping_status?: string; source_last_checked_at?: string | null };
      if (active) setCoverage({ mapping: row.source_mapping_status ?? "needs_mapping", lastChecked: row.source_last_checked_at ?? null });
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
    }).catch(() => {
      if (active) setStatus("unavailable");
    });
    return () => { active = false; };
  }, [jurisdiction, slug]);

  if (status === "loading") return <p role="status" className="text-sm text-muted-foreground">Loading official document references…</p>;
  if (status === "unavailable") return <p role="status" className="text-sm text-muted-foreground">Official document references are temporarily unavailable.</p>;
  if (!items.length) {
    const portal = OFFICIAL_LEGAL_PORTALS[jurisdiction as RegimeSlug];
    return <div className="space-y-3 border border-dashed bg-secondary/40 px-4 py-5 text-sm">
      <p className="font-medium">Official programme source not yet linked</p>
      <p className="text-muted-foreground">This programme is in the source-mapping queue. No programme-specific official citation has been verified for publication. The link below is a jurisdiction-wide starting point, not evidence for this programme.</p>
      {portal && <a className="text-brand underline underline-offset-4" href={portal.url} target="_blank" rel="noopener noreferrer">{portal.label}</a>}
      <p className="text-xs text-muted-foreground">Coverage: {coverage.mapping.replaceAll("_", " ")}{coverage.lastChecked ? " · last checked " + new Date(coverage.lastChecked).toLocaleDateString() : " · no verified check recorded"}</p>
    </div>;
  }
  return <div className="space-y-3">
    <p className="text-xs text-muted-foreground">Official source metadata only. Links and publication dates do not constitute legal advice or an assessment of the measures.</p>
    <ul className="space-y-3">
      {items.map((doc) => <li className="border bg-card p-4" key={doc.canonical_url}>
        <a href={doc.canonical_url} target="_blank" rel="noopener noreferrer" className="break-words font-medium text-brand underline underline-offset-4">{doc.title}</a>
        <p className="mt-2 text-xs text-muted-foreground">{doc.issuing_authority ?? "Official source"} · {doc.document_type.replace(/_/g, " ")}{doc.publication_date ? " · " + doc.publication_date : ""}{doc.link_check_status === "broken" ? " · Link may be broken" : ""}{doc.last_checked_at ? " · Checked " + new Date(doc.last_checked_at).toLocaleDateString() : ""}</p>
      </li>)}
    </ul>
  </div>;
}
