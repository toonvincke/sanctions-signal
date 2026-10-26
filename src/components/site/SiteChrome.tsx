import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useSession } from "@/hooks/use-session";

export function Logo() {
  return (
    <Link to="/" className="flex items-baseline gap-2">
      <span className="font-serif text-xl font-semibold tracking-tight">Lexsanction</span>
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Intelligence</span>
    </Link>
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
      <header className="border-b bg-background/95">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Logo />
          <nav className="flex items-center gap-6 text-sm">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="hidden text-muted-foreground hover:text-foreground sm:inline"
                activeProps={{ className: "text-foreground" }}
              >
                {n.label}
              </Link>
            ))}
            {session ? (
              <Link to="/dashboard" className="bg-primary px-3 py-1.5 text-primary-foreground hover:bg-primary/90">
                Open portal
              </Link>
            ) : (
              <>
                <Link to="/auth" className="text-muted-foreground hover:text-foreground">
                  Sign in
                </Link>
                <Link
                  to="/auth"
                  search={{ mode: "signup" }}
                  className="bg-primary px-3 py-1.5 text-primary-foreground hover:bg-primary/90"
                >
                  Start trial
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t bg-secondary/60">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 py-10 text-sm text-muted-foreground md:grid-cols-3">
          <div>
            <Logo />
            <p className="mt-3 max-w-xs">Sanctions intelligence for compliance, legal and financial crime teams.</p>
          </div>
          <div className="flex flex-col gap-2">
            <Link to="/features">Features</Link>
            <Link to="/pricing">Pricing</Link>
            <Link to="/contact">Contact</Link>
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
