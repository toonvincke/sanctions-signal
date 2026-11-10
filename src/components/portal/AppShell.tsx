import { Link, useNavigate, useRouteContext } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { LayoutDashboard, Search, Bookmark, LogOut, Gavel, Scale, FileText, Globe2, UserRound, ClipboardCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const primary = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/explorer", label: "Intelligence Explorer", icon: Search },
  { to: "/bookmarks", label: "Bookmarks", icon: Bookmark },
] as const;

const sections = [
  { type: "sanctions_development", label: "Developments", icon: Globe2 },
  { type: "case_law", label: "Case law", icon: Scale },
  { type: "enforcement_action", label: "Enforcement", icon: Gavel },
  { type: "guidance", label: "Guidance", icon: FileText },
  { type: "legislation", label: "Legislation", icon: FileText },
  { type: "circumvention", label: "Circumvention", icon: Search },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { user } = useRouteContext({ from: "/_authenticated" });
  const qc = useQueryClient();
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    let active = true;
    void supabase.from("user_roles").select("id").eq("user_id", user.id).eq("role", "admin")
      .maybeSingle().then(({ data, error }) => { if (active) setIsAdmin(!error && Boolean(data)); });
    return () => { active = false; };
  }, [user.id]);
  const navigate = useNavigate();
  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }
  const linkCls = "flex items-center gap-2.5 px-3 py-1.5 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";
  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex">
        <Link to="/" className="px-5 py-5">
          <div className="font-serif text-lg font-semibold text-sidebar-primary">Sanctions Signal</div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-sidebar-foreground/60">Intelligence portal</div>
        </Link>
        <nav className="flex flex-col gap-0.5 px-2">
          {primary.map((n) => (
            <Link key={n.to} to={n.to} className={linkCls} activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground" }}>
              <n.icon className="h-4 w-4" /> {n.label}
            </Link>
          ))}
        </nav>
        {isAdmin && <nav className="mt-3 px-2">
          <Link to="/editorial" className={linkCls} activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground" }}>
            <ClipboardCheck className="h-4 w-4" /> Editorial review
          </Link>
        </nav>}
        <div className="mt-6 px-5 font-mono text-[10px] uppercase tracking-widest text-sidebar-foreground/50">Content</div>
        <nav className="mt-2 flex flex-col gap-0.5 px-2">
          {sections.map((s) => (
            <Link key={s.type} to="/explorer" search={{ type: s.type }} className={linkCls}>
              <s.icon className="h-4 w-4" /> {s.label}
            </Link>
          ))}
        </nav>
      <div className="mt-auto border-t border-sidebar-border p-4 text-xs">
          <div className="truncate text-sidebar-foreground/70">{user.email}</div>
          <Link to="/account" className="mt-2 flex items-center gap-2 text-sidebar-foreground/80 hover:text-sidebar-primary">
            <UserRound className="h-3.5 w-3.5" /> Account
          </Link>
          <button onClick={signOut} className="mt-2 flex items-center gap-2 text-sidebar-foreground/80 hover:text-sidebar-primary">
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b bg-card px-4 py-3 md:hidden">
          <span className="font-serif font-semibold">Sanctions Signal</span>
          <div className="flex gap-4 text-sm">
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/explorer">Explorer</Link>
            <Link to="/bookmarks">Saved</Link>
            <Link to="/account">Account</Link>
            {isAdmin && <Link to="/editorial">Review</Link>}
          </div>
        </div>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
