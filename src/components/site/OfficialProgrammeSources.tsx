import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type PublicDocument = {
  canonical_url: string; title: string; issuing_authority: string | null;
  publication_date: string | null; document_type: string;
};

/** Client-only, public and explicitly field-limited queries; RLS denies draft sources. */
export function OfficialProgrammeSources({ jurisdiction, slug }: { jurisdiction: string; slug: string }) {
  const [items, setItems] = useState<PublicDocument[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable">("loading");

  useEffect(() => {
    let active = true;
    setItems([]);
    setStatus("loading");
    async function load() {
      const { data: programme, error: pError } = await supabase.from("sanctions_programmes" as never)
        .select("id").eq("jurisdiction", jurisdiction).eq("slug", slug).maybeSingle();
      if (pError) throw pError;
      if (!programme) return [];
      const row = programme as { id: string };
      const { data, error } = await supabase.from("programme_documents" as never)
        .select("document:official_documents(canonical_url,title,issuing_authority,publication_date,document_type)")
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
  if (!items.length) return <p className="border border-dashed bg-secondary/40 px-4 py-5 text-sm text-muted-foreground">No programme-specific official documents have been technically validated for publication yet.</p>;
  return <div className="space-y-3">
    <p className="text-xs text-muted-foreground">Official source metadata only. Links and publication dates do not constitute legal advice or an assessment of the measures.</p>
    <ul className="space-y-3">
      {items.map((doc) => <li className="border bg-card p-4" key={doc.canonical_url}>
        <a href={doc.canonical_url} target="_blank" rel="noopener noreferrer" className="break-words font-medium text-brand underline underline-offset-4">{doc.title}</a>
        <p className="mt-2 text-xs text-muted-foreground">{doc.issuing_authority ?? "Official source"} · {doc.document_type.replace(/_/g, " ")}{doc.publication_date ? " · " + doc.publication_date : ""}</p>
      </li>)}
    </ul>
  </div>;
}
