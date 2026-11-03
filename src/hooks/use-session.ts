import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    // The client throws when backend config is missing; keep public pages rendering.
    try {
      const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
      supabase.auth
        .getSession()
        .then(({ data }) => setSession(data.session))
        .catch(() => setSession(null))
        .finally(() => setLoading(false));
      return () => data.subscription.unsubscribe();
    } catch (error) {
      console.error("[Supabase] Session unavailable:", error);
      setLoading(false);
      return undefined;
    }
  }, []);
  return { session, loading };
}
