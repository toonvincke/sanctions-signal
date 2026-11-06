import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type ContentType = Database["public"]["Enums"]["content_type"];
export type LegalStatus = Database["public"]["Enums"]["legal_status"];
export type Verification = Database["public"]["Enums"]["verification_status"];

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  sanctions_development: "Sanctions Development",
  case_law: "Case Law & Judgment",
  enforcement_action: "Enforcement Action",
  guidance: "Regulatory Guidance",
  legislation: "Legislation",
  circumvention: "Circumvention Intelligence",
};

export const LEGAL_STATUS_LABELS: Record<LegalStatus, string> = {
  final_judgment: "Final judgment",
  interim: "Interim decision",
  ag_opinion: "Advocate General opinion",
  settlement: "Settlement",
  penalty_notice: "Penalty notice",
  conviction: "Criminal conviction",
  allegation: "Allegation (unproven)",
  in_force: "In force",
  announced: "Announced, not yet in force",
  not_applicable: "—",
};

export const VERIFICATION_LABELS: Record<Verification, string> = {
  verified: "Verified against source",
  pending_review: "Pending editorial review",
  unverified: "Unverified",
};

export const RECORD_SELECT =
  "*, jurisdiction:jurisdictions(code,name), regime:regimes(slug,name), authority:authorities(slug,name,short_name), record_categories(category:categories(slug,name))";

// Public list views must NEVER query full intelligence_records. Approved headline-only
// previews are published into a separate table by the database trigger.
const LIST_SELECT =
  "record_id,slug,content_type,headline,publication_date,jurisdiction:jurisdictions(code,name), regime:regimes(slug,name), authority:authorities(slug,short_name)";

export type ExplorerFilters = {
  q?: string | undefined;
  type?: ContentType | undefined;
  jurisdiction?: string | undefined;
  regime?: string | undefined;
  authority?: string | undefined;
  category?: string | undefined;
};

export function formatMoney(amount: number | null, currency: string | null) {
  if (amount == null || !currency) return null;
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d + (d.length === 10 ? "T00:00:00Z" : "")).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export const facetsQuery = queryOptions({
  queryKey: ["facets"],
  queryFn: async () => {
    const [j, r, a, c] = await Promise.all([
      supabase.from("jurisdictions").select("id,code,name").order("name"),
      supabase.from("regimes").select("id,slug,name").order("name"),
      supabase.from("authorities").select("id,slug,short_name,name").order("short_name"),
      supabase.from("categories").select("id,slug,name").order("name"),
    ]);
    for (const res of [j, r, a, c]) if (res.error) throw res.error;
    return { jurisdictions: j.data!, regimes: r.data!, authorities: a.data!, categories: c.data! };
  },
  staleTime: 5 * 60_000,
});

export const recordsQuery = (f: ExplorerFilters) =>
  queryOptions({
    queryKey: ["public-intelligence-previews", f],
    queryFn: async () => {
      const facets = await facetsQuery.queryFn!({} as never);
      // Category relationships are not published into public headlines.
      // Never silently fall back to the protected records table.
      if (f.category) return [] as ListRecord[];
      let q = supabase.from("intelligence_previews" as never)
        .select(LIST_SELECT).order("publication_date", { ascending: false });
      if (f.q) q = q.ilike("headline", `%${f.q.replace(/[%_]/g, "")}%`);
      if (f.type) q = q.eq("content_type", f.type);
      const jid = facets.jurisdictions.find((x) => x.code === f.jurisdiction)?.id;
      if (f.jurisdiction && jid) q = q.eq("jurisdiction_id", jid);
      const rid = facets.regimes.find((x) => x.slug === f.regime)?.id;
      if (f.regime && rid) q = q.eq("regime_id", rid);
      const aid = facets.authorities.find((x) => x.slug === f.authority)?.id;
      if (f.authority && aid) q = q.eq("authority_id", aid);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).map((record) => {
        const row = record as unknown as {
          record_id: string; slug: string; content_type: ContentType; headline: string;
          publication_date: string; jurisdiction: ListRecord["jurisdiction"];
          regime: ListRecord["regime"]; authority: ListRecord["authority"];
        };
        return {
          id: row.record_id, slug: row.slug, content_type: row.content_type,
          headline: row.headline, publication_date: row.publication_date,
          jurisdiction: row.jurisdiction, regime: row.regime, authority: row.authority,
          executive_summary: "", effective_date: null, penalty_amount: null,
          penalty_currency: null, legal_status: "not_applicable" as LegalStatus,
          verification_status: "verified" as Verification,
          priority: false, case_number: null,
        };
      }) as ListRecord[];
    },
  });

export type ListRecord = {
  id: string;
  slug: string;
  content_type: ContentType;
  headline: string;
  executive_summary: string;
  publication_date: string;
  effective_date: string | null;
  penalty_amount: number | null;
  penalty_currency: string | null;
  legal_status: LegalStatus;
  verification_status: Verification;
  priority: boolean;
  case_number: string | null;
  jurisdiction: { code: string; name: string } | null;
  regime: { slug: string; name: string } | null;
  authority: { slug: string; short_name: string } | null;
};

export const recordQuery = (slug: string) =>
  queryOptions({
    queryKey: ["record", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("intelligence_records")
        .select(RECORD_SELECT)
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const bookmarksQuery = queryOptions({
  queryKey: ["bookmarks"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("bookmarks")
      .select("id, record_id, created_at, record:intelligence_records(" + LIST_SELECT + ")")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data as unknown as { id: string; record_id: string; created_at: string; record: ListRecord }[];
  },
});
