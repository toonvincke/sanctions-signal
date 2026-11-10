import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/site/SiteChrome";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { friendlyAuthError } from "@/lib/auth-errors";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new password — Sanctions Signal" },
      { name: "description", content: "Choose a new password for your Sanctions Signal account." },
      { property: "og:title", content: "Set a new password — Sanctions Signal" },
      { property: "og:description", content: "Choose a new password for your Sanctions Signal account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState<"checking" | "ok" | "invalid">("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    if (hash.get("error_description")) {
      setError(friendlyAuthError({ message: hash.get("error_description"), code: hash.get("error_code") }));
      setReady("invalid");
      return;
    }
    const isRecovery = hash.get("type") === "recovery";
    const { data } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === "PASSWORD_RECOVERY" || (s && isRecovery)) setReady("ok");
    });
    supabase.auth.getSession().then(({ data: d }) => {
      if (d.session) setReady("ok");
      else if (!isRecovery) setReady("invalid");
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("The two passwords don't match.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      setError(friendlyAuthError(error));
      return;
    }
    toast.success("Password updated.");
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/40 px-4">
      <div className="w-full max-w-sm border bg-card p-8">
        <Logo />
        <h1 className="mt-6 text-2xl">Set a new password</h1>
        {ready === "checking" && <p className="mt-4 text-sm text-muted-foreground">Checking your reset link…</p>}
        {ready === "invalid" && (
          <div className="mt-4 space-y-4 text-sm">
            <p className="border border-destructive/40 bg-destructive/5 px-3 py-2 text-destructive">
              {error ?? "This reset link is invalid or has expired. Request a new one."}
            </p>
            <Link to="/auth" search={{ mode: "forgot" }} className="underline underline-offset-4">
              Request a new reset link
            </Link>
          </div>
        )}
        {ready === "ok" && (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="pw">New password</Label>
              <Input id="pw" type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pw2">Repeat new password</Label>
              <Input id="pw2" type="password" required minLength={8} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </div>
            {error && (
              <p role="alert" className="border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full rounded-none" disabled={busy}>
              {busy ? "Saving…" : "Save new password"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
