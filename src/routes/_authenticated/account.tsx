import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { accountQuery } from "@/lib/account";
import { friendlyAuthError } from "@/lib/auth-errors";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { usePremiumAccess } from "@/hooks/use-premium-access";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({
    meta: [
      { title: "Account — Lexsanction" },
      { name: "description", content: "Manage your Lexsanction profile and password." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(accountQuery),
  component: AccountPage,
});

function AccountPage() {
  const { data } = useSuspenseQuery(accountQuery);
  const qc = useQueryClient();
  const [name, setName] = useState(data.profile?.full_name ?? "");
  const [saving, setSaving] = useState(false);
  const [current, setCurrent] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [pwBusy, setPwBusy] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!data.profile) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ full_name: name.trim() || null }).eq("id", data.profile.id);
    setSaving(false);
    if (error) toast.error("Your profile could not be saved. Please try again.");
    else {
      toast.success("Profile saved.");
      qc.invalidateQueries({ queryKey: accountQuery.queryKey });
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError(null);
    if (pw !== pw2) {
      setPwError("The two new passwords don't match.");
      return;
    }
    setPwBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw, current_password: current });
    setPwBusy(false);
    if (error) {
      setPwError(friendlyAuthError(error));
      return;
    }
    setCurrent("");
    setPw("");
    setPw2("");
    toast.success("Password changed.");
  }

  const isAdmin = data.roles.includes("admin");
  const { state: premiumState } = usePremiumAccess("eu", "account-status-only", false);

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="text-3xl">Account</h1>
      <p className="mb-6 text-sm text-muted-foreground">Your profile details and sign-in settings.</p>

      <section className="border bg-card p-6">
        <h2 className="text-lg">Profile</h2>
        <dl className="mt-4 grid grid-cols-[10rem_1fr] gap-y-2 text-sm">
          <dt className="text-muted-foreground">Email</dt>
          <dd>{data.profile?.email ?? data.email}</dd>
          <dt className="text-muted-foreground">Member since</dt>
          <dd>{data.profile ? new Date(data.profile.created_at).toLocaleDateString("en-GB", { dateStyle: "long" }) : "—"}</dd>
          <dt className="text-muted-foreground">Access level</dt>
          <dd>
            <span className="border px-2 py-0.5 font-mono text-xs uppercase tracking-wider">{isAdmin ? "Administrator" : premiumState === "premium" ? "Premium" : premiumState === "loading" ? "Checking…" : premiumState === "unavailable" ? "Unavailable" : "Free"}</span>
          </dd>
        </dl>
        <form onSubmit={saveProfile} className="mt-6 flex items-end gap-3">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="full_name">Full name</Label>
            <Input id="full_name" maxLength={120} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <Button type="submit" className="rounded-none" disabled={saving || !data.profile}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </form>
      </section>

      <section className="mt-6 border bg-card p-6">
        <h2 className="text-lg">Subscription</h2>
        <p className="mt-2 text-sm text-muted-foreground">Premium checkout and billing management are not yet available.</p>
        <Link to="/pricing" className="mt-3 inline-block text-sm text-brand underline">View subscription plans</Link>
      </section>

      <section className="mt-6 border bg-card p-6">
        <h2 className="text-lg">Change password</h2>
        <form onSubmit={changePassword} className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="cur">Current password</Label>
            <Input id="cur" type="password" required autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="npw">New password</Label>
              <Input id="npw" type="password" required minLength={8} autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="npw2">Repeat new password</Label>
              <Input id="npw2" type="password" required minLength={8} autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
            </div>
          </div>
          {pwError && (
            <p role="alert" className="border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {pwError}
            </p>
          )}
          <Button type="submit" className="rounded-none" disabled={pwBusy}>
            {pwBusy ? "Saving…" : "Change password"}
          </Button>
        </form>
      </section>
    </div>
  );
}
