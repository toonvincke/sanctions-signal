import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Own profile + roles. RLS limits both tables to the signed-in user's rows.
export const accountQuery = queryOptions({
  queryKey: ["account"],
  queryFn: async () => {
    const { data: u, error: ue } = await supabase.auth.getUser();
    if (ue || !u.user) throw ue ?? new Error("Not signed in");
    const [{ data: profile, error: pe }, { data: roles, error: re }] = await Promise.all([
      supabase.from("profiles").select("id, full_name, email, created_at").eq("id", u.user.id).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", u.user.id),
    ]);
    if (pe) throw pe;
    if (re) throw re;
    return { profile, roles: (roles ?? []).map((r) => r.role), email: u.user.email ?? "" };
  },
});
