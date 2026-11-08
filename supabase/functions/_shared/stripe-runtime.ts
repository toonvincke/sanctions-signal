import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export function billingEnv(requireAppOrigin = true) {
  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const appOrigin = Deno.env.get("STRIPE_APP_ORIGIN") ?? "";
  if (!stripeKey.startsWith("sk_test_") || !supabaseUrl || !serviceKey || (requireAppOrigin && !appOrigin)) {
    throw new Error("Stripe test-mode billing is not configured");
  }
  if (requireAppOrigin) {
    const parsed = new URL(appOrigin);
    if (parsed.origin !== appOrigin || (parsed.protocol !== "https:" && !(parsed.protocol === "http:" && parsed.hostname === "localhost"))) {
      throw new Error("Invalid trusted application origin");
    }
  }
  return { stripeKey, appOrigin, admin: createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } }) };
}
export function corsHeaders(req: Request, appOrigin: string): HeadersInit {
  const origin = req.headers.get("origin");
  return origin === appOrigin ? { "Access-Control-Allow-Origin": appOrigin, "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info", "Access-Control-Allow-Methods": "POST, OPTIONS", "Vary": "Origin" } : { "Vary": "Origin" };
}
export function response(body: unknown, status = 200, headers: HeadersInit = {}): Response {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });
}
export async function stripeRequest(stripeKey: string, endpoint: string, params?: URLSearchParams): Promise<Record<string, unknown>> {
  if (!stripeKey.startsWith("sk_test_")) throw new Error("Live Stripe access is blocked");
  const result = await fetch(`https://api.stripe.com/v1/${endpoint}`, {
    method: params ? "POST" : "GET",
    headers: { Authorization: `Bearer ${stripeKey}`, ...(params ? { "Content-Type": "application/x-www-form-urlencoded" } : {}) },
    ...(params ? { body: params.toString() } : {}),
  });
  if (!result.ok) {
    console.error("[Stripe] Request rejected", result.status);
    throw new Error("Stripe provider request failed");
  }
  const json = await result.json();
  if (!json || typeof json !== "object" || json.livemode !== false) throw new Error("Non-test Stripe response rejected");
  return json;
}
export async function authenticatedUser(req: Request, admin: ReturnType<typeof createClient>) {
  const authorization = req.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(authorization);
  if (!match) return null;
  const { data, error } = await admin.auth.getUser(match[1]);
  return error ? null : data.user;
}
export async function verifiedCustomer(admin: ReturnType<typeof createClient>, userId: string) {
  const { data, error } = await admin.from("user_subscriptions")
    .select("provider_customer_id,provider_subscription_id,status,current_period_end")
    .eq("user_id", userId).maybeSingle();
  if (error) throw new Error("Could not verify current subscription");
  return data as { provider_customer_id: string | null; provider_subscription_id: string | null; status: string; current_period_end: string } | null;
}
