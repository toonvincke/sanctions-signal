import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Logo } from "@/components/site/SiteChrome";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { friendlyAuthError } from "@/lib/auth-errors";

type Mode = "signin" | "signup" | "forgot";

export const Route = createFileRoute("/auth")({
  validateSearch: z.object({ mode: z.enum(["signin", "signup", "forgot"]).optional() }),
  head: () => ({
    meta: [
      { title: "Sign in — Lexsanction" },
      { name: "description", content: "Sign in or create a Lexsanction account." },
      { property: "og:title", content: "Sign in — Lexsanction" },
      { property: "og:description", content: "Access the Lexsanction sanctions intelligence portal." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { mode: initial } = Route.useSearch();
  const [mode, setMode] = useState<Mode>(initial ?? "signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [canResend, setCanResend] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) navigate({ to: "/dashboard", replace: true });
      });
      const { data } = supabase.auth.onAuthStateChange((event, s) => {
        if (event === "PASSWORD_RECOVERY") {
          navigate({ to: "/reset-password", replace: true });
          return;
        }
        if (s) navigate({ to: "/dashboard", replace: true });
      });
      return () => data.subscription.unsubscribe();
    } catch (err) {
      console.error("[Supabase] Auth unavailable:", err);
      return undefined;
    }
  }, [navigate]);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setNotice(null);
    setCanResend(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    setCanResend(false);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin + "/auth",
            data: { full_name: fullName.trim() },
          },
        });
        if (error) throw error;
        // An existing confirmed email returns a user with no identities.
        if (data.user && data.user.identities?.length === 0) {
          setError("An account with this email already exists. Sign in instead.");
          return;
        }
        setNotice(`We sent a confirmation link to ${email}. Open it to activate your account, then sign in.`);
        setCanResend(true);
        setPassword("");
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + "/reset-password",
        });
        if (error) throw error;
        setNotice(`If an account exists for ${email}, a password reset link is on its way.`);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (error.code === "email_not_confirmed" || /not confirmed/i.test(error.message)) setCanResend(true);
          throw error;
        }
      }
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    if (!email) {
      setError("Enter your email address first.");
      return;
    }
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: window.location.origin + "/auth" },
    });
    if (error) setError(friendlyAuthError(error));
    else toast.success("Confirmation email sent again.");
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (r.error) setError(friendlyAuthError(r.error));
  }

  const title = mode === "signup" ? "Create your account" : mode === "forgot" ? "Reset your password" : "Sign in";

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/40 px-4">
      <div className="w-full max-w-sm border bg-card p-8">
        <Logo />
        <h1 className="mt-6 text-2xl">{title}</h1>
        {mode === "forgot" && (
          <p className="mt-2 text-sm text-muted-foreground">Enter your work email and we'll send you a reset link.</p>
        )}
        <form onSubmit={submit} className="mt-6 space-y-4">
          {mode === "signup" && (
            <div className="space-y-1.5">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" required maxLength={120} value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email">Work email</Label>
            <Input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          {mode !== "forgot" && (
            <div className="space-y-1.5">
              <div className="flex items-baseline justify-between">
                <Label htmlFor="password">Password</Label>
                {mode === "signin" && (
                  <button type="button" onClick={() => switchMode("forgot")} className="text-xs text-muted-foreground hover:underline">
                    Forgot password?
                  </button>
                )}
              </div>
              <Input
                id="password"
                type="password"
                required
                minLength={8}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {mode === "signup" && <p className="text-xs text-muted-foreground">At least 8 characters.</p>}
            </div>
          )}
          {error && (
            <p role="alert" className="border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
          {notice && (
            <p role="status" className="border bg-secondary px-3 py-2 text-sm">
              {notice}
            </p>
          )}
          {canResend && (
            <button type="button" onClick={resend} className="text-sm underline underline-offset-4">
              Resend confirmation email
            </button>
          )}
          <Button type="submit" className="w-full rounded-none" disabled={busy}>
            {busy ? "Please wait…" : mode === "signup" ? "Create account" : mode === "forgot" ? "Send reset link" : "Sign in"}
          </Button>
        </form>
        {mode !== "forgot" && (
          <Button variant="outline" className="mt-3 w-full rounded-none" onClick={google}>
            Continue with Google
          </Button>
        )}
        <div className="mt-6 flex flex-col items-start gap-2 text-sm text-muted-foreground">
          {mode === "forgot" ? (
            <button className="underline-offset-4 hover:underline" onClick={() => switchMode("signin")}>
              Back to sign in
            </button>
          ) : (
            <button className="underline-offset-4 hover:underline" onClick={() => switchMode(mode === "signup" ? "signin" : "signup")}>
              {mode === "signup" ? "Already have an account? Sign in" : "New here? Create an account"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
