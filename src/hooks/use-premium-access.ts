import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { hasPremiumAccess, type SubscriptionStatus } from "@/lib/subscription-plans";

export type PremiumSection = {
  section_key: "legal-framework" | "restrictions" | "guidance" | "licensing" | "updates";
  title: string;
  body: string;
  source_url: string | null;
};

type SubscriptionRow = { status: SubscriptionStatus; current_period_end: string };
type AccessState = "loading" | "anonymous" | "free" | "premium" | "admin" | "unavailable";

/**
 * UI state only. The actual premium document access is enforced independently
 * by PostgreSQL RLS in migration 0008; this hook must never grant DB access.
 */
export function usePremiumAccess(jurisdiction: string, slug: string) {
  const { session, loading } = useSession();
  const userId = session?.user.id;
  const [state, setState] = useState<AccessState>("loading");
  const [sections, setSections] = useState<PremiumSection[]>([]);
  useEffect(() => {
    let cancelled = false;
    setSections([]);
    if (loading) { setState("loading"); return; }
    if (!userId) { setState("anonymous"); return; }

    async function load() {
      setState("loading");
      try {
        const [{ data: roles, error: roleError }, { data: subscription, error: subError }] = await Promise.all([
          supabase.from("user_roles").select("role").eq("user_id", userId!),
          supabase.from("user_subscriptions" as never).select("status,current_period_end").eq("user_id", userId!).maybeSingle(),
        ]);
        if (cancelled) return;
        if (roleError || subError) throw roleError ?? subError;
        const admin = (roles ?? []).some((r) => r.role === "admin");
        const sub = subscription as unknown as SubscriptionRow | null;
        const entitled = admin || hasPremiumAccess(sub?.status ?? null, sub?.current_period_end ?? null);
        if (!entitled) { setState("free"); return; }

        // The SELECT policy applies the same entitlement/role checks server-side.
        // An attacker cannot bypass RLS by invoking this query directly.
        const { data, error } = await supabase.from("programme_premium_sections" as never)
          .select("section_key,title,body,source_url")
          .eq("jurisdiction", jurisdiction).eq("programme_slug", slug)
          .order("section_key").order("title");
        if (cancelled) return;
        if (error) throw error;
        setSections((data ?? []) as unknown as PremiumSection[]);
        setState(admin ? "admin" : "premium");
      } catch (error) {
        if (cancelled) return;
        console.error("[Premium] Could not verify membership or load protected content:", error);
        setSections([]);
        setState("unavailable"); // fail closed: never assume paid access
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [userId, loading, jurisdiction, slug]);

  return { state, sections, isPremium: state === "premium" || state === "admin" };
}
