import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useSession } from "@/hooks/use-session";

export function Logo() {
  return (
    <Link to="/" className="flex items-baseline gap-2">
      <span className="font-serif text-xl font-semibold tracking-tight">Lexsanction</span>
      <span className="font-mono text-[10px] uppercase tracking-widest opacity-70">Intelligence</span>
    </Link>
  );
}

export const SANCTIONS_NAV = [
  { to: "/sanctions/$regime", params: { regime: "un" }, label: "UN sanctions" },
  { to: "/sanctions/$regime", params: { regime: "eu" }, label: "EU sanctions" },
  { to: "/sanctions/$regime", params: { regime: "us" }, label: "US sanctions" },
  { to: "/sanctions/$regime", params: { regime: "uk" }, label: "UK sanctions" },
  { to: "/sanctions/international", params: undefined, label: "International sanctions" },
  { to: "/enforcement", params: undefined, label: "Enforcement actions" },
] as const;

function SanctionsBar() {
  return (
    <div className="border-t border-navy-border bg-navy-deep">
      <nav
        aria-label="Sanctions programmes"
        className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-6 text-[13px]"
      >
        {SANCTIONS_NAV.map((n) => (
          <Link
            key={n.label}
            to={n.to}
            params={n.params as never}
            className="whitespace-nowrap border-b-2 border-transparent px-3 py-2.5 text-navy-muted transition-colors hover:text-navy-foreground"
            activeProps={{ className: "border-navy-accent text-navy-foreground" }}
          >
            {n.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export function SiteLayout({ children }: { children: ReactNode }) {
  const { session } = useSession();
  const nav = [
    { to: "/features", label: "Features" },
    { to: "/pricing", label: "Pricing" },
    { to: "/contact", label: "Contact" },
  ] as const;
  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-navy text-navy-foreground">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Logo />
          <nav className="flex items-center gap-6 text-sm">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="hidden text-navy-muted hover:text-navy-foreground sm:inline"
                activeProps={{ className: "text-navy-foreground" }}
              >
                {n.label}
              </Link>
            ))}
            {session ? (
              <Link to="/dashboard" className="bg-navy-foreground px-3 py-1.5 text-navy hover:opacity-90">
                Open portal
              </Link>
            ) : (
              <>
                <Link to="/auth" className="text-navy-muted hover:text-navy-foreground">
                  Sign in
                </Link>
                <Link
                  to="/auth"
                  search={{ mode: "signup" }}
                  className="bg-navy-foreground px-3 py-1.5 font-medium text-navy hover:opacity-90"
                >
                  Start trial
                </Link>
              </>
            )}
          </nav>
        </div>
        <SanctionsBar />
      </header>
      <main className="flex-1">{children}</main>
      <footer className="bg-navy text-navy-muted">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 py-10 text-sm md:grid-cols-4">
          <div className="text-navy-foreground">
            <Logo />
            <p className="mt-3 max-w-xs text-navy-muted">
              Sanctions intelligence for compliance, legal and financial crime teams.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            {SANCTIONS_NAV.map((n) => (
              <Link key={n.label} to={n.to} params={n.params as never} className="hover:text-navy-foreground">
                {n.label}
              </Link>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            <Link to="/features" className="hover:text-navy-foreground">Features</Link>
            <Link to="/pricing" className="hover:text-navy-foreground">Pricing</Link>
            <Link to="/contact" className="hover:text-navy-foreground">Contact</Link>
          </div>
          <p className="text-xs leading-relaxed">
            Content is provided for information purposes and does not constitute legal advice. Always verify against the
            linked primary source before relying on any summary.
          </p>
        </div>
      </footer>
    </div>
  );
}

export function PhotoCredit({ credit, url }: { credit: string; url: string }) {
  return (
    <a href={url} target="_blank" rel="noreferrer" className="hover:underline">
      Photo: {credit}
    </a>
  );
}
